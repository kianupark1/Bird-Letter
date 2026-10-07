"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBird } from "./birds";
import { getRoute } from "./routes";
import { travelMinutes } from "./geo";
import { ensureUser, firebaseEnabled } from "./firebase/client";
import * as remote from "./firebase/remote";

export type Letter = {
  id: string;
  to: string;
  routeId: string;
  birdId: string;
  message: string;
  /** 보낸 시각(ms) */
  sentAt: number;
  /** 도착 시각(ms). 서버에 저장된 편지는 이 값을 기준으로 진행률을 계산 */
  arriveAt?: number;
};

/** 같은 화면의 다른 부분(알림 담당 등)이 새로 보낸·받은 편지를 바로 알도록 전하는 신호 */
const BUS = "saepyeonji:letters";
type BusEvent = { type: "sent"; letter: Letter } | { type: "received"; meta: remote.Meta };
const announce = (detail: BusEvent) => { try { window.dispatchEvent(new CustomEvent(BUS, { detail })); } catch {} };
/** 링크로 편지를 처음 열어 받는 사람이 됐을 때 알려요 */
export const announceReceived = (meta: remote.Meta) => announce({ type: "received", meta });

export const LETTERS_KEY = "saepyeonji.letters.v1";
const KEY = LETTERS_KEY;
export const ONBOARDED_KEY = "saepyeonji.onboarded.v1";

/** 받은 편지함 샘플. 서버를 쓰지 않는 상태(내 폰 저장)에서만 화면 확인용으로 보여줌 */
export const SAMPLE_INBOX = [
  { id: "in1", from: "엄마", birdId: "crane", routeId: "seoul-busan", preview: "밥은 잘 챙겨 먹고 있니?", when: "어제" },
  { id: "in2", from: "민수", birdId: "swallow", routeId: "seoul-jeju", preview: "제주 도착! 바람이 엄청 불어", when: "3일 전" },
];

export function letterProgress(l: Pick<Letter, "birdId" | "routeId" | "sentAt" | "arriveAt">, now: number) {
  const total = l.arriveAt
    ? Math.max(1, (l.arriveAt - l.sentAt) / 60000)
    : travelMinutes(getBird(l.birdId), getRoute(l.routeId).km);
  const elapsed = (now - l.sentAt) / 60000;
  return { total, elapsed, p: Math.min(1, Math.max(0, elapsed / total)), done: elapsed >= total };
}

export function useNow(intervalMs = 15000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(t);
  }, [intervalMs]);
  return now;
}

/** checking: 확인 중 / firebase: 서버 저장 / local: 서버 없이 내 폰에만 저장 */
export type Backend = "checking" | "firebase" | "local";

export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [received, setReceived] = useState<remote.Meta[]>([]);
  const [ready, setReady] = useState(false);
  const [backend, setBackendState] = useState<Backend>("checking");
  // 서버 연결 확인이 끝나기 전에 "보내기"를 눌러도 잘못 저장되지 않도록, 확인이 끝날 때까지 기다리게 하는 장치
  const backendRef = useRef<Backend>("checking");
  const settled = useRef<{ promise: Promise<void>; done: () => void } | null>(null);
  if (!settled.current) {
    let done!: () => void;
    settled.current = { promise: new Promise<void>((r) => (done = r)), done };
  }
  const setBackend = useCallback((b: Backend) => {
    backendRef.current = b;
    setBackendState(b);
    if (b !== "checking") settled.current?.done();
  }, []);

  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent<BusEvent>).detail;
      if (d.type === "sent") setLetters((prev) => (prev.some((x) => x.id === d.letter.id) ? prev : [d.letter, ...prev]));
      else setReceived((prev) => (prev.some((x) => x.id === d.meta.id) ? prev : [d.meta, ...prev]));
    };
    window.addEventListener(BUS, h);
    return () => window.removeEventListener(BUS, h);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (firebaseEnabled) {
        try {
          const user = await ensureUser();
          const [sent, recv, blocked] = await Promise.all([
            remote.listSent(user.uid),
            remote.listReceived(user.uid),
            remote.listBlocked(user.uid),
          ]);
          // 보낸 사람은 도착 전에도 자기 편지 내용을 읽을 수 있음
          const mine: Letter[] = await Promise.all(
            sent.map(async (m) => ({
              id: m.id,
              to: m.toName,
              routeId: m.routeId,
              birdId: m.birdId,
              message: (await remote.getBody(m.id)) ?? "",
              sentAt: m.sentAt,
              arriveAt: m.arriveAt,
            })),
          );
          if (cancelled) return;
          setLetters(mine);
          setReceived(recv.filter((r) => !blocked.has(r.fromUid)));
          setBackend("firebase");
          setReady(true);
          return;
        } catch (e) {
          console.warn("서버에 연결하지 못해 내 폰 저장으로 전환해요.", e);
        }
      }
      try {
        const raw = localStorage.getItem(KEY);
        if (raw && !cancelled) setLetters(JSON.parse(raw));
      } catch {}
      if (!cancelled) {
        setBackend("local");
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [setBackend]);

  const persist = useCallback((next: Letter[]) => {
    setLetters(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  /** 편지 보내기. 서버 저장이 실패하면 오류를 그대로 던져서 화면이 알려주게 한다(조용히 내 폰에만 저장하지 않음). */
  const add = useCallback(
    async (l: Omit<Letter, "id" | "sentAt" | "arriveAt"> & { fromName?: string; speed?: number }) => {
      await settled.current!.promise; // 서버 연결 확인이 끝날 때까지 기다림
      if (backendRef.current === "firebase") {
        const id = await remote.sendLetter({
          toName: l.to, fromName: l.fromName ?? "", routeId: l.routeId, birdId: l.birdId, message: l.message, speed: l.speed,
        });
        const meta = await remote.getMeta(id);
        const letter: Letter = {
          id, to: l.to, routeId: l.routeId, birdId: l.birdId, message: l.message,
          sentAt: meta?.sentAt ?? Date.now(), arriveAt: meta?.arriveAt,
        };
        setLetters((prev) => [letter, ...prev]);
        announce({ type: "sent", letter });
        return id;
      }
      const sentAt = Date.now();
      const minutes = travelMinutes(getBird(l.birdId), getRoute(l.routeId).km) / (l.speed ?? 1);
      const letter: Letter = {
        id: Math.random().toString(36).slice(2, 9), to: l.to, routeId: l.routeId, birdId: l.birdId,
        message: l.message, sentAt, arriveAt: sentAt + minutes * 60000,
      };
      persist([letter, ...letters]);
      announce({ type: "sent", letter });
      return letter.id;
    },
    [letters, persist],
  );

  /** 데모용(내 폰 저장에서만): 보낸 시각을 앞당겨 도착 연출을 빨리 본다 */
  const fastForward = useCallback(
    (id: string, minutes: number) =>
      persist(letters.map((l) => (l.id === id ? { ...l, sentAt: l.sentAt - minutes * 60000 } : l))),
    [letters, persist],
  );

  return { letters, received, ready, backend, add, fastForward };
}
