"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { letterProgress, readOpened, useLetters, useNow, type Letter } from "@/lib/letters";
import { formatMinutes } from "@/lib/geo";
import { clockText, dateTimeText, isScheduled } from "../../core/schedule";
import { buildThreads, isPenpalThread, isUnnamed, visibleThreads, type Thread } from "../../core/threads";
import SwipeRow from "@/components/SwipeRow";
import HomeCountdown from "@/components/HomeCountdown";
import Face from "@/components/Face";
import { listFriends, syncMyName, type Friend } from "@/lib/firebase/friends";
import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { publishStats } from "@/lib/firebase/stats";
import { publishPublicRank } from "@/lib/firebase/ranking";
import { saveMyPenpal } from "@/lib/firebase/penpal";
import { cityLabel, cityOf, penpalName } from "../../core/penpal";
import { myStatsCapped } from "../../core/rank";
import type { Meta } from "@/lib/firebase/remote";
import BirdIcon from "@/components/BirdIcon";
import GearLink from "@/components/GearLink";
import { todayLine } from "../../core/waiting";
import PushPrompt from "@/components/PushPrompt";
import InstallCard from "@/components/InstallCard";
import LoginStart from "@/components/LoginStart";
import { useSession } from "@/lib/session";
import NameStep, { shouldAskName } from "@/components/NameStep";
import { useProfile } from "@/lib/settings";
import { roomHref } from "@/lib/room";
import { birdSlot, useRandomBird } from "@/lib/randomBird";
import { usePeople } from "@/lib/people";

export default function Home() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} />;
  return <Inbox />;
}

type Row = { preview: string; hot?: boolean; time: string; badge?: number; progress?: number };

/** 카카오톡처럼 시각: 오늘은 "오후 3:12", 어제는 "어제", 그 전은 "10월 17일" */
function listTime(ms: number, now: number): string {
  if (!ms) return "";
  const d = new Date(ms), n = new Date(now);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 86400000);
  if (diff <= 0) return clockText(ms);
  if (diff === 1) return "어제";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 채팅 목록 한 줄: 카카오톡처럼 이름·마지막 소식 한 줄·시각·안 읽은 수 */
function rowInfo(t: Thread<Letter, Meta>, now: number, opened: Set<string>): Row {
  const recvLike = (m: Meta) => ({ id: m.id, birdId: m.birdId, routeId: m.routeId, sentAt: m.sentAt, arriveAt: m.arriveAt });
  let flyingRecv: Meta | undefined, flyingSent: Letter | undefined, scheduled: Letter | undefined, unread = 0, newAt = 0;
  for (const e of t.entries) {
    if (e.dir === "received") {
      const done = letterProgress(recvLike(e.item), now).done;
      if (done && !opened.has(e.item.id)) { unread++; newAt = Math.max(newAt, e.item.arriveAt); }
      if (!done && !isScheduled(e.item.sentAt, now) && !flyingRecv) flyingRecv = e.item;
    } else if (isScheduled(e.item.sentAt, now)) {
      if (!scheduled) scheduled = e.item;
    } else if (!letterProgress(e.item, now).done && !flyingSent) flyingSent = e.item;
  }
  const time = listTime(newAt || t.lastAt, now);
  if (unread) return { preview: "💌 새 편지가 도착했어요. 눌러서 열어 보세요", hot: true, time, badge: unread };
  if (flyingRecv) {
    const pr = letterProgress(recvLike(flyingRecv), now);
    return { preview: `🕊 ${getBird(flyingRecv.birdId).name}가 편지를 물고 오는 중 · ${clockText(flyingRecv.arriveAt)} 도착`, time, progress: pr.p };
  }
  if (flyingSent) {
    const pr = letterProgress(flyingSent, now);
    return { preview: `🕊 내 편지가 날아가는 중 · ${formatMinutes(Math.max(1, Math.ceil(pr.total - pr.elapsed)))} 남음`, time, progress: pr.p };
  }
  if (scheduled) return { preview: `⏰ ${dateTimeText(scheduled.sentAt)} 출발 예정`, time };
  const last = t.entries[0];
  if (!last) return { preview: "편지를 보내 보세요", time: "" };
  if (last.dir === "sent") {
    const line = last.item.message.split("\n").find((x) => x.trim())?.trim();
    return { preview: line ? `나: ${line}` : "✓ 내 편지가 도착했어요", time };
  }
  return { preview: "받은 편지를 읽었어요", time };
}

function Inbox() {
  const { profile, ready: profileReady } = useProfile();
  const [named, setNamed] = useState(false);
  // 서버에 로그인한 사람이 처음이면, 친구들에게 보일 이름부터 물어봐요(서버 없이 개발할 때는 건너뜀)
  if (profileReady && !named && firebaseEnabled && shouldAskName(profile)) return <NameStep onDone={() => setNamed(true)} />;
  return <InboxList />;
}

function InboxList() {
  const { letters, received, ready } = useLetters();
  const heroBird = useRandomBird();
  const now = useNow();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  useEffect(() => {
    setOpened(readOpened());
    listFriends().then(setFriends).catch(() => {}); // 서버를 쓰지 않거나 규칙 전이면 친구 없이 보여요
  }, []);

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
    const open = me.penpalRecv === true;
    const sig = `recv:${open}`;
    try { if (localStorage.getItem("saepyeonji.penpalsync.v1") === sig) return; } catch {}
    const city = cityOf(me.homePlace);
    void saveMyPenpal({ name: me.penpalName?.trim() || penpalName(cityLabel(city), me.avatarBird || "magpie"), bird: me.avatarBird || "magpie", region: city, tags: me.penpalTags ?? [], open })
      .then(() => { try { localStorage.setItem("saepyeonji.penpalsync.v1", sig); } catch {} }).catch(() => {});
  }, [ready, me.penpalAgreed, me.penpalRecv]);

  const { book, merge, mergeSame, rename, hide } = usePeople();
  const [menu, setMenuRaw] = useState<{ t: Thread<Letter, Meta>; step: "menu" | "merge" } | null>(null);
  const menuAt = useRef(0);
  const setMenu = (m: typeof menu) => { if (m && !menu) menuAt.current = Date.now(); setMenuRaw(m); };
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

      {ready && firebaseEnabled && !me.homeSet && (
        <Link href="/settings" className="homeask slim">
          <span aria-hidden>📍</span><span><b>내 동네를 정해 주세요</b> · 친구가 보낼 때 받는 곳이 자동으로 정해져요</span><span aria-hidden>›</span>
        </Link>
      )}

      {ready && threads.length > 0 && <HomeCountdown threads={threads} />}

      {ready && threads.length === 0 && (
        <div className="inbox-empty">
          {heroBird ? <BirdIcon id={heroBird} size={190} letter className="bob" /> : <div style={birdSlot(190)} />}
          <h2>{friends.length ? <>친구에게<br />첫 편지를 보내 보세요</> : <>친구를 초대하면<br />편지를 보낼 수 있어요</>}</h2>
          <p>새가 실제 거리만큼 날아가서<br />천천히 도착해요</p>
          <Link href="/friends" className="cta big">{friends.length ? "친구 목록에서 고르기" : "친구 초대하기"}</Link>
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
              <Link href={roomHref(t)} className={`krow ${isPenpalThread(t) ? "pen" : ""}`}>
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
                <Link href="/penpal" className="ppcard" style={{ padding: "12px 16px" }}><BirdIcon id="crane" size={40} /><div><b style={{ fontSize: 19 }}>또 다른 누군가에게 날려 보내기</b></div></Link>
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
        <Link href="/send" className="kfab" aria-label="편지 쓰기">✉ 편지 쓰기</Link>
      )}
    </main>
  );
}

