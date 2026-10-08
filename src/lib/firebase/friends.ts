"use client";
import { collection, deleteDoc, doc, getDoc, getDocs, serverTimestamp, setDoc, writeBatch } from "firebase/firestore";
import { db, ensureUser } from "./client";

export type Friend = { uid: string; name: string };

// 헷갈리는 글자(0 O 1 I L)를 뺀 8글자 코드
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const CODE_LEN = 8;
export const normalizeCode = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const isCode = (s: string) => normalizeCode(s).length === CODE_LEN;

function newCode() {
  const a = new Uint32Array(CODE_LEN);
  crypto.getRandomValues(a);
  return Array.from(a, (n) => ALPHABET[n % ALPHABET.length]).join("");
}

const nick = (n: string) => (n.trim() || "새 친구").slice(0, 12);

/** 내 친구 코드. 처음이면 만들고, 닉네임이 바뀌었으면 코드에 붙은 이름도 고쳐요 */
export async function ensureMyCode(name: string): Promise<string> {
  const user = await ensureUser();
  const d = db();
  const me = doc(d, "users", user.uid);
  const snap = await getDoc(me);
  let code = snap.exists() ? (snap.data().code as string | undefined) : undefined;
  if (!code) {
    for (let i = 0; i < 5; i++) {
      const c = newCode();
      if (!(await getDoc(doc(d, "codes", c))).exists()) { code = c; break; }
    }
    if (!code) throw new Error("code");
    await setDoc(me, { code }, { merge: true });
  }
  const cdoc = doc(d, "codes", code);
  const cur = await getDoc(cdoc);
  if (!cur.exists() || cur.data().name !== nick(name)) await setDoc(cdoc, { uid: user.uid, name: nick(name) });
  return code;
}

/** 코드 주인 찾기(친구 추가 전에 "OO님"을 보여줄 때) */
export async function lookupCode(code: string): Promise<Friend | null> {
  const s = await getDoc(doc(db(), "codes", normalizeCode(code)));
  return s.exists() ? { uid: s.data().uid, name: s.data().name } : null;
}

/** 코드로 친구 맺기: 내 목록과 상대 목록에 서로 남겨요(서로 친구여야 앱 안에서 바로 보낼 수 있어요) */
export async function addFriend(code: string, myName: string): Promise<Friend> {
  const user = await ensureUser();
  const other = await lookupCode(code);
  if (!other) throw new Error("not-found");
  if (other.uid === user.uid) throw new Error("self");
  const d = db();
  const batch = writeBatch(d);
  batch.set(doc(d, "users", user.uid, "friends", other.uid), { uid: other.uid, name: nick(other.name), at: serverTimestamp() });
  batch.set(doc(d, "users", other.uid, "friends", user.uid), { uid: user.uid, name: nick(myName), at: serverTimestamp() });
  await batch.commit();
  return other;
}

export async function listFriends(): Promise<Friend[]> {
  const user = await ensureUser();
  const s = await getDocs(collection(db(), "users", user.uid, "friends"));
  return s.docs.map((x) => ({ uid: x.id, name: x.data().name as string })).sort((a, b) => a.name.localeCompare(b.name, "ko"));
}

/** 친구 끊기: 양쪽 목록에서 지워요(끊으면 서로에게 바로 보내기는 멈춰요) */
export async function removeFriend(friendUid: string) {
  const user = await ensureUser();
  const d = db();
  await deleteDoc(doc(d, "users", user.uid, "friends", friendUid));
  await deleteDoc(doc(d, "users", friendUid, "friends", user.uid)).catch(() => {});
}

/** 탈퇴 삭제: 내 친구 목록, 친구들 목록에 남은 내 흔적, 내 친구 코드 */
export async function deleteFriendData(uid: string) {
  const d = db();
  for (const f of await getDocs(collection(d, "users", uid, "friends")).then((s) => s.docs)) {
    await deleteDoc(doc(d, "users", f.id, "friends", uid)).catch(() => {});
    await deleteDoc(f.ref).catch(() => {});
  }
  const me = await getDoc(doc(d, "users", uid));
  const code = me.exists() ? (me.data().code as string | undefined) : undefined;
  if (code) await deleteDoc(doc(d, "codes", code)).catch(() => {});
}
