"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import Face from "@/components/Face";
import { useLetters } from "@/lib/letters";
import { cachedFriends, listFriends, type Friend } from "@/lib/firebase/friends";
import { firebaseEnabled } from "@/lib/firebase/client";
import { usePeople } from "@/lib/people";
import { roomHref } from "@/lib/room";
import { useBeforePaint } from "@/lib/fastStart";
import { IS_TOSS } from "@/lib/target";
import { contactPickerSupported, pickContact } from "@/lib/contactInvite";
import { keepTel } from "@/lib/pendingTel";
import { buildThreads, isPenpalThread, nameKey } from "../../../core/threads";
import { suggestNames } from "../../../core/nameSearch";
import { useSession } from "@/lib/session";

/**
 * 편지 쓰기 = "누구에게?" 한 화면(2026-10-18, 대표님: "카톡·라인·왓츠앱처럼 처음부터 심플, 할아버지·어린이도 쉽게").
 * 사람을 고르면 바로 그 사람과의 대화방으로 가서, 대화방 안에서 쓰고 보내요.
 */
export default function WritePage() {
  const router = useRouter();
  const { letters, received, ready } = useLetters();
  const { book } = usePeople();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [q, setQ] = useState("");
  const [tel, setTel] = useState("");
  const [canPick, setCanPick] = useState(false);
  const [hint, setHint] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const { state } = useSession();
  useEffect(() => { if (state === "login") router.replace("/"); }, [state, router]);

  useBeforePaint(() => { if (firebaseEnabled) { const c = cachedFriends(); if (c.length) setFriends(c); } }, []);
  useEffect(() => { listFriends().then(setFriends).catch(() => {}); setCanPick(contactPickerSupported()); }, []);

  // 아는 사람: 친구 + 편지를 주고받은 사람(같은 사람은 한 줄, 펜팔은 빼요)
  const people = useMemo(
    () => buildThreads(letters, received, friends, book).filter((t) => !isPenpalThread(t)),
    [letters, received, friends, book],
  );
  const query = q.trim();
  const shown = query ? suggestNames(people, query, 8) : people;
  const exact = !!query && people.some((t) => nameKey(t.name) === nameKey(query));

  const go = (t: { uid?: string; name: string }) => { if (!t.uid) keepTel(t.name, tel); router.push(roomHref(t)); };
  const openContacts = async () => {
    if (canPick) { const c = await pickContact(); if (c) { setTel(c.tel); if (c.name) { setQ(c.name); keepTel(c.name, c.tel); router.push(roomHref({ name: c.name })); } } return; }
    nameRef.current?.focus();
    setHint(true); // 아이폰 웹은 연락처를 직접 못 열어서, 키보드 위 "자동 완성 연락처"를 누르게 알려 줘요
  };

  return (
    <main className="app write">
      <header className="sendhead">
        <Link href="/" className="roomback" aria-label="뒤로">‹</Link>
        <h1>누구에게 보낼까요?</h1>
      </header>

      {/* 이름·전화번호를 한 묶음(form)으로 둬야 아이폰 "자동 완성 연락처"로 고르면 이름과 번호가 같이 들어가요 */}
      <form className="toform" autoComplete="on" onSubmit={(e) => { e.preventDefault(); if (query) go(people.find((t) => nameKey(t.name) === nameKey(query)) ?? { name: query }); }}>
        <div className="namerow">
          <input ref={nameRef} className="field big" name="name" autoComplete="name" placeholder="이름을 써 주세요" value={q} aria-label="받는 사람 이름"
            onChange={(e) => { setQ(e.target.value); setHint(false); }} onBlur={() => setHint(false)} />
          {!IS_TOSS && <button type="button" className="chip contactbtn" onMouseDown={(e) => e.preventDefault()} onClick={openContacts}>📱 연락처</button>}
        </div>
        {hint && <div className="contacthint" role="status">⬇ 키보드 바로 위 <b>‘자동 완성 연락처’</b>를 누르면 연락처가 열려요.</div>}
        {!IS_TOSS && <input className="field telmini" name="tel" type="tel" inputMode="tel" autoComplete="tel" placeholder="전화번호(선택) · 문자로 알려 줄 때만 써요" value={tel} onChange={(e) => setTel(e.target.value)} aria-label="전화번호(선택)" />}
      </form>

      {query && !exact && (
        <button type="button" className="krow newwho" onClick={() => go({ name: query })}>
          <span className="newface" aria-hidden>✉</span>
          <span className="kmid"><b className="kname">‘{query}’에게 쓰기</b><span className="kprev">앱이 없어도 보낼 수 있어요</span></span>
          <span aria-hidden className="go">›</span>
        </button>
      )}

      {shown.length > 0 && <div className="pphead">{query ? "비슷한 사람" : "친구·주고받은 사람"}</div>}
      <ul className="klist">
        {shown.map((t) => {
          const f = friends.find((x) => t.uids?.includes(x.uid));
          return (
            <li key={t.key}>
              <button type="button" className="krow" onClick={() => go(t)}>
                <Face name={t.name} bird={f?.bird} photo={f?.photo} size={58} />
                <span className="kmid"><b className="kname">{t.name}</b><span className="kprev">{t.uid ? "앱으로 바로 가요" : "문자로 알려 줄 수 있어요"}</span></span>
              </button>
            </li>
          );
        })}
      </ul>

      {ready && !query && shown.length === 0 && (
        <p className="writehelp">위에 이름을 쓰거나 <b>📱 연락처</b>에서 골라 주세요.</p>
      )}
      {!IS_TOSS && firebaseEnabled && !query && (
        <Link href="/friends?invite=1" className="linkbtn writeinvite">👤+ 친구 초대하기 ›</Link>
      )}
    </main>
  );
}
