"use client";
import { collection, deleteDoc, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from "firebase/firestore";
import { db, ensureUser } from "./client";
import type { Stats } from "../../../core/rank";

const BIRDS_OK = ["magpie", "pigeon", "swallow", "crane", "bungbungi", "hawk"];
export type PublicRow = { uid: string; name: string; bird?: string; km: number; maxKm: number; count: number };

/**
 * 전체 랭킹에 내 줄 올리기(가입한 사람 누구나 봐요). 이름·새·거리만 올리고 동네·사진은 올리지 않아요.
 * 이름이 없거나, 로그인 전(익명)이거나, 내가 "전체 랭킹에 보이기"를 껐으면 내 줄을 지워요.
 */
export async function publishPublicRank(s: Stats, name: string, bird: string | undefined, show: boolean): Promise<boolean> {
  try {
    const user = await ensureUser();
    const ref = doc(db(), "ranking", user.uid);
    const n = name.trim().slice(0, 12);
    if (!show || !n || n === "새 친구" || user.isAnonymous) { await deleteDoc(ref).catch(() => {}); return true; }
    const b = bird && BIRDS_OK.includes(bird) ? bird : undefined;
    await setDoc(ref, { name: n, km: s.km, maxKm: s.maxKm, count: s.count, at: serverTimestamp(), ...(b ? { bird: b } : {}) });
    return true;
  } catch {
    return false; // 서버 규칙이 아직 없으면 조용히 건너뛰어요
  }
}

/** 전체 랭킹 위에서부터 50명(누적 거리 또는 가장 먼 한 통) */
export async function listPublicRank(kind: "total" | "longest"): Promise<PublicRow[]> {
  const q = query(collection(db(), "ranking"), orderBy(kind === "total" ? "km" : "maxKm", "desc"), limit(50));
  const s = await getDocs(q);
  return s.docs.map((d) => {
    const x = d.data();
    return { uid: d.id, name: String(x.name ?? "").slice(0, 12), bird: BIRDS_OK.includes(x.bird) ? x.bird : undefined, km: Number(x.km) || 0, maxKm: Number(x.maxKm) || 0, count: Number(x.count) || 0 };
  });
}

export async function deletePublicRank(uid: string) {
  try { await deleteDoc(doc(db(), "ranking", uid)); } catch {}
}
