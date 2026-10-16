"use client";
import { collection, deleteDoc, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db, ensureUser } from "./client";
import { TAG_IDS, type PoolRow } from "../../../core/penpal";

export type MyPenpal = { name: string; bird: string; region: string; tags: string[]; open: boolean };

/** 펜팔 받기 명단의 내 줄(펜팔 이름·새·시·도·관심사·받기 켬/끔) */
export async function saveMyPenpal(p: MyPenpal) {
  const user = await ensureUser();
  if (user.isAnonymous) throw new Error("login");
  await setDoc(doc(db(), "penpals", user.uid), {
    name: p.name.trim().slice(0, 12) || "어딘가의 새", bird: p.bird.slice(0, 12), region: p.region.slice(0, 20),
    tags: p.tags.filter((t) => TAG_IDS.includes(t)).slice(0, 5), open: p.open, at: serverTimestamp(),
  });
}

export async function readPenpal(uid: string): Promise<(MyPenpal & { uid: string }) | null> {
  try {
    const s = await getDoc(doc(db(), "penpals", uid));
    if (!s.exists()) return null;
    const d = s.data();
    return { uid, name: String(d.name ?? ""), bird: String(d.bird ?? ""), region: String(d.region ?? ""), tags: Array.isArray(d.tags) ? d.tags : [], open: d.open === true };
  } catch { return null; }
}

/** 펜팔 받기를 켠 사람들(최대 50명). 이 중에서 core/penpal.ts pickPenpal로 한 명을 골라요 */
export async function listPool(): Promise<(PoolRow & { name: string })[]> {
  const s = await getDocs(query(collection(db(), "penpals"), where("open", "==", true), limit(50)));
  return s.docs.map((d) => ({ uid: d.id, name: String(d.data().name ?? ""), region: String(d.data().region ?? ""), tags: Array.isArray(d.data().tags) ? d.data().tags : [] }));
}

export async function deleteMyPenpal(uid: string) {
  try { await deleteDoc(doc(db(), "penpals", uid)); } catch {}
}
