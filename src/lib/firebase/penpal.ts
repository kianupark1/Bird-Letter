"use client";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, limit, query, serverTimestamp, setDoc, where } from "firebase/firestore";
import { db, ensureUser } from "./client";
import { TAG_IDS, cleanIntro, type PoolRow } from "../../../core/penpal";

export type MyPenpal = {
  name: string; bird: string; region: string; tags: string[]; open: boolean; intro?: string;
  /** 펜팔 친구 찾기 목록에 보이기(본인이 켰을 때만) */
  listed?: boolean;
  /** 카드에 보일 프로필 사진(본인이 허락했을 때만). null이면 지워요, 안 주면 그대로 */
  photo?: string | null;
};
export type BrowseRow = { uid: string; name: string; bird: string; region: string; tags: string[]; intro: string; photo?: string };

/** 펜팔 받기 명단의 내 줄(펜팔 이름·새·시·도·관심사·받기 켬/끔) */
export async function saveMyPenpal(p: MyPenpal) {
  const user = await ensureUser();
  if (user.isAnonymous) throw new Error("login");
  await setDoc(doc(db(), "penpals", user.uid), {
    name: p.name.trim().slice(0, 12) || "어딘가의 새", bird: p.bird.slice(0, 12), region: p.region.slice(0, 20),
    tags: p.tags.filter((t) => TAG_IDS.includes(t)).slice(0, 5), open: p.open, at: serverTimestamp(),
    // 한 줄 소개는 줄 때만 바꿔요(다른 곳에서 받기 켬/끔만 올려도 지워지지 않게 merge)
    ...(p.intro !== undefined ? { intro: cleanIntro(p.intro) } : {}),
    ...(p.listed !== undefined ? { listed: p.listed } : {}),
    ...(p.photo === null ? { photo: deleteField() } : typeof p.photo === "string" ? { photo: p.photo } : {}),
  }, { merge: true });
}

export async function readPenpal(uid: string): Promise<(MyPenpal & { uid: string }) | null> {
  try {
    const s = await getDoc(doc(db(), "penpals", uid));
    if (!s.exists()) return null;
    const d = s.data();
    return { uid, name: String(d.name ?? ""), bird: String(d.bird ?? ""), region: String(d.region ?? ""), tags: Array.isArray(d.tags) ? d.tags : [], open: d.open === true, intro: typeof d.intro === "string" ? d.intro : "", listed: d.listed === true, photo: typeof d.photo === "string" ? d.photo : undefined };
  } catch { return null; }
}

/** 펜팔 받기를 켠 사람들(최대 50명). 이 중에서 core/penpal.ts pickPenpal로 한 명을 골라요 */
export async function listPool(): Promise<(PoolRow & { name: string })[]> {
  const s = await getDocs(query(collection(db(), "penpals"), where("open", "==", true), limit(50)));
  return s.docs.map((d) => ({ uid: d.id, name: String(d.data().name ?? ""), region: String(d.data().region ?? ""), tags: Array.isArray(d.data().tags) ? d.data().tags : [] }));
}

/** 펜팔 친구 찾기: 받기를 켜고 "목록에 보이기"도 켠 사람들(최대 50명). 사진은 본인이 허락한 사람만 들어 있어요 */
export async function listBrowse(): Promise<BrowseRow[]> {
  const s = await getDocs(query(collection(db(), "penpals"), where("open", "==", true), where("listed", "==", true), limit(50)));
  return s.docs.map((x) => {
    const d = x.data();
    return { uid: x.id, name: String(d.name ?? ""), bird: String(d.bird ?? ""), region: String(d.region ?? ""), tags: Array.isArray(d.tags) ? d.tags : [],
      intro: typeof d.intro === "string" ? d.intro : "", ...(typeof d.photo === "string" ? { photo: d.photo } : {}) };
  });
}

export async function deleteMyPenpal(uid: string) {
  try { await deleteDoc(doc(db(), "penpals", uid)); } catch {}
}
