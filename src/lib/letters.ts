"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBird } from "./birds";
import { getRoute } from "./routes";
import { travelMinutes } from "./geo";
import { planFor, progressAt, totalMinutes, type Plan } from "./flight";
import { ensureUser, firebaseEnabled } from "./firebase/client";
import * as remote from "./firebase/remote";
import { isScheduled } from "../../core/schedule";

export type Letter = {
  id: string;
  to: string;
  routeId: string;
  birdId: string;
  message: string;
  /** 새가 출발한 시각(ms). 예약한 편지는 예약한 출발 시각이라 미래일 수 있어요 */
  sentAt: number;
  /** 도착 시각(ms). 서버에 저장된 편지는 이 값을 기준으로 진행률을 계산 */
  arriveAt?: number;
  /** 친구에게 앱 안에서 바로 보낸 편지면 받는 친구의 uid */
  toUid?: string;
  /** 편지에 담은 사진(줄인 JPEG 글자). 서버 편지는 열 때 불러와요 */
  photos?: string[];
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

/** 편지의 비행 계획(사고 포함). 도착 시각이 없던 옛 편지는 사고 없이 계산해요 */
export function letterPlan(l: Pick<Letter, "id" | "birdId" | "routeId" | "sentAt" | "arriveAt">): Plan {
  const arriveAt = l.arriveAt ?? l.sentAt + travelMinutes(getBird(l.birdId), getRoute(l.routeId).km) * 60000;
  return planFor(l.arriveAt ? l.id : "", l.birdId, l.sentAt, arriveAt);
}

export function letterProgress(l: Pick<Letter, "id" | "birdId" | "routeId" | "sentAt" | "arriveAt">, now: number) {
  const plan = letterPlan(l);
  const elapsedMs = now - l.sentAt;
  const pr = progressAt(plan, elapsedMs);
  return { total: plan.totalMs / 60000, elapsed: elapsedMs / 60000, p: pr.p, done: pr.done, stalled: pr.stalled, mishap: plan.mishap, plan };
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
  const [receivedAll, setReceived] = useState<remote.Meta[]>([]);
  const nowTick = useNow(15000);
  // 예약 편지는 출발하기 전에는 받는 사람에게 보이지 않아요(기다림의 미학: 깜짝 선물)
  const received = receivedAll.filter((m) => !isScheduled(m.sentAt, nowTick));
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
              toUid: m.recipientUid ?? undefined,
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

  // 서버를 쓰는 동안 1분마다 받은 편지를 다시 불러와서, 친구가 보낸 편지·출발한 예약 편지가 새로고침 없이 나타나게 해요
  useEffect(() => {
    if (backend !== "firebase") return;
    const t = setInterval(async () => {
      if (typeof document !== "undefined" && document.hidden) return;
      try {
        const user = await ensureUser();
        const [recv, blocked] = await Promise.all([remote.listReceived(user.uid), remote.listBlocked(user.uid)]);
        setReceived(recv.filter((r) => !blocked.has(r.fromUid)));
      } catch {}
    }, 60000);
    return () => clearInterval(t);
  }, [backend]);

  const persist = useCallback((next: Letter[]) => {
    setLetters(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  /** 편지 보내기. 서버 저장이 실패하면 오류를 그대로 던져서 화면이 알려주게 한다(조용히 내 폰에만 저장하지 않음). */
  const add = useCallback(
    async (l: Omit<Letter, "id" | "sentAt" | "arriveAt"> & { fromName?: string; speed?: number; departAt?: number; replyTo?: string }) => {
      await settled.current!.promise; // 서버 연결 확인이 끝날 때까지 기다림
      if (backendRef.current === "firebase") {
        const id = await remote.sendLetter({
          toName: l.to, fromName: l.fromName ?? "", routeId: l.routeId, birdId: l.birdId, message: l.message, speed: l.speed, recipientUid: l.toUid ?? null,
          photos: l.photos, departAt: l.departAt, replyTo: l.replyTo,
        });
        const meta = await remote.getMeta(id);
        const letter: Letter = {
          id, to: l.to, routeId: l.routeId, birdId: l.birdId, message: l.message,
          sentAt: meta?.sentAt ?? l.departAt ?? Date.now(), arriveAt: meta?.arriveAt, toUid: l.toUid, photos: l.photos,
        };
        setLetters((prev) => [letter, ...prev]);
        announce({ type: "sent", letter });
        if (l.toUid && letter.arriveAt) { // 친구가 앱을 닫고 있어도 도착하면 알림이 가도록 친구 폰에 예약
          const toUid = l.toUid, arriveAt = letter.arriveAt;
          import("./firebase/pushSub").then((m) => m.notifyFriendArrival({ letterId: id, toUid, fromName: l.fromName ?? "", routeId: l.routeId, birdId: l.birdId, arriveAt })).catch(() => {});
        }
        return id;
      }
      const sentAt = l.departAt ?? Date.now();
      const newId = Math.random().toString(36).slice(2, 9);
      const minutes = totalMinutes(newId, l.birdId, getRoute(l.routeId).km, sentAt, l.speed ?? 1);
      const letter: Letter = {
        id: newId, to: l.to, routeId: l.routeId, birdId: l.birdId,
        message: l.message, sentAt, arriveAt: sentAt + minutes * 60000, photos: l.photos,
      };
      persist([letter, ...letters]);
      announce({ type: "sent", letter });
      return letter.id;
    },
    [letters, persist],
  );

  /** 보낸 편지를 지워요(출발 전 예약 취소). 서버 편지는 글·사진까지 함께 지워요 */
  const cancel = useCallback(
    async (id: string) => {
      if (backendRef.current === "firebase") await remote.cancelLetter(id);
      else persist(letters.filter((x) => x.id !== id));
      setLetters((prev) => prev.filter((x) => x.id !== id));
    },
    [letters, persist],
  );

  /** 데모용(내 폰 저장에서만): 보낸 시각을 앞당겨 도착 연출을 빨리 본다 */
  const fastForward = useCallback(
    (id: string, minutes: number) =>
      persist(letters.map((l) => (l.id === id ? { ...l, sentAt: l.sentAt - minutes * 60000 } : l))),
    [letters, persist],
  );

  return { letters, received, ready, backend, add, cancel, fastForward };
}
