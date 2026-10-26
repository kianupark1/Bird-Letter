"use client";
import Link from "next/link";
import { usePeople } from "@/lib/people";
import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { firebaseEnabled } from "@/lib/firebase/client";
import { cachedFriends, ensureMyCode, listFriends, removeFriend, type Friend } from "@/lib/firebase/friends";
import { useBeforePaint } from "@/lib/fastStart";
import { useProfile } from "@/lib/settings";
import { contactPickerSupported, pickContact, smsHref } from "@/lib/contactInvite";
import { KAKAO_SHARE_READY, shareInviteToKakao } from "@/lib/kakaoShare";
import { useSession } from "@/lib/session";
import LoginStart from "@/components/LoginStart";
import NameStep, { shouldAskName } from "@/components/NameStep";
import Face from "@/components/Face";
import SwipeRow from "@/components/SwipeRow";
import GearLink from "@/components/GearLink";
import ProfileZoom from "@/components/ProfileZoom";
import { roomHref } from "@/lib/room";
import { buildThreads } from "../../../core/threads";
import { STORE } from "@/lib/release";

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
  // 편지 쓰기 화면의 [친구 초대하기]로 오면 초대 창을 바로 열어요
  useEffect(() => { if (params.get("invite")) setAdd(true); }, [params]);

  // 지난번 친구 목록을 그리기 전에 먼저 보여 주고(빨리 뜨게), 서버 목록은 뒤에서 받아요
  useBeforePaint(() => {
    if (!firebaseEnabled) return;
    const c = cachedFriends();
    if (c.length) { setFriends(c); setLoading(false); }
  }, []);
  const reload = useCallback(async (fresh = false) => setFriends(await listFriends({ fresh })), []);
  const askName = ready && shouldAskName(profile);
  useEffect(() => {
    if (state !== "ready" || !ready || !firebaseEnabled || legacy) { if (state === "ready") setLoading(false); return; }
    if (askName) { setNaming(true); return; }
    setNaming(false);
    // 친구 목록은 바로 받고, 초대 코드(초대할 때만 필요)는 따로 뒤에서 만들어요(예전엔 코드를 다 만든 뒤에야 친구를 받아서 늦게 떴어요)
    reload().catch(() => setMsg("서버에 연결하지 못했어요. 잠시 후 다시 열어 주세요.")).finally(() => setLoading(false));
  }, [state, ready, askName, reload, legacy]);
  useEffect(() => {
    if (state !== "ready" || !ready || !firebaseEnabled || legacy || askName) return;
    ensureMyCode(profile.nickname, profile.avatarBird, profile.photo).then(setCode).catch(() => {});
  }, [state, ready, askName, legacy, profile.nickname, profile.avatarBird, profile.photo]);

  const [zoom, setZoom] = useState<{ name: string; bird?: string | null; photo?: string } | null>(null);
  // 초대 코드는 뒤에서 만들어 두지만, 아직 안 됐으면 누르는 순간 만들어요
  const getCode = async () => code || (await ensureMyCode(profile.nickname, profile.avatarBird, profile.photo).then((c) => { setCode(c); return c; }));
  const link = (c: string) => `${location.origin}/invite?c=${c}`;
  // 스토어에 앱이 올라간 뒤에는 "앱 받기"도 같이 알려요(링크를 누르면 친구가 되고, 그 화면에 앱 받기 버튼이 있어요)
  const text = `${profile.nickname || "친구"}님이 새편지 친구로 초대했어요!${STORE.android || STORE.iosUrl ? " 링크를 누르면 친구가 되고 앱도 받을 수 있어요." : ""}`;
  const inviteKakao = async () => {
    const c = await getCode().catch(() => "");
    if (!c) { setMsg("서버에 연결하지 못했어요. 잠시 후 다시 해 주세요."); return; }
    if (KAKAO_SHARE_READY && (await shareInviteToKakao(c, profile.nickname))) return;
    await shareAny(); // 카카오 설정 전이면 휴대폰 공유창(카카오톡도 거기에 있어요)
  };
  const shareAny = async () => {
    try {
      const url = link(await getCode());
      if (navigator.share) await navigator.share({ title: "새편지 친구 초대", text, url });
      else { await navigator.clipboard.writeText(`${text}\n${url}`); setMsg("초대 링크를 복사했어요. 친구에게 붙여넣어 보내 주세요."); }
    } catch {}
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link(await getCode())); setMsg("초대 링크를 복사했어요."); } catch {} };
  const inviteFromContacts = async () => {
    const c = await pickContact();
    if (!c) { setMsg("전화번호가 있는 연락처를 골라 주세요."); return; }
    setMsg(`${c.name || "친구"}님께 보낼 문자를 열어요.`);
    location.href = smsHref(c.tel, `${text}\n${link(await getCode())}`);
  };

  if (!firebaseEnabled) return <main className="app"><h1>친구</h1><div className="empty">서버에 연결된 뒤에 쓸 수 있어요.</div></main>;
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/friends" />;
  if (naming) return <NameStep onDone={() => setNaming(false)} />;

  // 카카오톡 친구 목록처럼: 맨 위에 나, 그 아래 친구들(같은 사람의 여러 계정은 한 줄로), 그다음 초대
  const people = buildThreads([], [], friends, book).filter((t) => t.uid);
  const removeAll = async (t: (typeof people)[number]) => {
    if (!window.confirm(`${t.name}님과 친구를 끊을까요? 서로에게 바로 보내기가 멈춰요.`)) return;
    try { for (const u of t.uids ?? [t.uid!]) await removeFriend(u); await reload(true); } catch { setMsg("끊지 못했어요. 다시 시도해 주세요."); }
  };
  return (
    <main className="app friendsp">
      {zoom && <ProfileZoom name={zoom.name} bird={zoom.bird} photo={zoom.photo} onClose={() => setZoom(null)} />}
      {/* 카카오톡처럼: 화면에는 나와 친구 목록만. 친구 초대·모르는 사람에게 보내기는 오른쪽 위 [친구 추가]에 */}
      <header className="tabhead">
        <h1 className="pagetitle">친구</h1>
        <button type="button" className="addbtn invitepill" onClick={() => setAdd(true)}>
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="9" cy="8" r="4" /><path d="M2 21c0-3.9 3.1-7 7-7s7 3.1 7 7" /><path d="M19 8v6M16 11h6" />
          </svg>
          친구 초대
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
                  {/* 얼굴만 누르면 크게 보기, 줄의 나머지를 누르면 대화방 */}
                  <span role="button" tabIndex={0} className="facebtn" aria-label={`${t.name} 프로필 크게 보기`}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setZoom({ name: t.name, bird: f?.bird, photo: f?.photo }); }}>
                    <Face name={t.name} bird={f?.bird} photo={f?.photo} size={58} />
                  </span>
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
            <div className="saekdong" aria-hidden />
            <h2>친구 초대</h2>
            <p className="small" style={{ margin: "0 0 4px", textAlign: "center" }}>링크를 받은 친구가 버튼 한 번으로 가입하면 바로 친구가 돼요</p>
            <button type="button" className="sbtn kakao" disabled={!code} onClick={inviteKakao}>
              <span aria-hidden>💬</span> 카카오톡으로 초대하기
            </button>
            {/* 문자 앱의 "받는 사람"에 이름을 쓰면 폰 연락처에서 가까운 이름을 찾아 줘요(아이폰도 됨). 번호는 저장하지 않아요 */}
            <a className={`sbtn sms ${code ? "" : "off"}`} href={code ? smsHref("", `${text}\n${link(code)}`) : undefined}>
              <span aria-hidden>✉️</span> 문자로 초대하기
            </a>
            {canPick && <button type="button" className="sbtn hwang" disabled={!code} onClick={inviteFromContacts}><span aria-hidden>📇</span> 연락처에서 골라 초대하기</button>}
            {/* 구글 메시지·지메일·인스타 DM 등 폰에 있는 다른 앱으로(폰 공유 창, 없으면 링크 복사) */}
            <button type="button" className="sbtn nam" disabled={!code} onClick={() => void shareAny()}><span aria-hidden>📤</span> 다른 앱으로 초대하기</button>
            <button type="button" className="sheetbtn" disabled={!code} onClick={copy}>🔗 초대 링크 복사하기</button>
            {/* 펜팔 홍보(법무: "펜팔 친구"로만, 만남·연애 표현 없음, 만 14세 이상) */}
            <Link href="/penpal" className="pppromo">
              <div>
                <b>🌏 펜팔, 아세요?</b>
                <span className="pp-d">옛날 그 감성 그대로.<br />어느 도시의 누군가에게 편지를<br />날려 보내면, 새가 천천히 전해 줘요.</span>
                <span className="pp-f">이름 대신 펜팔 이름과 도시만 보여요 · 만 14세 이상</span>
                <span className="pp-go">✉ 펜팔 편지 날려 보내기 ›</span>
              </div>
            </Link>
            {msg && <div className="small" role="status" style={{ textAlign: "center" }}>{msg}</div>}
            <button type="button" className="sheetbtn plain" onClick={() => setAdd(false)}>닫기</button>
          </div>
        </>
      )}
    </main>
  );
}
