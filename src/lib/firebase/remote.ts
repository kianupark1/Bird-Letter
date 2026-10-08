"use client";
import {
  Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { getRoute } from "../routes";
import { totalMinutes } from "../flight";
import { auth, db, ensureUser } from "./client";
import { MAX_LETTER_CHARS } from "../limits";
import { deleteFriendData } from "./friends";

/** 서버에 저장된 편지의 겉정보 */
export type Meta = {
  id: string;
  fromUid: string;
  fromName: string;
  toName: string;
  routeId: string;
  birdId: string;
  sentAt: number;
  arriveAt: number;
  recipientUid: string | null;
};

function toMeta(id: string, d: DocumentData): Meta {
  return {
    id,
    fromUid: d.fromUid,
    fromName: d.fromName ?? "",
    toName: d.toName ?? "",
    routeId: d.routeId,
    birdId: d.birdId,
    sentAt: d.sentAt?.toMillis?.() ?? Date.now(),
    arriveAt: d.arriveAt.toMillis(),
    recipientUid: d.recipientUid ?? null,
  };
}

/** 편지 보내기: 겉정보와 내용을 한 번에 저장하고 편지 ID(= 초대 링크 주소)를 돌려줍니다. */
export async function sendLetter(p: { toName: string; fromName: string; routeId: string; birdId: string; message: string; speed?: number; recipientUid?: string | null }) {
  const user = await ensureUser();
  const d = db();
  const ref = doc(collection(d, "letters"));
  // speed: 테스트용 배속(주소에 ?test=1을 붙였을 때만 600배). 평소에는 1
  // 길 잃음·나무 걸림 사고는 편지 ID로 정해져서, 도착 시각에 지연이 이미 포함돼요(core/flight.ts)
  const minutes = totalMinutes(ref.id, p.birdId, getRoute(p.routeId).km, Date.now(), p.speed ?? 1);
  const batch = writeBatch(d);
  batch.set(ref, {
    fromUid: user.uid,
    fromName: (p.fromName.trim() || "익명").slice(0, 12),
    toName: p.toName.trim().slice(0, 20),
    routeId: p.routeId,
    birdId: p.birdId,
    sentAt: serverTimestamp(),
    arriveAt: Timestamp.fromMillis(Date.now() + minutes * 60000),
    recipientUid: p.recipientUid ?? null,
  });
  batch.set(doc(d, "letters", ref.id, "private", "body"), { message: p.message.trim().slice(0, MAX_LETTER_CHARS) });
  await batch.commit();
  return ref.id;
}

export async function getMeta(id: string): Promise<Meta | null> {
  try {
    const s = await getDoc(doc(db(), "letters", id));
    return s.exists() ? toMeta(s.id, s.data({ serverTimestamps: "estimate" })) : null;
  } catch {
    return null;
  }
}

/** 편지 내용. 도착 전이거나 권한이 없으면 null */
export async function getBody(id: string): Promise<string | null> {
  try {
    const s = await getDoc(doc(db(), "letters", id, "private", "body"));
    return s.exists() ? (s.data().message as string) : null;
  } catch {
    return null;
  }
}

/** 링크를 연 사람이 "받는 사람"으로 등록(이미 등록됐거나 보낸 사람이면 서버가 거절) */
export async function claim(id: string) {
  const user = await ensureUser();
  await updateDoc(doc(db(), "letters", id), { recipientUid: user.uid });
}

export async function listSent(uid: string): Promise<Meta[]> {
  const s = await getDocs(query(collection(db(), "letters"), where("fromUid", "==", uid)));
  return s.docs.map((x) => toMeta(x.id, x.data({ serverTimestamps: "estimate" }))).sort((a, b) => b.sentAt - a.sentAt);
}

export async function listReceived(uid: string): Promise<Meta[]> {
  const s = await getDocs(query(collection(db(), "letters"), where("recipientUid", "==", uid)));
  return s.docs.map((x) => toMeta(x.id, x.data({ serverTimestamps: "estimate" }))).sort((a, b) => b.arriveAt - a.arriveAt);
}

export async function listBlocked(uid: string): Promise<Set<string>> {
  const s = await getDocs(collection(db(), "users", uid, "blocks"));
  return new Set(s.docs.map((x) => x.id));
}

export async function blockSender(fromUid: string) {
  const user = await ensureUser();
  await setDoc(doc(db(), "users", user.uid, "blocks", fromUid), { at: serverTimestamp() });
}

export async function reportLetter(letterId: string, reason: string) {
  const user = await ensureUser();
  await addDoc(collection(db(), "reports"), { reporterUid: user.uid, letterId, reason: reason.slice(0, 200), createdAt: serverTimestamp() });
}

/** 탈퇴 삭제: 내가 보낸 편지(내용 포함)와 차단 목록, 익명 계정을 모두 지웁니다. */
export async function deleteMyData() {
  const user = await ensureUser();
  const d = db();
  for (const m of await listSent(user.uid)) {
    await deleteDoc(doc(d, "letters", m.id, "private", "body"));
    await deleteDoc(doc(d, "letters", m.id));
  }
  for (const id of await listBlocked(user.uid)) await deleteDoc(doc(d, "users", user.uid, "blocks", id));
  await deleteFriendData(user.uid);
  await deleteDoc(doc(d, "users", user.uid)).catch(() => {});
  await deleteUser(auth().currentUser ?? user);
}
