"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRoute } from "@/lib/routes";
import { letterProgress, readOpened, syncReadMarks, useLetters, useNow, type Letter } from "@/lib/letters";
import { isScheduled } from "../../core/schedule";
import { buildThreads, isPenpalThread, isUnnamed, visibleThreads, type Thread } from "../../core/threads";
import SwipeRow from "@/components/SwipeRow";
import HomeCountdown from "@/components/HomeCountdown";
import Face from "@/components/Face";
import { befriendSender, cachedFriends, listFriends, syncMyName, type Friend } from "@/lib/firebase/friends";
import { clearSenders, pendingSenders, rememberSender } from "@/lib/linkSenders";
import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { publishStats } from "@/lib/firebase/stats";
import { publishPublicRank } from "@/lib/firebase/ranking";
import { saveMyPenpal } from "@/lib/firebase/penpal";
import { myPenpalDoc } from "@/lib/penpalSync";
import { cityLabel, cityOf, penpalName } from "../../core/penpal";
import { myStatsCapped } from "../../core/rank";
import { claim as claimLetter, type Meta } from "@/lib/firebase/remote";
import BirdIcon from "@/components/BirdIcon";
import GearLink from "@/components/GearLink";
import { todayLine } from "../../core/waiting";
import PushPrompt from "@/components/PushPrompt";
import InstallCard from "@/components/InstallCard";
import LoginStart from "@/components/LoginStart";
import { useSession } from "@/lib/session";
import NameStep, { needsName, shouldAskName } from "@/components/NameStep";
import { BIRDS, getBird } from "../../core/birds";
import { useProfile } from "@/lib/settings";
import { roomHref } from "@/lib/room";
import { useBeforePaint } from "@/lib/fastStart";
import { birdSlot, useRandomBird } from "@/lib/randomBird";
import { usePeople } from "@/lib/people";
import WhoSearch from "@/components/WhoSearch";
import { rowInfo } from "@/lib/chatRow";

export default function Home() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} />;
  return <Inbox />;
}

function Inbox() {
  const { profile, ready: profileReady, update } = useProfile();
  const [named, setNamed] = useState(false);
  const [welcome, setWelcome] = useState("");
  // 처음 로그인한 사람: 카카오·구글·애플이 알려 준 이름이 있으면 묻지 않고 그 이름 + 무작위 "내 새"로 바로 시작해요
  // (2026-10-24 대표님: "카카오톡처럼 처음에 쓰기 편하게" → 이름 화면 한 장을 없앰, 설정에서 언제든 바꿈)
  const ask = profileReady && !named && firebaseEnabled && shouldAskName(profile);
  const known = ask ? knownName(profile.nickname) : "";
  useEffect(() => {
    if (!known) return;
    const bird = profile.avatarBird || BIRDS[Math.floor(Math.random() * BIRDS.length)].id;
    update({ nickname: known, avatarBird: bird });
    setWelcome(`${known}님, 반가워요! 내 새는 ${getBird(bird).name}예요 🐦`);
    setNamed(true);
  }, [known]); // eslint-disable-line react-hooks/exhaustive-deps
  if (ask && !known) return <NameStep onDone={() => setNamed(true)} />;
  if (ask) return <main className="app" aria-busy="true" />;
  return <InboxList welcome={welcome} />;
}

/** 로그인할 때 받은 이름(직접 정한 이름 > 카카오 닉네임 > 구글·애플 이름). 없으면 "" */
function knownName(nickname: string) {
  if (!needsName(nickname)) return nickname.trim();
  try { const k = localStorage.getItem("saepyeonji.kakaoNick.v1")?.trim(); if (k) return k.slice(0, 12); } catch {}
  try { const n = auth().currentUser?.displayName?.trim(); if (n) return n.slice(0, 12); } catch {}
  return "";
}

function InboxList({ welcome }: { welcome?: string }) {
  const { letters, received, ready, backend } = useLetters();
  // "첫 편지를 보내 보세요"는 서버에서 정말 편지가 없다고 확인된 뒤에만(폰에 적어 둔 목록만 보고 띄우면 있던 편지가 잠깐 사라진 것처럼 보여요)
  const settled = ready && backend !== "checking";
  // 예전에 열어 본 편지도 보낸 사람 화면에 "읽음"이 보이게 서버에 남겨요
  useEffect(() => { if (ready) syncReadMarks(received, Date.now()); }, [ready, received]);
  const heroBird = useRandomBird();
  const now = useNow();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  // 화면에 보이기 전에 지난번 친구 목록·읽은 표시를 먼저 넣고, 서버 목록은 뒤에서 받아요(빨리 뜨게)
  useBeforePaint(() => {
    setOpened(readOpened());
    if (firebaseEnabled) { const c = cachedFriends(); if (c.length) setFriends(c); }
  }, []);
  useEffect(() => {
    listFriends().then((list) => {
      setFriends(list);
      // 아직 임시 계정(로그인 전)인데 친구가 있으면 기억해 둬요 → 로그인하면 그 친구들과 저절로 다시 이어지고,
      // 친구 화면에서도 임시 계정과 로그인 계정이 한 사람으로 모여요(합치기를 누르지 않아도)
      try { const u = auth().currentUser; if (u?.isAnonymous) for (const f of list) rememberSender(u.uid, { uid: f.uid, name: f.name }); } catch {}
    }).catch(() => {}); // 서버를 쓰지 않거나 규칙 전이면 친구 없이 보여요
  }, []);
  // 스토어 앱이면 받은 편지를 두 통 읽은 뒤 한 번만 별점을 물어요(src/lib/appShell.ts)
  useEffect(() => { void import("@/lib/appShell").then((m) => m.maybeAskReview()).catch(() => {}); }, []);

  const friendBird = useMemo(() => new Map(friends.map((f) => [f.uid, f])), [friends]);
  // 내 거리 기록을 서버에 올려 둬요(친구가 랭킹에서 볼 수 있게). 로그인한 사람만, 값이 바뀔 때만 올려요
  const { profile: me } = useProfile();
  useEffect(() => {
    if (!ready || !firebaseEnabled) return;
    try { const u = auth().currentUser; if (!u || u.isAnonymous) return; } catch { return; }
    // 거리는 하루 한도(같은 사람 2통·전체 8통)를 넘는 편지는 빼고 셈해요
    const st = myStatsCapped(letters.filter((l) => l.sentAt <= Date.now()).map((l) => ({ km: getRoute(l.routeId).km, toKey: l.toUid ?? l.to, at: l.sentAt })));
    const place = me.sharePlace === false || !me.homeSet ? undefined : me.homePlace; // 친구가 받는 곳을 자동으로 정하는 데 써요
    const sig = `${st.km}|${st.maxKm}|${st.count}|${me.nickname}|${me.avatarBird}|${place ?? ""}`;
    // 전체 랭킹에도 홈을 열 때 올려요(랭킹 화면을 한 번도 안 연 사람도 보이게)
    const rsig = `${sig}|${me.publicRank !== false}`;
    try { if (localStorage.getItem("saepyeonji.rank.sig") !== rsig) void publishPublicRank(st, me.nickname, me.avatarBird, me.publicRank !== false).then((ok) => { if (ok) try { localStorage.setItem("saepyeonji.rank.sig", rsig); } catch {} }); } catch {}
    try { if (localStorage.getItem("saepyeonji.stats.sig") === sig) return; } catch {}
    void publishStats(st, me.nickname, me.avatarBird, place).then((ok) => { if (ok) try { localStorage.setItem("saepyeonji.stats.sig", sig); } catch {} });
  }, [ready, letters, me.nickname, me.avatarBird, me.homePlace, me.sharePlace, me.homeSet, me.publicRank]);

  // 랜덤(펜팔) 편지는 받겠다고 신청한 사람에게만 가요: 예전에 약속만 하고 신청하지 않은 사람은 받기 명단에서 내려요
  useEffect(() => {
    if (!ready || !firebaseEnabled || !me.penpalAgreed) return;
    const d = myPenpalDoc(me);
    // 사진이 바뀌면 다시 올려요(사진 글자 전체 대신 길이·끝부분만 비교)
    const sig = `recv:${d.open}|list:${d.listed}|ph:${d.photo ? `${d.photo.length}:${d.photo.slice(-24)}` : "-"}`;
    try { if (localStorage.getItem("saepyeonji.penpalsync.v1") === sig) return; } catch {}
    void saveMyPenpal(d).then(() => { try { localStorage.setItem("saepyeonji.penpalsync.v1", sig); } catch {} }).catch(() => {});
  }, [ready, me.penpalAgreed, me.penpalRecv, me.penpalListed, me.penpalPhoto, me.photo]);

  const { book, merge, mergeSame, rename, hide } = usePeople();
  const [menu, setMenuRaw] = useState<{ t: Thread<Letter, Meta>; step: "menu" | "merge" } | null>(null);
  const menuAt = useRef(0);
  const setMenu = (m: typeof menu) => { if (m && !menu) menuAt.current = Date.now(); setMenuRaw(m); };
  // 로그인 전에 편지 링크로 받은 편지가 있으면, 로그인한 지금 보낸 사람과 친구로 이어요(그때의 임시 계정도 같은 사람으로)
  useEffect(() => {
    if (!ready || !firebaseEnabled) return;
    try { const u = auth().currentUser; if (!u || u.isAnonymous) return; } catch { return; }
    const p = pendingSenders();
    if (!p) return;
    // 링크로 본 편지는 로그인한 계정의 편지함으로 받아요(이미 누가 받았으면 그대로 둬요)
    void Promise.all([...p.senders.map((s) => befriendSender(s, me.nickname, me.avatarBird, me.photo, p.anon).catch(() => {})),
      ...(p.letters ?? []).map((id) => claimLetter(id).catch(() => {}))])
      .then(() => { clearSenders(); return listFriends({ fresh: true }).then(setFriends); }).catch(() => {});
  }, [ready, me.nickname, me.avatarBird, me.photo]);

  // 내 이름·내 새가 바뀌었으면 친구들 목록 속 "나"도 같이 고쳐요(예전에 "새 친구"로 저장된 것 바로잡기)
  useEffect(() => {
    if (!firebaseEnabled || !friends.length || !me.nickname) return;
    const sig = `${me.nickname}|${me.avatarBird}|${me.photo?.length ?? 0}:${me.photo?.slice(-16) ?? ""}|${friends.map((f) => f.uid).sort().join(",")}`;
    try { if (localStorage.getItem("saepyeonji.namesync.v1") === sig) return; } catch {}
    void syncMyName(friends, me.nickname, me.avatarBird, me.photo).then(() => { try { localStorage.setItem("saepyeonji.namesync.v1", sig); } catch {} });
  }, [friends, me.nickname, me.avatarBird, me.photo]);
  // 카카오톡 "채팅"처럼 편지를 주고받은 사람만 보여요(친구만 맺은 사람은 친구 탭에 있어요)
  const allThreads = useMemo(() => buildThreads(letters, received, friends, book), [letters, received, friends, book]);
  const threads = useMemo(() => visibleThreads(allThreads.filter((t) => t.entries.length > 0), book.hidden), [allThreads, book.hidden]);
  const leave = (t: Thread<Letter, Meta>) => {
    if (!window.confirm(`${t.name} 채팅방을 목록에서 지울까요?\n내 화면에서만 지워지고, 새 편지가 오면 다시 나타나요.`)) return;
    hide(t.key); setMenu(null);
  };
  const others = (t: Thread<Letter, Meta>) => allThreads.filter((x) => x.key !== t.key && x.uid && !isUnnamed(x.name));
  const joinInto = (t: Thread<Letter, Meta>, to: Thread<Letter, Meta>) => {
    const toUid = to.key.slice(2);
    if (t.uid) for (const u of t.uids ?? [t.uid]) mergeSame(u, toUid, to.name);
    else merge(t.name, to.uid!);
    setMenu(null);
  };
  const flyingAny = letters.find((l) => !isScheduled(l.sentAt, now) && !letterProgress(l, now).done);
  // 편지 쓰기: 다른 화면으로 가지 않고 이 목록 맨 위에서 바로 이름을 쳐요(?write=1로 와도 열려요)
  const [writing, setWriting] = useState(false);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("write")) setWriting(true); }, []);

  if (writing) {
    return (
      <main className="app inbox">
        <WhoSearch people={allThreads} friends={friends} onClose={() => { setWriting(false); if (window.location.search) window.history.replaceState(null, "", "/"); }} />
      </main>
    );
  }

  return (
    <main className="app inbox">
      <header className="inboxhead">
        <BirdIcon id="magpie" size={52} />
        <div>
          <h1>새 편지</h1>
          <div className="greet">{todayLine(now)}</div>
        </div>
        <GearLink />
      </header>

      {ready && firebaseEnabled && !me.homeSet && threads.length > 0 && (
        <Link href="/settings" className="homeask slim">
          <span aria-hidden>📍</span><span><b>내 동네를 정해 주세요</b> · 친구가 보낼 때 받는 곳이 자동으로 정해져요</span><span aria-hidden>›</span>
        </Link>
      )}

      {ready && threads.length > 0 && <HomeCountdown threads={threads} />}

      {welcome && <div className="welcomebar" role="status">{welcome} <Link href="/settings">바꾸기 ›</Link></div>}

      {settled && threads.length === 0 && (
        <div className="inbox-empty">
          {heroBird ? <BirdIcon id={heroBird} size={190} letter className="bob" /> : <div style={birdSlot(190)} />}
          <h2>첫 편지를<br />보내 보세요</h2>
          <p>새가 실제 거리만큼 날아가서<br />천천히 도착해요</p>
          <button type="button" className="cta big" onClick={() => setWriting(true)}>✉ 첫 편지 쓰기</button>
          {firebaseEnabled && <Link href="/friends?invite=1" className="cta2" prefetch>💬 카카오톡으로 친구 부르기</Link>}
        </div>
      )}

      {(() => {
        // 친구 편지와 펜팔(모르는 누군가) 편지는 따로 모아요(시안 v5-4)
        const row = (t: Thread<Letter, Meta>) => {
          const info = rowInfo(t, now, opened);
          return (
            <li key={t.key}>
              <SwipeRow label={`${t.name} 채팅방`} onLongPress={() => setMenu({ t, step: "menu" })}
                actions={[...(others(t).length ? [{ label: "합치기", onClick: () => setMenu({ t, step: "merge" }) }] : []), { label: "나가기", tone: "danger" as const, onClick: () => leave(t) }]}>
              <Link href={roomHref(t)} prefetch className={`krow ${isPenpalThread(t) ? "pen" : ""}`}>
                <Face name={t.name} bird={t.uid ? friendBird.get(t.uid)?.bird : undefined} photo={t.uid ? friendBird.get(t.uid)?.photo : undefined} size={58} />
                <span className="kmid">
                  <span className="kline"><b className="kname">{t.name}</b><span className="ktime">{info.time}</span></span>
                  <span className="kline"><span className={`kprev ${info.hot ? "hot" : ""}`}>{info.preview}</span>{info.badge ? <span className="kbadge" aria-label={`안 읽은 편지 ${info.badge}통`}>{info.badge}</span> : null}</span>
                  {info.progress !== undefined && <span className="kbar"><i style={{ width: `${Math.round(info.progress * 100)}%` }} /></span>}
                </span>
              </Link>
              </SwipeRow>
            </li>
          );
        };
        const pen = threads.filter((t) => isPenpalThread(t)), mine = threads.filter((t) => !isPenpalThread(t));
        return (
          <>
            {pen.length > 0 && mine.length > 0 && <div className="pphead">친구</div>}
            <ul className="klist">{mine.map(row)}</ul>
            {pen.length > 0 && (
              <>
                <div className="pphead">펜팔 🌏</div>
                <ul className="klist">{pen.map(row)}</ul>
              </>
            )}
          </>
        );
      })()}

      {threads.some((t) => isUnnamed(t.name)) && (
        <p className="swhint">💡 이름 없는 친구가 이미 있는 친구라면 <b>길게 누르거나 옆으로 밀어서</b> 합칠 수 있어요</p>
      )}

      {menu && (
        <>
          {/* 길게 누르다 손을 뗄 때의 누르기가 바로 닫기로 잡히지 않게, 연 직후 잠깐은 무시해요 */}
          <button type="button" className="ch-dim" aria-label="닫기" onClick={() => { if (Date.now() - menuAt.current > 600) setMenu(null); }} />
          <div className="ch-sheet" role="dialog" aria-label={`${menu.t.name} 메뉴`}>
            {menu.step === "menu" ? (
              <>
                <h2>{menu.t.name}</h2>
                {menu.t.uid && (
                  <button type="button" className="sheetbtn" onClick={() => { const v = window.prompt("이 친구를 뭐라고 부를까요? (나에게만 보여요)", isUnnamed(menu.t.name) ? "" : menu.t.name); if (v !== null) rename(menu.t.key.slice(2), v); setMenu(null); }}>✎ 이름 정하기</button>
                )}
                {others(menu.t).length > 0 && <button type="button" className="sheetbtn" onClick={() => setMenu({ t: menu.t, step: "merge" })}>👥 이미 있는 친구와 합치기</button>}
                <button type="button" className="sheetbtn danger" onClick={() => leave(menu.t)}>🗑 채팅방 나가기</button>
                <button type="button" className="sheetbtn plain" onClick={() => setMenu(null)}>취소</button>
              </>
            ) : (
              <>
                <h2>{menu.t.name}님은 누구인가요?</h2>
                <p className="small" style={{ margin: "0 0 4px", textAlign: "center" }}>같은 사람을 고르면 한 방으로 모이고, 앞으로도 계속 한 사람으로 보여요.</p>
                {others(menu.t).map((o) => (
                  <button key={o.key} type="button" className="trow" style={{ width: "100%", border: 0, font: "inherit", color: "inherit", cursor: "pointer" }} onClick={() => joinInto(menu.t, o)}>
                    <Face name={o.name} bird={o.uid ? friendBird.get(o.uid)?.bird : undefined} photo={o.uid ? friendBird.get(o.uid)?.photo : undefined} />
                    <span className="tmid"><span className="tname">{o.name}</span><span className="tst">{o.entries.length ? `편지 ${o.entries.length}통` : "아직 편지 없음"}</span></span>
                  </button>
                ))}
              </>
            )}
          </div>
        </>
      )}

      {flyingAny && <PushPrompt birdId={flyingAny.birdId} />}
      {(letters.length > 0 || received.length > 0) && <InstallCard hideWhenPushPrompt={Boolean(flyingAny)} />}

      {threads.length > 0 && (
        <button type="button" className="kfab" aria-label="편지 쓰기" onClick={() => setWriting(true)}>✉ 편지 쓰기</button>
      )}
    </main>
  );
}

