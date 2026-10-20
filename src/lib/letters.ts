"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { getBird } from "./birds";
import { getRoute } from "./routes";
import { cruiseMinutes } from "./geo";
import { planFor, progressAt, totalMinutes, type Plan } from "./flight";
import { ensureUser, firebaseEnabled } from "./firebase/client";
import * as remote from "./firebase/remote";
import { isScheduled } from "../../core/schedule";
import { maskContacts } from "../../core/penpal";
import { LETTERS_CACHE_KEY, onClearFastCache, readJson, useBeforePaint, writeJson } from "./fastStart";

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
  /** 펜팔(모르는 누군가에게 보낸) 편지 */
  penpal?: boolean;
};

/** 같은 화면의 다른 부분(알림 담당 등)이 새로 보낸·받은 편지를 바로 알도록 전하는 신호 */
const BUS = "saepyeonji:letters";
type BusEvent = { type: "sent"; letter: Letter } | { type: "received"; meta: remote.Meta };
const announce = (detail: BusEvent) => { try { window.dispatchEvent(new CustomEvent(BUS, { detail })); } catch {} };
/** 링크로 편지를 처음 열어 받는 사람이 됐을 때 알려요 */
export const announceReceived = (meta: remote.Meta) => {
  patchSnap((s) => (s.received.some((x) => x.id === meta.id) ? s : { ...s, received: [meta, ...s.received] }));
  announce({ type: "received", meta });
};

export const LETTERS_KEY = "saepyeonji.letters.v1";
const KEY = LETTERS_KEY;
export const ONBOARDED_KEY = "saepyeonji.onboarded.v1";

/** 받는 사람이 "열어 본" 편지 ID들(목록의 "새 편지" 표시를 끄는 데 써요). 내 폰에만 저장해요 */
const OPENED_KEY = "saepyeonji.opened.v1";
export function readOpened(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(OPENED_KEY) ?? "[]") as string[]); } catch { return new Set(); }
}
export function markOpened(id: string) {
  try {
    const s = readOpened();
    if (s.has(id)) return;
    s.add(id);
    localStorage.setItem(OPENED_KEY, JSON.stringify([...s].slice(-500)));
    void import("./appShell").then((m) => m.afterLetterOpened(s.size)).catch(() => {}); // 스토어 앱이면 별점 물어볼 차례 표시
  } catch {}
}

/** 받은 편지함 샘플. 서버를 쓰지 않는 상태(내 폰 저장)에서만 화면 확인용으로 보여줌 */
export const SAMPLE_INBOX = [
  { id: "in1", from: "엄마", birdId: "crane", routeId: "seoul-busan", preview: "밥은 잘 챙겨 먹고 있니?", when: "어제" },
  { id: "in2", from: "민수", birdId: "swallow", routeId: "seoul-jeju", preview: "제주 도착! 바람이 엄청 불어", when: "3일 전" },
];

/** 편지의 비행 계획(사고 포함). 도착 시각이 없던 옛 편지는 사고 없이 계산해요 */
export function letterPlan(l: Pick<Letter, "id" | "birdId" | "routeId" | "sentAt" | "arriveAt">): Plan {
  const arriveAt = l.arriveAt ?? l.sentAt + cruiseMinutes(getBird(l.birdId), getRoute(l.routeId).km) * 60000; // 도착 시각이 없는 아주 예전 편지
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

/**
 * 서버 편지 목록을 앱 전체가 함께 써요(빨리 뜨게).
 *  - 화면(홈·대화방·알림 담당)마다 따로 서버에 묻지 않고 한 번만 물어요.
 *  - 지난번 목록을 내 폰에 적어 두었다가 열자마자 먼저 보여 줘요(사진은 빼고 적어요).
 *  - 내가 쓴 편지 글은 바뀌지 않으니 한 번 받은 글은 다시 받지 않아요.
 */
type Snap = { uid: string; letters: Letter[]; received: remote.Meta[]; at: number };
let mem: Snap | null = null;
let memFromServer = false; // 이번에 앱을 연 뒤 서버에서 받은 목록인지
let inflight: Promise<Snap> | null = null;
onClearFastCache(() => { mem = null; memFromServer = false; });

function readSnap(): Snap | null {
  if (!mem) mem = readJson<Snap>(LETTERS_CACHE_KEY);
  return mem;
}
function writeSnap(s: Snap) {
  mem = s;
  writeJson(LETTERS_CACHE_KEY, { ...s, letters: s.letters.map(({ photos: _p, ...x }) => x) });
}
function patchSnap(f: (s: Snap) => Snap) {
  if (mem && memFromServer) writeSnap(f(mem));
}

function loadServer(): Promise<Snap> {
  if (inflight) return inflight;
  inflight = (async () => {
    const user = await ensureUser();
    const [sent, recv, blocked] = await Promise.all([remote.listSent(user.uid), remote.listReceived(user.uid), remote.listBlocked(user.uid)]);
    const prev = readSnap();
    const known = new Map((prev?.uid === user.uid ? prev.letters : []).map((l) => [l.id, l]));
    // 보낸 사람은 도착 전에도 자기 편지 내용을 읽을 수 있음(이미 받아 둔 글은 다시 받지 않아요)
    const mine: Letter[] = await Promise.all(
      sent.map(async (m) => ({
        id: m.id,
        to: m.toName,
        routeId: m.routeId,
        birdId: m.birdId,
        message: known.get(m.id)?.message || ((await remote.getBody(m.id)) ?? ""),
        sentAt: m.sentAt,
        arriveAt: m.arriveAt,
        toUid: m.recipientUid ?? undefined,
        ...(known.get(m.id)?.photos ? { photos: known.get(m.id)!.photos } : {}),
        ...(m.penpal ? { penpal: true } : {}),
      })),
    );
    const snap: Snap = { uid: user.uid, letters: mine, received: recv.filter((r) => !blocked.has(r.fromUid)), at: Date.now() };
    writeSnap(snap);
    memFromServer = true;
    return snap;
  })().finally(() => { inflight = null; });
  return inflight;
}

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

  // 화면에 보이기 전에: 지난번 목록(또는 다른 화면이 받아 둔 목록)을 먼저 보여 줘요
  useBeforePaint(() => {
    if (!firebaseEnabled) return;
    const s = readSnap();
    if (!s) return;
    setLetters(s.letters);
    setReceived(s.received);
    setReady(true);
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
          // 방금(30초 안) 다른 화면에서 받은 목록이면 서버에 다시 묻지 않아요
          const fresh = memFromServer && mem && Date.now() - mem.at < 30000 ? mem : await loadServer();
          if (cancelled) return;
          setLetters(fresh.letters);
          setReceived(fresh.received);
          setBackend("firebase");
          setReady(true);
          return;
        } catch (e) {
          // 인터넷이 끊겼어도 지난번 목록이 있으면 그대로 보여 줘요(보내기는 서버로만 해서, 실패하면 알려 줘요)
          if (!cancelled && readSnap()) { setBackend("firebase"); setReady(true); return; }
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
        const fresh = recv.filter((r) => !blocked.has(r.fromUid));
        setReceived(fresh);
        patchSnap((s) => ({ ...s, received: fresh }));
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
      // 펜팔 편지는 연락처처럼 보이는 글을 가린 뒤에 보내요
      if (l.penpal) l = { ...l, message: maskContacts(l.message).text };
      await settled.current!.promise; // 서버 연결 확인이 끝날 때까지 기다림
      if (backendRef.current === "firebase") {
        const id = await remote.sendLetter({
          toName: l.to, fromName: l.fromName ?? "", routeId: l.routeId, birdId: l.birdId, message: l.message, speed: l.speed, recipientUid: l.toUid ?? null,
          photos: l.photos, departAt: l.departAt, replyTo: l.replyTo, penpal: l.penpal,
        });
        const meta = await remote.getMeta(id);
        const letter: Letter = {
          id, to: l.to, routeId: l.routeId, birdId: l.birdId, message: l.message,
          sentAt: meta?.sentAt ?? l.departAt ?? Date.now(), arriveAt: meta?.arriveAt, toUid: l.toUid, photos: l.photos,
          ...(l.penpal ? { penpal: true } : {}),
        };
        setLetters((prev) => [letter, ...prev]);
        patchSnap((s) => ({ ...s, letters: [letter, ...s.letters.filter((x) => x.id !== letter.id)] }));
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
      // 최신 목록에 더해요(바로 이어서 지우기·보내기를 해도 서로 덮어쓰지 않게)
      setLetters((prev) => { const next = [letter, ...prev]; try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {} return next; });
      announce({ type: "sent", letter });
      return letter.id;
    },
    [],
  );

  /** 보낸 편지를 지워요(출발 전 예약 취소). 서버 편지는 글·사진까지 함께 지워요 */
  const cancel = useCallback(
    async (id: string) => {
      if (backendRef.current === "firebase") { await remote.cancelLetter(id); patchSnap((s) => ({ ...s, letters: s.letters.filter((x) => x.id !== id) })); }
      setLetters((prev) => {
        const next = prev.filter((x) => x.id !== id);
        if (backendRef.current !== "firebase") try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
        return next;
      });
    },
    [],
  );

  /** 데모용(내 폰 저장에서만): 보낸 시각을 앞당겨 도착 연출을 빨리 본다 */
  const fastForward = useCallback(
    (id: string, minutes: number) =>
      persist(letters.map((l) => (l.id === id ? { ...l, sentAt: l.sentAt - minutes * 60000 } : l))),
    [letters, persist],
  );

  return { letters, received, ready, backend, add, cancel, fastForward };
}
