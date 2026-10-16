"use client";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db, ensureUser } from "./client";
import type { Stats } from "../../../core/rank";

const BIRDS_OK = ["magpie", "pigeon", "swallow", "crane", "bungbungi", "hawk"];

/** 내 거리 기록을 서버에 올려요(친구가 랭킹에서 봐요). 서버 규칙이 아직 없으면 조용히 건너뛰어요 */
export async function publishStats(s: Stats, name: string, bird?: string, place?: string): Promise<boolean> {
  try {
    const user = await ensureUser();
    const b = bird && BIRDS_OK.includes(bird) ? bird : undefined;
    await setDoc(doc(db(), "stats", user.uid), { km: s.km, maxKm: s.maxKm, count: s.count, name: (name.trim() || "새 친구").slice(0, 12), ...(b ? { bird: b } : {}), ...(place ? { place: place.slice(0, 20) } : {}) });
    return true;
  } catch {
    return false;
  }
}

/** 친구 한 명의 기록(없거나 못 읽으면 null) */
export async function readStats(uid: string): Promise<(Stats & { bird?: string; place?: string }) | null> {
  try {
    const s = await getDoc(doc(db(), "stats", uid));
    if (!s.exists()) return null;
    const d = s.data();
    if (typeof d.km !== "number" || typeof d.maxKm !== "number") return null;
    return { km: d.km, maxKm: d.maxKm, count: typeof d.count === "number" ? d.count : 0, bird: BIRDS_OK.includes(d.bird) ? d.bird : undefined, place: typeof d.place === "string" ? d.place : undefined };
  } catch {
    return null;
  }
}

export async function deleteMyStats(uid: string) {
  try { await deleteDoc(doc(db(), "stats", uid)); } catch {}
}
