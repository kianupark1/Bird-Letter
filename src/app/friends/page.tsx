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
import BirdIcon from "@/components/BirdIcon";
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
  const remove = async (f: Friend) => {
    if (!window.confirm(`${f.name}님과 친구를 끊을까요? 서로에게 바로 보내기가 멈춰요.`)) return;
    try { await removeFriend(f.uid); await reload(); } catch { setMsg("끊지 못했어요. 다시 시도해 주세요."); }
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
      <header className="tabhead"><h1 className="pagetitle">친구</h1><GearLink /></header>
      {firebaseEnabled && (
        <Link href="/penpal" className="ppcard">
          <BirdIcon id="crane" size={60} letter />
          <div><b>어딘가로 새 날려 보내기</b><span>모르는 누군가에게 편지가 날아가요. 답장이 오면 펜팔 친구가 돼요</span></div>
        </Link>
      )}
      <Link href="/settings" className="trow merow">
        <Face name={profile.nickname} bird={profile.avatarBird || undefined} photo={profile.photo} size={60} />
        <span className="tmid"><span className="tname">{profile.nickname || "나"}</span><span className="tst">나 · 프로필 사진·이름 바꾸기 ›</span></span>
      </Link>

      <h2 className="friendh">친구 {people.length > 0 && people.length}</h2>
      {!loading && people.length === 0 && <div className="empty">아직 친구가 없어요.<br />아래에서 카카오톡으로 초대해 보세요.</div>}
      <ul className="threads">
        {people.map((t) => {
          const f = friends.find((x) => x.uid === t.uid);
          const own = f?.name && f.name !== t.name ? f.name : "";
          return (
            <li key={t.key}>
              <div className="trow">
                <Link href={roomHref({ uid: t.uid, name: t.name })} className="tfriend">
                  <Face name={t.name} bird={f?.bird} photo={f?.photo} />
                  <span className="tmid"><span className="tname">{t.name}</span>{own && !own.startsWith("새 친구") && <span className="tst">친구가 정한 이름: {own}</span>}</span>
                </Link>
                <button type="button" className="chip" onClick={() => removeAll(t)} aria-label={`${t.name} 친구 끊기`}>끊기</button>
              </div>
            </li>
          );
        })}
      </ul>

      <h2 className="friendh">친구 초대</h2>
      <p className="small" style={{ marginTop: -4 }}>링크를 받은 친구가 시작하면 자동으로 친구가 돼요</p>
      <button type="button" className="sbtn kakao" disabled={!code} onClick={inviteKakao} style={{ width: "100%", height: 72 }}>
        <span aria-hidden>💬</span> 카카오톡으로 초대하기
      </button>
      <div className="optlist">
        {canPick && (
          <button type="button" className="opt" disabled={!code} onClick={inviteFromContacts}>
            <span className="oic" aria-hidden>📇</span><span><b>연락처에서 초대하기</b><span>문자로 초대 링크를 보내요 · 고른 연락처는 저장하지 않아요</span></span>
          </button>
        )}
        <button type="button" className="opt" disabled={!code} onClick={copy}>
          <span className="oic" aria-hidden>🔗</span><span><b>초대 링크 복사하기</b><span>다른 앱에 붙여 넣어 보낼 수 있어요</span></span>
        </button>
        <div className="opt dim">
          <span className="oic" aria-hidden>👥</span>
          <span><b>카카오톡 친구 중에서 찾기</b><span>이미 새 편지를 쓰는 친구가 자동으로 나와요</span><i className="soon">준비 중</i></span>
        </div>
      </div>
      {msg && <div className="small" role="status" style={{ fontSize: 16 }}>{msg}</div>}

      <Link href="/stamps" className="opt rankcard">
        <span className="oic" aria-hidden style={{ background: "var(--card)" }}>🏮</span>
        <span><b>스탬프 도감</b><span>편지가 지나간 명소를 모아요</span></span>
        <span style={{ marginLeft: "auto", fontSize: 26 }} aria-hidden>›</span>
      </Link>

    </main>
  );
}
