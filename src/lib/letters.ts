"use client";
import { useCallback, useEffect, useState } from "react";
import { getBird } from "./birds";
import { getRoute } from "./routes";
import { travelMinutes } from "./geo";

export type Letter = {
  id: string;
  to: string;
  routeId: string;
  birdId: string;
  message: string;
  /** 보낸 시각(ms) */
  sentAt: number;
};

const KEY = "saepyeonji.letters.v1";

/** 받은 편지함 샘플. Firestore 연동 전까지 화면 확인용 */
export const SAMPLE_INBOX = [
  { id: "in1", from: "엄마", birdId: "crane", routeId: "seoul-busan", preview: "밥은 잘 챙겨 먹고 있니?", when: "어제" },
  { id: "in2", from: "민수", birdId: "swallow", routeId: "seoul-jeju", preview: "제주 도착! 바람이 엄청 불어", when: "3일 전" },
];

export function letterProgress(l: Letter, now: number) {
  const route = getRoute(l.routeId);
  const total = travelMinutes(getBird(l.birdId), route.km);
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

export function useLetters() {
  const [letters, setLetters] = useState<Letter[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setLetters(JSON.parse(raw));
    } catch {}
    setReady(true);
  }, []);

  const persist = useCallback((next: Letter[]) => {
    setLetters(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  }, []);

  const add = useCallback(
    (l: Omit<Letter, "id" | "sentAt">) => {
      const letter: Letter = { ...l, id: Math.random().toString(36).slice(2, 9), sentAt: Date.now() };
      persist([letter, ...letters]);
      return letter.id;
    },
    [letters, persist],
  );

  /** 데모용: 보낸 시각을 앞당겨 도착 연출을 빨리 본다 */
  const fastForward = useCallback(
    (id: string, minutes: number) =>
      persist(letters.map((l) => (l.id === id ? { ...l, sentAt: l.sentAt - minutes * 60000 } : l))),
    [letters, persist],
  );

  return { letters, ready, add, fastForward };
}
