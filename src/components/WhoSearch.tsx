"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Face from "@/components/Face";
import type { Friend } from "@/lib/firebase/friends";
import { roomHref } from "@/lib/room";
import { IS_TOSS } from "@/lib/target";
import { contactPickerSupported, pickContact } from "@/lib/contactInvite";
import { keepTel } from "@/lib/pendingTel";
import { isPenpalThread, nameKey, type Thread } from "../../core/threads";
import { suggestNames } from "../../core/nameSearch";

/**
 * 편지 목록 화면 안에서 바로 "누구에게?"(2026-10-18, 대표님: "카톡처럼 그 창 안에서 바로 이름, 초간단").
 * 이름을 치는 대로 아는 사람 중 가장 비슷한 이름만 남고, 누르면 그 사람 대화방으로 가서 바로 써요.
 * 아이폰 "자동 완성 연락처" 줄은 띄우지 않아요(autoComplete off). 안드로이드는 [📱 연락처]로 한 명 고르기.
 */
export default function WhoSearch<S, R>({ people, friends, onClose }: { people: Thread<S, R>[]; friends: Friend[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [canPick, setCanPick] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { setCanPick(!IS_TOSS && contactPickerSupported()); ref.current?.focus(); }, []);

  const list = people.filter((t) => !isPenpalThread(t));
  const query = q.trim();
  const shown = query ? suggestNames(list, query, 8) : list;
  const exact = !!query && list.find((t) => nameKey(t.name) === nameKey(query));
  const go = (t: { uid?: string; name: string }) => router.push(roomHref(t));
  const fromContacts = async () => {
    const c = await pickContact();
    if (c?.name) { keepTel(c.name, c.tel); go(list.find((t) => nameKey(t.name) === nameKey(c.name)) ?? { name: c.name }); }
  };

  return (
    <div className="who">
      <form className="whobar" autoComplete="off" onSubmit={(e) => { e.preventDefault(); if (query) go(exact || { name: query }); }}>
        <span aria-hidden className="whoicon">✉</span>
        <input ref={ref} className="whoin" name="who-search" type="text" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
          placeholder="누구에게? 이름을 써 주세요" aria-label="받는 사람 이름" value={q} onChange={(e) => setQ(e.target.value)} />
        {canPick && <button type="button" className="whobtn" aria-label="연락처에서 고르기" onClick={fromContacts}>📱</button>}
        <button type="button" className="whobtn" aria-label="닫기" onClick={onClose}>✕</button>
      </form>
      <ul className="klist">
        {shown.map((t) => {
          const f = friends.find((x) => t.uids?.includes(x.uid));
          return (
            <li key={t.key}>
              <button type="button" className="krow" onClick={() => go(t)}>
                <Face name={t.name} bird={f?.bird} photo={f?.photo} size={58} />
                <span className="kmid"><b className="kname">{t.name}</b></span>
              </button>
            </li>
          );
        })}
        {/* 비슷한 사람이 있으면 그 사람만(헷갈리지 않게). 아무도 없을 때만 새로운 사람으로 쓰기 */}
        {query && shown.length === 0 && (
          <li>
            <button type="button" className="krow newwho" onClick={() => go({ name: query })}>
              <span className="newface" aria-hidden>✉</span>
              <span className="kmid"><b className="kname">‘{query}’에게 쓰기</b><span className="kprev">새로운 사람 · 앱이 없어도 보낼 수 있어요</span></span>
            </button>
          </li>
        )}
      </ul>
      {!query && list.length === 0 && <p className="writehelp">받는 사람 이름을 위에 써 주세요</p>}
    </div>
  );
}
