"use client";
import { useEffect, useState } from "react";
import { collection, doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { auth, db, ensureUser, firebaseEnabled } from "./firebase/client";

/**
 * 응원하기(시안 v6-2): 날아가는 편지의 새에게 모이를 주거나 노래를 불러 줘요.
 * 보낸 사람·받는 사람 둘 다 응원할 수 있고 둘 다 봐요. 한 사람이 한 시간에 한 번.
 * 도착 시각은 절대 바뀌지 않아요(기다림의 미학). 서버: letters/{id}/cheers/{uid_시간번호}
 */
export type CheerKind = "seed" | "song";
export type Cheer = { uid: string; kind: CheerKind; at: number };
export const CHEER_LABEL: Record<CheerKind, { icon: string; verb: string }> = {
  seed: { icon: "🌾", verb: "모이를 줬어요" },
  song: { icon: "🎵", verb: "노래를 불러 줬어요" },
};
const HOUR = 3600000;
const LOCAL = "saepyeonji.cheers.v1";
const BUS = "saepyeonji:cheers";

/** 서버 없이 쓸 때(내 폰 저장)의 내 uid */
export const LOCAL_ME = "me";
export function myUid(): string {
  if (!firebaseEnabled) return LOCAL_ME;
  try { return auth().currentUser?.uid ?? LOCAL_ME; } catch { return LOCAL_ME; }
}

function readLocal(): Record<string, Cheer[]> {
  try { return JSON.parse(localStorage.getItem(LOCAL) ?? "{}"); } catch { return {}; }
}

/** 이 편지에 내가 이번 시간에 응원했는지, 했다면 다음 응원까지 남은 분 */
export function nextCheerIn(list: Cheer[], me: string, now: number): number {
  const mine = list.filter((c) => c.uid === me).sort((a, b) => b.at - a.at)[0];
  if (!mine || Math.floor(mine.at / HOUR) !== Math.floor(now / HOUR)) return 0;
  return Math.max(1, Math.ceil(((Math.floor(now / HOUR) + 1) * HOUR - now) / 60000));
}

/** 편지 여러 통의 응원 목록(편지 ID → 응원들), 실시간으로 갱신돼요 */
export function useCheers(ids: string[]): Record<string, Cheer[]> {
  const [map, setMap] = useState<Record<string, Cheer[]>>({});
  const key = ids.join(",");
  useEffect(() => {
    if (!ids.length) { setMap({}); return; }
    if (!firebaseEnabled) {
      const load = () => { const all = readLocal(); setMap(Object.fromEntries(ids.map((id) => [id, all[id] ?? []]))); };
      load();
      window.addEventListener(BUS, load);
      return () => window.removeEventListener(BUS, load);
    }
    const offs = ids.map((id) => onSnapshot(collection(db(), "letters", id, "cheers"), (s) => {
      const list = s.docs.map((d) => { const x = d.data(); return { uid: String(x.uid ?? ""), kind: (x.kind === "song" ? "song" : "seed") as CheerKind, at: x.at?.toMillis?.() ?? Date.now() }; });
      setMap((m) => ({ ...m, [id]: list }));
    }, () => {})); // 규칙 게시 전이거나 권한이 없으면 조용히 빈 목록
    return () => offs.forEach((f) => f());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return map;
}

/** 응원 한 번 보내기. 이번 시간에 이미 했으면 서버가 막아요("hour") */
export async function sendCheer(letterId: string, kind: CheerKind): Promise<void> {
  const now = Date.now();
  if (!firebaseEnabled) {
    const all = readLocal();
    const list = all[letterId] ?? [];
    if (nextCheerIn(list, LOCAL_ME, now)) throw new Error("hour");
    all[letterId] = [...list, { uid: LOCAL_ME, kind, at: now }].slice(-200);
    try { localStorage.setItem(LOCAL, JSON.stringify(all)); } catch {}
    window.dispatchEvent(new Event(BUS));
    return;
  }
  const me = await ensureUser();
  try {
    await setDoc(doc(db(), "letters", letterId, "cheers", `${me.uid}_${Math.floor(now / HOUR)}`), { uid: me.uid, kind, at: serverTimestamp() });
  } catch (e) {
    if ((e as { code?: string }).code === "permission-denied") throw new Error("hour");
    throw e;
  }
}
