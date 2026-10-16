"use client";
import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { PeopleBook } from "../../core/threads";
import { auth, db, firebaseEnabled } from "./firebase/client";

/**
 * 사람 정리장: 같은 사람이 둘로 갈라지지 않게 합친 기록과, 친구를 내가 부르는 이름.
 * 내 폰에 저장하고, 로그인한 사람은 내 계정(users/{내 uid}의 people 칸)에도 올려서 폰을 바꿔도 그대로예요.
 */
type Book = Required<PeopleBook>;
const KEY = "saepyeonji.people.v1";
const EV = "saepyeonji:people";
const empty = (): Book => ({ alias: {}, same: {}, nick: {} });
const clean = (v: unknown): Book => {
  const o = (v ?? {}) as Partial<Book>;
  const map = (m: unknown) => (m && typeof m === "object" ? Object.fromEntries(Object.entries(m as Record<string, unknown>).filter(([, x]) => typeof x === "string").slice(0, 300)) as Record<string, string> : {});
  return { alias: map(o.alias), same: map(o.same), nick: map(o.nick) };
};
function readLocal(): Book { try { return clean(JSON.parse(localStorage.getItem(KEY) ?? "{}")); } catch { return empty(); } }
function writeLocal(b: Book) { try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {} try { window.dispatchEvent(new Event(EV)); } catch {} }
const mergeBooks = (a: Book, b: Book): Book => ({ alias: { ...b.alias, ...a.alias }, same: { ...b.same, ...a.same }, nick: { ...b.nick, ...a.nick } });

function me() { try { const u = auth().currentUser; return u && !u.isAnonymous ? u : null; } catch { return null; } }
async function pushServer(b: Book) {
  if (!firebaseEnabled) return;
  const u = me(); if (!u) return;
  try { await setDoc(doc(db(), "users", u.uid), { people: b }, { merge: true }); } catch {}
}
let pulled = false;
async function pullServer() {
  if (!firebaseEnabled || pulled) return;
  const u = me(); if (!u) return;
  pulled = true;
  try {
    const s = await getDoc(doc(db(), "users", u.uid));
    const server = clean(s.data()?.people);
    const merged = mergeBooks(readLocal(), server); // 이 폰에서 정한 것이 먼저, 없는 건 서버 것으로 채워요
    writeLocal(merged);
    if (JSON.stringify(merged) !== JSON.stringify(server)) void pushServer(merged);
  } catch { pulled = false; }
}
function save(b: Book) { writeLocal(b); void pushServer(b); }

export function usePeople() {
  const [book, setBook] = useState<Book>(empty);
  useEffect(() => {
    setBook(readLocal());
    const h = () => setBook(readLocal());
    window.addEventListener(EV, h);
    void pullServer();
    return () => window.removeEventListener(EV, h);
  }, []);
  /** 이름만 적은 사람 = 이 친구. 합친 사람은 내가 정한 이름으로 보여요 */
  const merge = useCallback((name: string, uid: string) => {
    const b = readLocal(); b.alias[name] = uid; if (!b.nick[uid]) b.nick[uid] = name; save(b);
  }, []);
  /** 같은 사람의 다른 계정 합치기: fromUid의 편지·방을 toUid 쪽으로 모아요 */
  const mergeSame = useCallback((fromUid: string, toUid: string, name?: string) => {
    if (fromUid === toUid) return;
    const b = readLocal(); b.same[fromUid] = toUid; delete b.same[toUid];
    if (name && !b.nick[toUid]) b.nick[toUid] = name;
    save(b);
  }, []);
  /** 친구를 내가 부르는 이름 바꾸기(빈칸이면 친구가 정한 이름으로 돌아가요) */
  const rename = useCallback((uid: string, name: string) => {
    const b = readLocal(); const n = name.trim().slice(0, 12);
    if (n) b.nick[uid] = n; else delete b.nick[uid];
    save(b);
  }, []);
  return { book, merge, mergeSame, rename };
}
