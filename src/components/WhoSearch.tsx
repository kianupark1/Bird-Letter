"use client";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import Face from "@/components/Face";
import { ensureMyCode, type Friend } from "@/lib/firebase/friends";
import { firebaseEnabled } from "@/lib/firebase/client";
import { KAKAO_SHARE_READY, shareInviteToKakao } from "@/lib/kakaoShare";
import { readProfile } from "@/lib/settings";
import { STORE } from "@/lib/release";
import { roomHref } from "@/lib/room";
import { IS_TOSS } from "@/lib/target";
import { contactPickerSupported, pickContact } from "@/lib/contactInvite";
import { keepTel } from "@/lib/pendingTel";
import { isPenpalThread, nameKey, type Thread } from "../../core/threads";
import { suggestNames } from "../../core/nameSearch";

/**
 * 편지 목록 화면 안에서 바로 "누구에게?"(2026-10-18, 대표님: "카톡처럼 그 창 안에서 바로 이름, 초간단").
 * 이름을 치는 대로 아는 사람 중 가장 비슷한 이름만 남고, 누르면 그 사람 대화방으로 가서 바로 써요.
 * 아이폰 "자동 완성 연락처" 줄은 띄우지 않아요(autoComplete off).
 * 이름 칸 아래 두 줄(2026-10-23, 대표님: "검색하면 연락처에서 찾기, 카카오톡에서 찾기"):
 *  - 연락처에서 찾기: 폰 기본 고르기 창에서 한 명 → 그 사람 대화방(고른 이름·번호만 쓰고 저장·서버 전송 안 함).
 *    스토어 앱(안드로이드·아이폰)과 안드로이드 크롬에서 돼요.
 *    아이폰 웹(2026-10-27, 대표님: "연락처로 검색이 안 돼")은 웹이 연락처를 직접 못 열어서, 이름·번호 칸을 열고
 *    키보드 위 "자동 완성 연락처"(애플 기본 기능)로 한 명 고르게 해요 → 이름·번호가 같이 채워지면 바로 그 사람 대화방.
 *  - 카카오톡에서 찾기: 카카오톡 친구 고르는 창으로 초대 링크를 보내요 → 친구가 들어오면 친구 목록에 생겨요
 *    (카카오톡 친구 목록을 직접 가져오는 건 카카오 심사가 필요해서 출시 뒤로). 카카오 키 전이면 폰 공유창.
 */
export default function WhoSearch<S, R>({ people, friends, onClose }: { people: Thread<S, R>[]; friends: Friend[]; onClose: () => void }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [canPick, setCanPick] = useState(false);
  const [msg, setMsg] = useState("");
  const [fill, setFill] = useState(false); // 연락처 선택기가 없는 폰(아이폰 웹): 자동 완성 연락처 칸
  const [fName, setFName] = useState("");
  const [fTel, setFTel] = useState("");
  const lastFill = useRef(0);
  const ref = useRef<HTMLInputElement>(null);
  const fillRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setCanPick(!IS_TOSS && contactPickerSupported()); ref.current?.focus(); }, []);

  const list = people.filter((t) => !isPenpalThread(t));
  const query = q.trim();
  const shown = query ? suggestNames(list, query, 8) : list;
  const exact = !!query && list.find((t) => nameKey(t.name) === nameKey(query));
  const go = (t: { uid?: string; name: string }) => router.push(roomHref(t));
  const pickFilled = (name: string, tel: string) => {
    const n = name.trim();
    if (!n) return;
    keepTel(n, tel.replace(/[^\d+]/g, ""));
    go(list.find((t) => nameKey(t.name) === nameKey(n)) ?? { name: n });
  };
  // 자동 완성 연락처는 이름과 번호를 한꺼번에 채워요 → 둘이 거의 동시에 들어오면 바로 넘어가요(손으로 치는 중에는 안 넘어감)
  const latest = useRef({ name: "", tel: "" }); // 두 칸이 같은 순간에 채워져도 최신 값을 보도록
  const onFill = (which: "name" | "tel", v: string) => {
    const now = Date.now();
    const quick = now - lastFill.current < 300;
    lastFill.current = now;
    latest.current = { ...latest.current, [which]: v };
    const { name: n, tel: t } = latest.current;
    if (which === "name") setFName(v); else setFTel(v);
    if (quick && n.trim() && t.replace(/\D/g, "").length >= 9) pickFilled(n, t);
  };
  const fromContacts = async () => {
    if (!canPick) {
      // 키보드가 바로 뜨도록 누른 순간에 칸을 그리고 바로 눌러 둬요(아이폰은 누른 순간에만 키보드를 열어 줘요)
      flushSync(() => { setFill(true); setMsg(""); });
      fillRef.current?.focus();
      return;
    }
    const c = await pickContact();
    if (c?.name) { keepTel(c.name, c.tel); go(list.find((t) => nameKey(t.name) === nameKey(c.name)) ?? { name: c.name }); }
    else if (c === null) setMsg("전화번호가 있는 연락처를 골라 주세요.");
  };
  const fromKakao = async () => {
    if (!firebaseEnabled) { setMsg("서버에 연결된 뒤에 쓸 수 있어요."); return; }
    const p = readProfile();
    const code = await ensureMyCode(p.nickname, p.avatarBird, p.photo).catch(() => "");
    if (!code) { setMsg("서버에 연결하지 못했어요. 잠시 후 다시 해 주세요."); return; }
    if (KAKAO_SHARE_READY && (await shareInviteToKakao(code, p.nickname))) return;
    // 카카오 설정 전이면 폰 공유창(카카오톡도 거기에 있어요)
    const url = `${location.origin}/invite?c=${code}`;
    const text = `${p.nickname || "친구"}님이 새편지 친구로 초대했어요!${STORE.android || STORE.iosUrl ? " 링크를 누르면 친구가 되고 앱도 받을 수 있어요." : ""}`;
    try {
      if (navigator.share) await navigator.share({ title: "새편지 친구 초대", text, url });
      else { await navigator.clipboard.writeText(`${text}\n${url}`); setMsg("초대 링크를 복사했어요. 카카오톡에 붙여넣어 보내 주세요."); }
    } catch {}
  };

  return (
    <div className="who">
      <form className="whobar" autoComplete="off" onSubmit={(e) => { e.preventDefault(); if (query) go(exact || { name: query }); }}>
        <span aria-hidden className="whoicon">✉</span>
        <input ref={ref} className="whoin" name="who-search" type="text" autoComplete="off" autoCorrect="off" spellCheck={false} enterKeyHint="go"
          placeholder="누구에게? 이름을 써 주세요" aria-label="받는 사람 이름" value={q} onChange={(e) => setQ(e.target.value)} />
        <button type="button" className="whobtn" aria-label="닫기" onClick={onClose}>✕</button>
      </form>
      {!query && !IS_TOSS && (
        <div className="whofind">
          <button type="button" className="krow whoopt" onClick={fromContacts}>
            <span className="whoico" aria-hidden>📇</span>
            <span className="kmid"><b className="kname">연락처에서 찾기</b><span className="kprev">폰 연락처에서 골라 바로 편지를 써요</span></span>
          </button>
          <button type="button" className="krow whoopt" onClick={fromKakao}>
            <span className="whoico kakao" aria-hidden>💬</span>
            <span className="kmid"><b className="kname">카카오톡에서 찾기</b><span className="kprev">카카오톡 친구를 골라 초대해요</span></span>
          </button>
        </div>
      )}
      {fill && (
        <form className="whofill" autoComplete="on" onSubmit={(e) => { e.preventDefault(); pickFilled(fName, fTel); }}>
          <p className="whofill-tip">⬇ 키보드 바로 위 <b>‘자동 완성 연락처’</b>를 누르면<br />폰 연락처가 열려요. 한 명을 고르면 끝!</p>
          <input ref={fillRef} className="whofill-in" name="name" type="text" autoComplete="name" placeholder="이름" aria-label="연락처 이름"
            value={fName} onChange={(e) => onFill("name", e.target.value)} />
          <input className="whofill-in" name="tel" type="tel" autoComplete="tel" placeholder="전화번호 (없어도 돼요)" aria-label="전화번호"
            value={fTel} onChange={(e) => onFill("tel", e.target.value)} />
          <div className="whofill-row">
            <button type="submit" className="whofill-go" disabled={!fName.trim()}>✉ 이 사람에게 쓰기</button>
            <button type="button" className="whofill-x" onClick={() => setFill(false)}>닫기</button>
          </div>
          <p className="whofill-note">번호는 문자로 알려 줄 때만 쓰고 저장하지 않아요</p>
        </form>
      )}
      {msg && <p className="whomsg" role="status">{msg}</p>}
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
