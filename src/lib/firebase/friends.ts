"use client";
import { collection, deleteDoc, deleteField, doc, getDoc, getDocs, serverTimestamp, setDoc, updateDoc, writeBatch } from "firebase/firestore";
import { auth, db, ensureUser } from "./client";
import { FRIENDS_CACHE_KEY, readJson, writeJson } from "../fastStart";

export type Friend = { uid: string; name: string; /** 친구가 고른 "내 새"(없으면 이름으로 정해요) */ bird?: string; /** 친구가 올린 프로필 사진(작은 JPEG 글자). 없으면 새 얼굴 */ photo?: string };
const BIRDS_OK = ["magpie", "pigeon", "swallow", "crane", "bungbungi", "hawk"];
const okBird = (b: unknown): string | undefined => (typeof b === "string" && BIRDS_OK.includes(b) ? b : undefined);
/** 서버 규칙과 같은 조건: 30,000글자 이하의 JPEG 글자만 */
export const okPhoto = (p: unknown): string | undefined =>
  typeof p === "string" && p.length <= 30000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(p) ? p : undefined;

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

const nick = (n: string) => (n.trim() === "새 친구" ? "" : n.trim()).slice(0, 12); // 이름이 없으면 비워 두고, 친구 화면에서 "친구 #표"로 보여요

/** 내 친구 코드. 처음이면 만들고, 닉네임이 바뀌었으면 코드에 붙은 이름도 고쳐요 */
export async function ensureMyCode(name: string, bird?: string, photo?: string): Promise<string> {
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
  const b = okBird(bird), ph = okPhoto(photo);
  if (!cur.exists() || cur.data().name !== nick(name) || (b && cur.data().bird !== b) || (cur.data().photo ?? "") !== (ph ?? "")) {
    try { await setDoc(cdoc, { uid: user.uid, name: nick(name), ...(b ? { bird: b } : {}), ...(ph ? { photo: ph } : {}) }); }
    catch (e) {
      // 서버 규칙이 아직 사진·"내 새"를 모르면 할 수 있는 만큼만 저장
      if (!b && !ph) throw e;
      try { if (!b) throw e; await setDoc(cdoc, { uid: user.uid, name: nick(name), bird: b }); }
      catch { await setDoc(cdoc, { uid: user.uid, name: nick(name) }); }
    }
  }
  return code;
}

/** 코드 주인 찾기(친구 추가 전에 "OO님"을 보여줄 때) */
export async function lookupCode(code: string): Promise<Friend | null> {
  const s = await getDoc(doc(db(), "codes", normalizeCode(code)));
  return s.exists() ? { uid: s.data().uid, name: s.data().name, bird: okBird(s.data().bird), photo: okPhoto(s.data().photo) } : null;
}

/** 코드로 친구 맺기: 내 목록과 상대 목록에 서로 남겨요(서로 친구여야 앱 안에서 바로 보낼 수 있어요) */
export async function addFriend(code: string, myName: string, myBird?: string, myPhoto?: string): Promise<Friend> {
  const user = await ensureUser();
  const other = await lookupCode(code);
  if (!other) throw new Error("not-found");
  if (other.uid === user.uid) throw new Error("self");
  const d = db();
  const write = async (withBird: boolean, withPhoto: boolean) => {
    const batch = writeBatch(d);
    const ob = withBird ? okBird(other.bird) : undefined, mb = withBird ? okBird(myBird) : undefined;
    const op = withPhoto ? okPhoto(other.photo) : undefined, mp = withPhoto ? okPhoto(myPhoto) : undefined;
    batch.set(doc(d, "users", user.uid, "friends", other.uid), { uid: other.uid, name: nick(other.name), at: serverTimestamp(), ...(ob ? { bird: ob } : {}), ...(op ? { photo: op } : {}) });
    batch.set(doc(d, "users", other.uid, "friends", user.uid), { uid: user.uid, name: nick(myName), at: serverTimestamp(), ...(mb ? { bird: mb } : {}), ...(mp ? { photo: mp } : {}) });
    await batch.commit();
  };
  // 서버 규칙이 아직 사진·"내 새"를 모르면 하나씩 빼고 다시 해요(친구 맺기 자체는 꼭 되게)
  try { await write(true, true); }
  catch (e) {
    try { await write(true, false); }
    catch { if (!okBird(other.bird) && !okBird(myBird)) throw e; await write(false, false); }
  }
  return other;
}

export async function listFriends(): Promise<Friend[]> {
  const user = await ensureUser();
  const s = await getDocs(collection(db(), "users", user.uid, "friends"));
  const list = s.docs.map((x) => ({ uid: x.id, name: x.data().name as string, bird: okBird(x.data().bird), photo: okPhoto(x.data().photo) })).sort((a, b) => a.name.localeCompare(b.name, "ko"));
  // 다음에 열 때 바로 보이게 적어 둬요(사진이 너무 많으면 사진은 빼고)
  const heavy = list.reduce((n, f) => n + (f.photo?.length ?? 0), 0) > 1_500_000;
  writeJson(FRIENDS_CACHE_KEY, { uid: user.uid, list: heavy ? list.map(({ photo: _p, ...f }) => f) : list });
  return list;
}

/** 지난번에 받아 둔 친구 목록(열자마자 먼저 보여 주는 용도). 다른 계정 것이면 비워요 */
export function cachedFriends(): Friend[] {
  const c = readJson<{ uid: string; list: Friend[] }>(FRIENDS_CACHE_KEY);
  if (!c) return [];
  try { const u = auth().currentUser; if (u && u.uid !== c.uid) return []; } catch {}
  return c.list;
}

/** 친구 끊기: 양쪽 목록에서 지워요(끊으면 서로에게 바로 보내기는 멈춰요) */
export async function removeFriend(friendUid: string) {
  const user = await ensureUser();
  const d = db();
  await deleteDoc(doc(d, "users", user.uid, "friends", friendUid));
  await deleteDoc(doc(d, "users", friendUid, "friends", user.uid)).catch(() => {});
}

/**
 * 탈퇴 삭제: 내 친구 목록, 친구들 목록에 남은 내 흔적, 내 친구 코드.
 * 친구 기능의 서버 규칙이 아직 게시되지 않았거나 일부가 막혀도 탈퇴 삭제 전체가 멈추지 않게, 실패는 건너뛰어요.
 */
export async function deleteFriendData(uid: string) {
  const d = db();
  try {
    for (const f of (await getDocs(collection(d, "users", uid, "friends"))).docs) {
      await deleteDoc(doc(d, "users", f.id, "friends", uid)).catch(() => {});
      await deleteDoc(f.ref).catch(() => {});
    }
  } catch {}
  try { await deleteDoc(doc(d, "stats", uid)); } catch {}
  try { await deleteDoc(doc(d, "ranking", uid)); } catch {}
  try { await deleteDoc(doc(d, "penpals", uid)); } catch {}
  try {
    const me = await getDoc(doc(d, "users", uid));
    const code = me.exists() ? (me.data().code as string | undefined) : undefined;
    if (code) await deleteDoc(doc(d, "codes", code)).catch(() => {});
  } catch {}
}

/**
 * 내 지금 이름·내 새를 친구들 목록 속 "나" 칸에 다시 적어요.
 * 친구로 맺을 때의 이름(예: 이름을 정하기 전의 "새 친구")이 친구 화면에 계속 남는 문제를 고쳐요(규칙상 내 칸은 내가 고칠 수 있어요).
 */
export async function syncMyName(friends: Friend[], myName: string, myBird?: string, myPhoto?: string) {
  const user = await ensureUser();
  if (user.isAnonymous || !myName.trim() || myName.trim() === "새 친구") return;
  const d = db();
  const b = okBird(myBird), ph = okPhoto(myPhoto);
  const ref = (f: Friend) => doc(d, "users", f.uid, "friends", user.uid);
  // updateDoc: 친구가 나를 이미 끊었으면(칸이 없으면) 다시 만들지 않고 조용히 실패해요
  await Promise.all(friends.map(async (f) => {
    try { await updateDoc(ref(f), { name: nick(myName), ...(b ? { bird: b } : {}), photo: ph ?? deleteField() }); }
    catch { try { await updateDoc(ref(f), { name: nick(myName), ...(b ? { bird: b } : {}) }); } catch {} } // 규칙이 사진을 아직 모를 때
  }));
}
