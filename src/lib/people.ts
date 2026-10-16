"use client";
import { useCallback, useEffect, useState } from "react";
import type { PeopleBook } from "../../core/threads";

/** 사람 정리(내 폰에만 저장): 이름만 적어 보낸 사람을 친구(uid)와 합치기, 친구를 내가 부르는 이름 */
const KEY = "saepyeonji.people.v1";
const EV = "saepyeonji:people";

function read(): Required<PeopleBook> {
  try { const v = JSON.parse(localStorage.getItem(KEY) ?? "{}"); return { alias: v.alias ?? {}, nick: v.nick ?? {} }; } catch { return { alias: {}, nick: {} }; }
}
function save(b: Required<PeopleBook>) {
  try { localStorage.setItem(KEY, JSON.stringify(b)); } catch {}
  try { window.dispatchEvent(new Event(EV)); } catch {}
}

export function usePeople() {
  const [book, setBook] = useState<Required<PeopleBook>>({ alias: {}, nick: {} });
  useEffect(() => {
    setBook(read());
    const h = () => setBook(read());
    window.addEventListener(EV, h);
    return () => window.removeEventListener(EV, h);
  }, []);
  /** "이름만 적은 사람 = 이 친구"로 합쳐요. 합친 방은 내가 정한 이름으로 보여요 */
  const merge = useCallback((name: string, uid: string) => {
    const b = read();
    b.alias[name] = uid;
    if (!b.nick[uid]) b.nick[uid] = name;
    save(b);
  }, []);
  /** 친구를 내가 부르는 이름 바꾸기(빈칸이면 친구가 정한 이름으로 돌아가요) */
  const rename = useCallback((uid: string, name: string) => {
    const b = read();
    const n = name.trim().slice(0, 12);
    if (n) b.nick[uid] = n; else delete b.nick[uid];
    save(b);
  }, []);
  return { book, merge, rename };
}
