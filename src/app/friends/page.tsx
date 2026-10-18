"use client";
import Link from "next/link";
import { usePeople } from "@/lib/people";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseEnabled } from "@/lib/firebase/client";
import { ensureMyCode, listFriends, removeFriend, type Friend } from "@/lib/firebase/friends";
import { useProfile } from "@/lib/settings";
import { contactPickerSupported, pickContact, smsHref } from "@/lib/contactInvite";
import { KAKAO_SHARE_READY, shareInviteToKakao } from "@/lib/kakaoShare";
import { useSession } from "@/lib/session";
import LoginStart from "@/components/LoginStart";
import NameStep, { shouldAskName } from "@/components/NameStep";
import Face from "@/components/Face";
import SwipeRow from "@/components/SwipeRow";
import GearLink from "@/components/GearLink";
import { roomHref } from "@/lib/room";
import { buildThreads } from "../../../core/threads";

export default function FriendsPage() {
  return (
    <Suspense fallback={<main className="app" aria-busy="true" />}>
      <Friends />
    </Suspense>
  );
}

/**
 * 친구 탭(시안 ⑨): 친구 코드는 화면에서 없앴어요. 카카오톡으로 초대 링크를 보내면, 링크를 누른 친구가 로그인하는 순간 자동으로 친구가 돼요.
 * (코드는 초대 링크 안에서만 쓰여요.)
 */
function Friends() {
  const router = useRouter();
  const params = useSearchParams();
  const { state, recheck } = useSession();
  const { profile, ready } = useProfile();
  const [naming, setNaming] = useState(false);
  const [code, setCode] = useState("");
  const [friends, setFriends] = useState<Friend[]>([]);
  const { book } = usePeople();
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(true);
  const [canPick, setCanPick] = useState(false);
  const [add, setAdd] = useState(false);

  // 옛 초대 링크(/friends?add=코드)는 새 초대 화면으로 보내요
  const legacy = params.get("add");
  useEffect(() => { if (legacy) router.replace(`/invite?c=${encodeURIComponent(legacy)}`); }, [legacy, router]);
  useEffect(() => setCanPick(contactPickerSupported()), []);

  const reload = useCallback(async () => setFriends(await listFriends()), []);
  useEffect(() => {
    if (state !== "ready" || !ready || !firebaseEnabled || legacy) { if (state === "ready") setLoading(false); return; }
    if (shouldAskName(profile)) { setNaming(true); return; }
    setNaming(false);
    (async () => {
      try { setCode(await ensureMyCode(profile.nickname, profile.avatarBird, profile.photo)); await reload(); }
      catch { setMsg("서버에 연결하지 못했어요. 잠시 후 다시 열어 주세요."); }
      setLoading(false);
    })();
  }, [state, ready, profile, reload, legacy]);

  const link = () => `${location.origin}/invite?c=${code}`;
  const text = `${profile.nickname || "친구"}님이 새편지 친구로 초대했어요!`;
  const inviteKakao = async () => {
    if (!code) return;
    if (KAKAO_SHARE_READY && (await shareInviteToKakao(code, profile.nickname))) return;
    await shareAny(); // 카카오 설정 전이면 휴대폰 공유창(카카오톡도 거기에 있어요)
  };
  const shareAny = async () => {
    try {
      if (navigator.share) await navigator.share({ title: "새편지 친구 초대", text, url: link() });
      else { await navigator.clipboard.writeText(`${text}\n${link()}`); setMsg("초대 링크를 복사했어요. 친구에게 붙여넣어 보내 주세요."); }
    } catch {}
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link()); setMsg("초대 링크를 복사했어요."); } catch {} };
  const inviteFromContacts = async () => {
    const c = await pickContact();
    if (!c) { setMsg("전화번호가 있는 연락처를 골라 주세요."); return; }
    setMsg(`${c.name || "친구"}님께 보낼 문자를 열어요.`);
    location.href = smsHref(c.tel, `${text}\n${link()}`);
  };

  if (!firebaseEnabled) return <main className="app"><h1>친구</h1><div className="empty">서버에 연결된 뒤에 쓸 수 있어요.</div></main>;
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/friends" />;
  if (naming) return <NameStep onDone={() => setNaming(false)} />;

  // 카카오톡 친구 목록처럼: 맨 위에 나, 그 아래 친구들(같은 사람의 여러 계정은 한 줄로), 그다음 초대
  const people = buildThreads([], [], friends, book).filter((t) => t.uid);
  const removeAll = async (t: (typeof people)[number]) => {
    if (!window.confirm(`${t.name}님과 친구를 끊을까요? 서로에게 바로 보내기가 멈춰요.`)) return;
    try { for (const u of t.uids ?? [t.uid!]) await removeFriend(u); await reload(); } catch { setMsg("끊지 못했어요. 다시 시도해 주세요."); }
  };
  return (
    <main className="app friendsp">
      {/* 카카오톡처럼: 화면에는 나와 친구 목록만. 친구 초대·모르는 사람에게 보내기는 오른쪽 위 [친구 추가]에 */}
      <header className="tabhead">
        <h1 className="pagetitle">친구</h1>
        <button type="button" className="gearlink addbtn" aria-label="친구 추가" onClick={() => setAdd(true)}>
          <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="4" /><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /><path d="M19 8v6M16 11h6" />
          </svg>
        </button>
        <GearLink />
      </header>
      <Link href="/settings" prefetch className="krow merow">
        <Face name={profile.nickname} bird={profile.avatarBird || undefined} photo={profile.photo} size={58} />
        <span className="kmid"><b className="kname">{profile.nickname || "나"}</b><span className="kprev">나</span></span>
      </Link>

      <div className="pphead">친구 {people.length > 0 && people.length}</div>
      {!loading && people.length === 0 && (
        <div className="empty">아직 친구가 없어요.<br /><button type="button" className="linkbtn" onClick={() => setAdd(true)}>친구 초대하기 ›</button></div>
      )}
      <ul className="klist">
        {people.map((t) => {
          const f = friends.find((x) => x.uid === t.uid);
          const own = f?.name && f.name !== t.name ? f.name : "";
          return (
            <li key={t.key}>
              <SwipeRow label={`${t.name} 친구`} onLongPress={() => void removeAll(t)} actions={[{ label: "끊기", tone: "danger", onClick: () => void removeAll(t) }]}>
                <Link href={roomHref({ uid: t.uid, name: t.name })} prefetch className="krow">
                  <Face name={t.name} bird={f?.bird} photo={f?.photo} size={58} />
                  <span className="kmid"><b className="kname">{t.name}</b>{own && <span className="kprev">{own}</span>}</span>
                </Link>
              </SwipeRow>
            </li>
          );
        })}
      </ul>
      {msg && <div className="small" role="status" style={{ fontSize: 16 }}>{msg}</div>}

      {add && (
        <>
          <button type="button" className="ch-dim" aria-label="닫기" onClick={() => setAdd(false)} />
          <div className="ch-sheet" role="dialog" aria-label="친구 추가">
            <h2>친구 추가</h2>
            <p className="small" style={{ margin: "0 0 4px", textAlign: "center" }}>링크를 받은 친구가 시작하면 자동으로 친구가 돼요</p>
            <button type="button" className="sbtn kakao" disabled={!code} onClick={inviteKakao} style={{ width: "100%", height: 64 }}>
              <span aria-hidden>💬</span> 카카오톡으로 초대하기
            </button>
            {canPick && <button type="button" className="sheetbtn" disabled={!code} onClick={inviteFromContacts}>📇 연락처에서 초대하기</button>}
            <button type="button" className="sheetbtn" disabled={!code} onClick={copy}>🔗 초대 링크 복사하기</button>
            <Link href="/penpal" className="sheetbtn" style={{ textAlign: "center", textDecoration: "none" }}>🌏 모르는 누군가에게 보내기</Link>
            {msg && <div className="small" role="status" style={{ textAlign: "center" }}>{msg}</div>}
            <button type="button" className="sheetbtn plain" onClick={() => setAdd(false)}>닫기</button>
          </div>
        </>
      )}
    </main>
  );
}
