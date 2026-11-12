"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getRoute } from "@/lib/routes";
import { letterProgress, readChecked, syncReadMarks, useLetters, useNow, type Letter } from "@/lib/letters";
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
import InstallCard from "@/components/InstallCard";
import LoginStart from "@/components/LoginStart";
import { useSession } from "@/lib/session";
import { justJoined } from "@/lib/install";
import NameStep, { needsName } from "@/components/NameStep";
import { loadAccountName, markNameAsked, nameAskedHere, saveProfileRemote } from "@/lib/profileSync";
import { BIRDS, getBird, isRetired } from "../../core/birds";
import { useProfile } from "@/lib/settings";
import { roomHref } from "@/lib/room";
import { useBeforePaint } from "@/lib/fastStart";
import { birdSlot, useRandomBird } from "@/lib/randomBird";
import { usePeople } from "@/lib/people";
import FirstTour from "@/components/FirstTour";
import { isWelcome } from "../../core/welcome";
import WhoSearch from "@/components/WhoSearch";
import { rowInfo } from "@/lib/chatRow";
import { KIND_LABEL, loginKind, markSameAsked, otherAccountHere, saveLastLogin, type LastLogin } from "@/lib/lastLogin";

export default function Home() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} />;
  return <Inbox />;
}

function Inbox() {
  const { profile, ready: profileReady, update } = useProfile();
  const [welcome, setWelcome] = useState("");
  // 프로필(사진·이름·내 동네) 화면은 계정마다 딱 한 번만(2026-11-01 대표님: "편지든 친구든 뒤로 가든 계속 떠, 처음에만")
  // - 로그인 확인이 끝난 뒤에 정해요(예전엔 확인 전에 정해서 계정 프로필을 못 읽고 화면이 떴어요)
  // - 이 폰·내 계정·예전 이름(랭킹 기록)에 이름이 있으면 묻지 않아요
  // - 처음 한 번 보여 주면 계정에 남겨서, 다른 화면으로 갔다 와도·스토어 앱으로 옮겨도 다시 안 떠요(이름은 카카오 이름을 미리 넣어 둠)
  const [phase, setPhase] = useState<"idle" | "checking" | "ask" | "done">("idle");
  const [prefill, setPrefill] = useState("");
  useEffect(() => {
    if (!profileReady || phase !== "idle") return;
    const randomBird = () => profile.avatarBird || BIRDS[Math.floor(Math.random() * BIRDS.length)].id;
    if (!firebaseEnabled || !needsName(profile.nickname)) {
      let bird = profile.avatarBird;
      if (firebaseEnabled && !bird && profile.nickname.trim()) { bird = randomBird(); update({ avatarBird: bird }); }
      // 카카오·네이버로 막 가입: 이름은 카카오 이름 그대로(이름 화면 없이), 홈 위에 인사 띠 한 번(바꾸기 ›는 설정으로)
      if (firebaseEnabled && profile.nickname.trim() && justJoined() && sayHelloOnce()) hello(profile.nickname.trim(), bird || randomBird());
      setPhase("done");
      return;
    }
    setPhase("checking");
    let off = false;
    const finish = () => { if (!off) setPhase("done"); };
    const timer = setTimeout(finish, 6000); // 인터넷이 느려도 6초 넘게 막지 않아요
    void (async () => {
      try { await auth().authStateReady(); } catch {}
      const u = (() => { try { return auth().currentUser; } catch { return null; } })();
      if (!u || u.isAnonymous) return finish();
      const acc = await loadAccountName(u.uid);
      if (off) return;
      if (acc.profile) {
        const p = acc.profile;
        update((prev) => ({ ...p, fontScale: prev.fontScale, notify: { ...prev.notify, ...(p.notify ?? {}) }, avatarBird: p.avatarBird || prev.avatarBird || randomBird() }));
        return finish();
      }
      if (acc.serverName) { update({ nickname: acc.serverName, avatarBird: profile.avatarBird || acc.serverBird || randomBird() }); return finish(); }
      const login = knownName();
      if (acc.asked || nameAskedHere(u.uid)) { update({ ...(login ? { nickname: login } : {}), avatarBird: randomBird() }); return finish(); }
      markNameAsked(u.uid);
      // 로그인에서 이름을 받았으면(카카오·네이버 별명, 구글·애플 이름) 이름 화면 없이 그 이름으로 바로 시작(2026-11-11 대표님: "카카오 이름 그대로, 처음 쓰는 사람이 편하게")
      if (login) {
        const b = randomBird();
        update({ nickname: login, avatarBird: b });
        if (sayHelloOnce()) hello(login, b);
        return finish();
      }
      clearTimeout(timer);
      setPrefill(login);
      setPhase("ask");
    })();
    return () => { off = true; clearTimeout(timer); };
  }, [profileReady]); // eslint-disable-line react-hooks/exhaustive-deps
  function hello(name: string, bird: string) { setWelcome(`${name}님, 반가워요! 내 새는 ${getBird(bird).name}예요 🐦`); }
  // 내 새가 빠진 새(제비·두루미·붕붕이)면 남은 3종(까치·비둘기·매) 중 하나로 바꿔요(2026-11-01 새 3종으로 줄임)
  useEffect(() => {
    if (profileReady && profile.avatarBird && isRetired(profile.avatarBird)) update({ avatarBird: BIRDS[Math.floor(Math.random() * BIRDS.length)].id });
  }, [profileReady, profile.avatarBird]); // eslint-disable-line react-hooks/exhaustive-deps
  // 예전부터 이 폰에 이름이 있던 사람은 한 번 계정에도 올려 둬요(다음에 스토어 앱·새 폰에서 다시 안 물어보게)
  useEffect(() => {
    if (!profileReady || !firebaseEnabled || !profile.nickname.trim()) return;
    try { if (localStorage.getItem("saepyeonji.profilesync.v1")) return; localStorage.setItem("saepyeonji.profilesync.v1", "1"); } catch { return; }
    saveProfileRemote(profile);
  }, [profileReady, profile.nickname]); // eslint-disable-line react-hooks/exhaustive-deps
  if (phase === "ask") return <NameStep prefill={prefill} onDone={(name, bird) => { if (name) setWelcome(`${name}님, 반가워요! 내 새는 ${getBird(bird).name}예요 🐦`); setPhase("done"); }} />;
  if (phase === "checking" || (phase === "idle" && profileReady && firebaseEnabled && needsName(profile.nickname))) return <main className="app" aria-busy="true" />;
  return <InboxList welcome={welcome} />;
}

/** 가입 인사 띠는 이 폰에서 한 번만 */
function sayHelloOnce() {
  try { if (localStorage.getItem("saepyeonji.hello.v1")) return false; localStorage.setItem("saepyeonji.hello.v1", "1"); } catch {}
  return true;
}

/** 로그인할 때 받은 이름(카카오·네이버 별명 > 구글·애플 이름). 없으면 "" */
function knownName() {
  try { const k = localStorage.getItem("saepyeonji.kakaoNick.v1")?.trim(); if (k) return k.slice(0, 12); } catch {}
  try { const n = auth().currentUser?.displayName?.trim(); if (n) return n.slice(0, 12); } catch {}
  return "";
}

const isE2E = () => { try { return !!localStorage.getItem("saepyeonji.e2e.v1"); } catch { return false; } };

function InboxList({ welcome }: { welcome?: string }) {
  const { letters, received, ready, backend } = useLetters();
  // "첫 편지를 보내 보세요"는 서버에서 정말 편지가 없다고 확인된 뒤에만(폰에 적어 둔 목록만 보고 띄우면 있던 편지가 잠깐 사라진 것처럼 보여요)
  const settled = ready && backend !== "checking";
  const welcomeLetter = received.find((m) => isWelcome(m.id));
  // 스토어 앱: 처음 홈을 열 때 알림 허용을 한 번 물어서 바로 켜요(설정에 안 들어가도 되게, 카카오톡처럼)
  useEffect(() => { if (ready && !isE2E()) void import("@/lib/push").then((m) => m.autoEnableAppPush()).catch(() => {}); }, [ready]);
  // 예전에 열어 본 편지도 보낸 사람 화면에 "읽음"이 보이게 서버에 남겨요
  useEffect(() => { if (ready) syncReadMarks(received, Date.now()); }, [ready, received]);
  const heroBird = useRandomBird();
  const now = useNow();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [friendsLoaded, setFriendsLoaded] = useState(false);
  const [sameMe, setSameMe] = useState<LastLogin | null>(null);

  // 화면에 보이기 전에 지난번 친구 목록·읽은 표시를 먼저 넣고, 서버 목록은 뒤에서 받아요(빨리 뜨게)
  useBeforePaint(() => {
    setOpened(readChecked());
    if (firebaseEnabled) { const c = cachedFriends(); if (c.length) setFriends(c); }
  }, []);
  useEffect(() => {
    listFriends().then((list) => {
      setFriends(list); setFriendsLoaded(true);
      // 아직 임시 계정(로그인 전)인데 친구가 있으면 기억해 둬요 → 로그인하면 그 친구들과 저절로 다시 이어지고,
      // 친구 화면에서도 임시 계정과 로그인 계정이 한 사람으로 모여요(합치기를 누르지 않아도)
      try { const u = auth().currentUser; if (u?.isAnonymous) for (const f of list) rememberSender(u.uid, { uid: f.uid, name: f.name }); } catch {}
    }).catch(() => {}); // 서버를 쓰지 않거나 규칙 전이면 친구 없이 보여요
  }, []);
  // 스토어 앱이면 받은 편지를 두 통 읽은 뒤 한 번만 별점을 물어요(src/lib/appShell.ts)
  useEffect(() => { void import("@/lib/appShell").then((m) => m.maybeAskReview()).catch(() => {}); }, []);

  const friendBird = useMemo(() => new Map(friends.map((f) => [f.uid, f])), [friends]);
  const { profile: me } = useProfile();
  // 같은 사람이 계정 둘로 갈라지지 않게: 이 폰의 지난 계정과 다르면 한 번 묻고, 아니면 지금 계정을 기억해요(src/lib/lastLogin.ts)
  useEffect(() => {
    if (!firebaseEnabled || !friendsLoaded || isE2E()) return;
    let u; try { u = auth().currentUser; } catch { return; }
    if (!u || u.isAnonymous) return;
    const other = otherAccountHere(u.uid);
    if (other) { setSameMe(other); return; }
    const uid = u.uid;
    void loginKind(u).then((kind) => { if (kind) saveLastLogin({ uid, kind, name: me.nickname, friends: friends.map((f) => ({ uid: f.uid, name: f.name })).slice(0, 200), at: Date.now() }); });
  }, [friendsLoaded, friends, me.nickname]); // eslint-disable-line react-hooks/exhaustive-deps
  const answerSameMe = (yes: boolean) => {
    const old = sameMe; if (!old) return;
    let uid = ""; try { uid = auth().currentUser?.uid ?? ""; } catch {}
    if (!uid) return;
    markSameAsked(old.uid, uid, yes ? "yes" : "no");
    setSameMe(null);
    if (!yes) return;
    // 예전 계정의 친구들과 다시 이어요. 친구들 화면에서는 예전 계정(prev)과 지금 계정이 한 사람으로 모여요
    void Promise.all(old.friends.filter((f) => f.uid !== uid).map((f) => befriendSender(f, me.nickname, me.avatarBird, me.photo, [old.uid]).catch(() => {})))
      .then(() => listFriends({ fresh: true }).then(setFriends)).catch(() => {});
  };
  // 내 거리 기록을 서버에 올려 둬요(친구가 랭킹에서 볼 수 있게). 로그인한 사람만, 값이 바뀔 때만 올려요
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

  // 랜덤(펜팔) 편지 받기 명단: 2026-11-10 대표님 "처음부터 모두 펜팔 가능하게, 대신 받을지는 물어보게"
  // → 로그인하고 이름이 있는 사람은 모두 명단에 올라가요(설정에서 끈 사람만 빼요). 처음 온 펜팔 편지는 대화방에서 받을지 물어요
  useEffect(() => {
    if (!ready || !firebaseEnabled || !me.nickname?.trim()) return;
    try { const u = auth().currentUser; if (!u || u.isAnonymous) return; } catch { return; }
    const d = myPenpalDoc(me);
    // 사진이 바뀌면 다시 올려요(사진 글자 전체 대신 길이·끝부분만 비교)
    const sig = `recv:${d.open}|list:${d.listed}|ph:${d.photo ? `${d.photo.length}:${d.photo.slice(-24)}` : "-"}`;
    try { if (localStorage.getItem("saepyeonji.penpalsync.v1") === sig) return; } catch {}
    void saveMyPenpal(d).then(() => { try { localStorage.setItem("saepyeonji.penpalsync.v1", sig); } catch {} }).catch(() => {});
  }, [ready, me.nickname, me.penpalRecv, me.penpalListed, me.penpalPhoto, me.photo, letters.length]);

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
        {/* 랭킹은 왼쪽 위 버튼으로(2026-11-12 대표님: "랭킹을 왼쪽 위로") */}
        <Link href="/rank" prefetch className="ranklink" aria-label="랭킹">
          <svg viewBox="0 0 24 24" width="26" height="26" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 16v5M7 4h10v5a5 5 0 0 1-10 0V4z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></svg>
          <span>랭킹</span>
        </Link>
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

      {sameMe && (
        <div className="sameme" role="dialog" aria-label="같은 사람 확인">
          <b>이 폰에서 전에 {KIND_LABEL[sameMe.kind]}로 쓰던 ‘{sameMe.name || "예전"}’ 계정이 있어요</b>
          <span>같은 사람이면 친구 {sameMe.friends.length}명을 지금 계정으로 이어 드려요. 친구 화면에서도 한 사람으로 보여요.</span>
          <span className="sameme-btns">
            <button type="button" className="chip hot" onClick={() => answerSameMe(true)}>네, 저예요</button>
            <button type="button" className="chip" onClick={() => answerSameMe(false)}>아니에요</button>
          </span>
          <small>다음부터는 {KIND_LABEL[sameMe.kind]}로 들어오면 계정이 하나로 유지돼요</small>
        </div>
      )}
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
        // 친구 편지와 펜팔 편지를 한 목록에 시간순으로(2026-11-12 대표님: "펜팔도 메시지에, 펜팔이라고 따로 표시")
        const row = (t: Thread<Letter, Meta>) => {
          const info = rowInfo(t, now, opened);
          return (
            <li key={t.key}>
              <SwipeRow label={`${t.name} 채팅방`} onLongPress={() => setMenu({ t, step: "menu" })}
                actions={[...(others(t).length ? [{ label: "합치기", onClick: () => setMenu({ t, step: "merge" }) }] : []), { label: "나가기", tone: "danger" as const, onClick: () => leave(t) }]}>
              <Link href={roomHref(t)} prefetch className={`krow ${isPenpalThread(t) ? "pen" : ""}`}>
                <Face name={t.name} bird={t.uid ? friendBird.get(t.uid)?.bird : undefined} photo={t.uid ? friendBird.get(t.uid)?.photo : undefined} size={58} />
                <span className="kmid">
                  <span className="kline"><b className="kname">{t.name}</b>{isPenpalThread(t) && <span className="kpen">🌏 펜팔</span>}<span className="ktime">{info.time}</span></span>
                  <span className="kline"><span className={`kprev ${info.hot ? "hot" : ""}`}>{info.preview}</span>{info.badge ? <span className="kbadge" aria-label={`안 읽은 편지 ${info.badge}통`}>{info.badge}</span> : null}</span>
                  {info.progress !== undefined && <span className="kbar"><i style={{ width: `${Math.round(info.progress * 100)}%` }} /></span>}
                </span>
              </Link>
              </SwipeRow>
            </li>
          );
        };
        return <ul className="klist">{threads.map(row)}</ul>;
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

      {(letters.length > 0 || received.length > 0) && <InstallCard />}

      {threads.length > 0 && (
        <button type="button" className="kfab" aria-label="편지 쓰기" onClick={() => setWriting(true)}>✉ 편지 쓰기</button>
      )}
      {/* 처음 쓰는 사람: "사용법 간단히 알려 드릴까요?" → 진짜 버튼을 비추며 한 장씩(환영 편지를 받는 새 계정에게 한 번) */}
      <FirstTour auto={settled && !isE2E() && !!welcomeLetter} welcomeSoon={!!welcomeLetter && welcomeLetter.arriveAt > now} />
    </main>
  );
}

