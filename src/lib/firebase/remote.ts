"use client";
import {
  Timestamp, addDoc, collection, deleteDoc, doc, getDoc, getDocs, query, serverTimestamp, setDoc, updateDoc, where, writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { deleteUser } from "firebase/auth";
import { getRoute } from "../routes";
import { totalMinutes } from "../flight";
import { auth, db, ensureUser } from "./client";
import { MAX_LETTER_CHARS, MAX_PHOTOS } from "../limits";
import { deleteFriendData } from "./friends";

/** 서버에 저장된 편지의 겉정보 */
export type Meta = {
  id: string;
  fromUid: string;
  fromName: string;
  toName: string;
  routeId: string;
  birdId: string;
  /** 비행을 시작한(새가 출발한) 시각. 예약한 편지는 예약한 출발 시각이에요 */
  sentAt: number;
  arriveAt: number;
  recipientUid: string | null;
  /** 예약 발송이면 출발 시각, 아니면 null */
  departAt: number | null;
};

function toMeta(id: string, d: DocumentData): Meta {
  const departAt: number | null = d.departAt?.toMillis?.() ?? null;
  return {
    id,
    fromUid: d.fromUid,
    fromName: d.fromName ?? "",
    toName: d.toName ?? "",
    routeId: d.routeId,
    birdId: d.birdId,
    sentAt: departAt ?? d.sentAt?.toMillis?.() ?? Date.now(),
    arriveAt: d.arriveAt.toMillis(),
    recipientUid: d.recipientUid ?? null,
    departAt,
  };
}

/** 편지 보내기: 겉정보와 내용(글·사진)을 한 번에 저장하고 편지 ID(= 초대 링크 주소)를 돌려줍니다. departAt이 있으면 예약 발송이에요. */
export async function sendLetter(p: {
  toName: string; fromName: string; routeId: string; birdId: string; message: string; speed?: number;
  recipientUid?: string | null; photos?: string[]; departAt?: number;
  /** 답장이면 원래 편지의 ID(서버 규칙이 "내가 받은 편지의 보낸 사람에게만"을 확인해요) */
  replyTo?: string;
}) {
  const user = await ensureUser();
  const d = db();
  const ref = doc(collection(d, "letters"));
  // speed: 테스트용 배속(주소에 ?test=1을 붙였을 때만 600배). 평소에는 1
  // 길 잃음·나무 걸림 사고는 편지 ID로 정해져서, 도착 시각에 지연이 이미 포함돼요(core/flight.ts)
  const start = p.departAt ?? Date.now(); // 새가 출발하는 시각
  const minutes = totalMinutes(ref.id, p.birdId, getRoute(p.routeId).km, start, p.speed ?? 1);
  const batch = writeBatch(d);
  batch.set(ref, {
    fromUid: user.uid,
    fromName: (p.fromName.trim() || "익명").slice(0, 12),
    toName: p.toName.trim().slice(0, 20),
    routeId: p.routeId,
    birdId: p.birdId,
    sentAt: serverTimestamp(),
    arriveAt: Timestamp.fromMillis(start + minutes * 60000),
    recipientUid: p.recipientUid ?? null,
    // 예약하지 않은 편지에는 이 칸을 아예 넣지 않아요(예전 서버 규칙에서도 그대로 보내져요)
    ...(p.departAt ? { departAt: Timestamp.fromMillis(p.departAt) } : {}),
    ...(p.replyTo ? { replyTo: p.replyTo } : {}),
  });
  batch.set(doc(d, "letters", ref.id, "private", "body"), { message: p.message.trim().slice(0, MAX_LETTER_CHARS) });
  (p.photos ?? []).slice(0, MAX_PHOTOS).forEach((data, i) => batch.set(doc(d, "letters", ref.id, "private", `photo${i}`), { data }));
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

/** 편지에 담긴 사진들(줄인 JPEG 글자). 도착 전이거나 권한이 없으면 빈 목록 */
export async function getPhotos(id: string): Promise<string[]> {
  const d = db();
  const got = await Promise.all(
    Array.from({ length: MAX_PHOTOS }, (_, i) =>
      getDoc(doc(d, "letters", id, "private", `photo${i}`)).then((s) => (s.exists() ? (s.data().data as string) : null)).catch(() => null),
    ),
  );
  return got.filter((x): x is string => !!x);
}

/** 내가 보낸 편지(예약 취소 포함)를 지워요: 글·사진을 먼저 지우고 편지를 지워요 */
export async function cancelLetter(id: string) {
  await ensureUser();
  const d = db();
  await deleteDoc(doc(d, "letters", id, "private", "body"));
  for (let i = 0; i < MAX_PHOTOS; i++) await deleteDoc(doc(d, "letters", id, "private", `photo${i}`));
  await deleteDoc(doc(d, "letters", id));
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
  for (const m of await listSent(user.uid)) await cancelLetter(m.id);
  for (const id of await listBlocked(user.uid)) await deleteDoc(doc(d, "users", user.uid, "blocks", id));
  await deleteFriendData(user.uid);
  await deleteDoc(doc(d, "users", user.uid, "push", "sub")).catch(() => {});
  await deleteDoc(doc(d, "users", user.uid)).catch(() => {});
  await deleteUser(auth().currentUser ?? user);
}
