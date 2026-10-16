"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { letterProgress, readOpened, useLetters, useNow, type Letter } from "@/lib/letters";
import { formatMinutes } from "@/lib/geo";
import { clockText, dateTimeText, isScheduled } from "../../core/schedule";
import { buildThreads, type Thread } from "../../core/threads";
import Face from "@/components/Face";
import { listFriends, syncMyName, type Friend } from "@/lib/firebase/friends";
import { auth, firebaseEnabled } from "@/lib/firebase/client";
import { publishStats } from "@/lib/firebase/stats";
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

type Row = { lead?: string; sub: string; progress?: number; birdId?: string; badge?: string; side?: string };

/** 대화방 한 줄에 보여줄 상태를 말로 정해요(시안 ①). 가장 눈에 띌 일이 먼저예요 */
function rowInfo(t: Thread<Letter, Meta>, now: number, opened: Set<string>): Row {
  const recvLike = (m: Meta) => ({ id: m.id, birdId: m.birdId, routeId: m.routeId, sentAt: m.sentAt, arriveAt: m.arriveAt });
  let flyingRecv: Meta | undefined, flyingSent: Letter | undefined, newRecv: Meta | undefined, scheduled: Letter | undefined;
  for (const e of t.entries) {
    if (e.dir === "received") {
      const done = letterProgress(recvLike(e.item), now).done;
      if (done && !opened.has(e.item.id) && !newRecv) newRecv = e.item;
      if (!done && !isScheduled(e.item.sentAt, now) && !flyingRecv) flyingRecv = e.item;
    } else if (isScheduled(e.item.sentAt, now)) {
      if (!scheduled) scheduled = e.item;
    } else if (!letterProgress(e.item, now).done && !flyingSent) flyingSent = e.item;
  }
  if (newRecv) return { lead: "새 편지가 도착했어요!", sub: "눌러서 열어 보세요", badge: "새 편지", side: dateTimeText(newRecv.arriveAt).split(" ").slice(0, 2).join(" ") };
  if (flyingRecv) {
    const pr = letterProgress(recvLike(flyingRecv), now);
    return { lead: "편지가 오고 있어요", sub: `${clockText(flyingRecv.arriveAt)} 도착`, progress: pr.p, birdId: flyingRecv.birdId };
  }
  if (flyingSent) {
    const pr = letterProgress(flyingSent, now);
    return { lead: "내 편지가 날아가는 중", sub: `${getRoute(flyingSent.routeId).title} · ${formatMinutes(Math.max(1, Math.ceil(pr.total - pr.elapsed)))} 남음`, progress: pr.p, birdId: flyingSent.birdId };
  }
  if (scheduled) return { lead: "출발 예정", sub: dateTimeText(scheduled.sentAt), side: "예약" };
  const last = t.entries[0];
  if (!last) return { sub: "편지를 보내 보세요" };
  const when = dateTimeText(last.at).split(" ").slice(0, 2).join(" ");
  return { sub: last.dir === "sent" ? "내가 보낸 편지가 도착했어요" : "받은 편지를 읽었어요", side: when };
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
    try { if (localStorage.getItem("saepyeonji.stats.sig") === sig) return; } catch {}
    void publishStats(st, me.nickname, me.avatarBird, place).then((ok) => { if (ok) try { localStorage.setItem("saepyeonji.stats.sig", sig); } catch {} });
  }, [ready, letters, me.nickname, me.avatarBird, me.homePlace, me.sharePlace, me.homeSet]);

  const { book } = usePeople();
  // 내 이름·내 새가 바뀌었으면 친구들 목록 속 "나"도 같이 고쳐요(예전에 "새 친구"로 저장된 것 바로잡기)
  useEffect(() => {
    if (!firebaseEnabled || !friends.length || !me.nickname) return;
    const sig = `${me.nickname}|${me.avatarBird}|${me.photo?.length ?? 0}:${me.photo?.slice(-16) ?? ""}|${friends.map((f) => f.uid).sort().join(",")}`;
    try { if (localStorage.getItem("saepyeonji.namesync.v1") === sig) return; } catch {}
    void syncMyName(friends, me.nickname, me.avatarBird, me.photo).then(() => { try { localStorage.setItem("saepyeonji.namesync.v1", sig); } catch {} });
  }, [friends, me.nickname, me.avatarBird, me.photo]);
  // 카카오톡 "채팅"처럼 편지를 주고받은 사람만 보여요(친구만 맺은 사람은 친구 탭에 있어요)
  const threads = useMemo(() => buildThreads(letters, received, friends, book).filter((t) => t.entries.length > 0), [letters, received, friends, book]);
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
        <Link href="/settings" className="homeask">
          <span aria-hidden style={{ fontSize: 28 }}>📍</span>
          <span><b>내 동네를 정해 주세요</b><span>정해 두면 친구가 편지를 보낼 때 받는 곳이 자동으로 정해져요. 구 이름만 쓰고 언제든 끌 수 있어요.</span></span>
        </Link>
      )}

      {ready && threads.length === 0 && (
        <div className="inbox-empty">
          {heroBird ? <BirdIcon id={heroBird} size={190} letter className="bob" /> : <div style={birdSlot(190)} />}
          <h2>{friends.length ? <>친구에게<br />첫 편지를 보내 보세요</> : <>친구를 초대하면<br />편지를 보낼 수 있어요</>}</h2>
          <p>새가 실제 거리만큼 날아가서<br />천천히 도착해요</p>
          <Link href="/friends" className="cta big">{friends.length ? "친구 목록에서 고르기" : "친구 초대하기"}</Link>
        </div>
      )}

      <ul className="threads">
        {threads.map((t) => {
          const info = rowInfo(t, now, opened);
          return (
            <li key={t.key}>
              <Link href={roomHref(t)} className={`trow ${info.badge ? "hot" : info.progress !== undefined ? "fly" : ""}`}>
                <Face name={t.name} bird={t.uid ? friendBird.get(t.uid)?.bird : undefined} photo={t.uid ? friendBird.get(t.uid)?.photo : undefined} />
                <span className="tmid">
                  <span className="tname">{t.name}</span>
                  <span className="tst">{info.lead && <b>{info.lead}</b>}{info.lead && <br />}{info.sub}</span>
                  {info.progress !== undefined && info.birdId && (
                    <span className="mtrack"><i style={{ width: `${Math.round(info.progress * 100)}%` }} /><span className="mb" style={{ left: `${Math.round(info.progress * 100)}%` }}><BirdIcon id={info.birdId} size={40} /></span></span>
                  )}
                </span>
                {(info.badge || info.side) && (
                  <span className="tside">{info.side}{info.badge && <span className="tbadge">{info.badge}</span>}</span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>

      {flyingAny && <PushPrompt birdId={flyingAny.birdId} />}
      {(letters.length > 0 || received.length > 0) && <InstallCard hideWhenPushPrompt={Boolean(flyingAny)} />}

      {threads.length > 0 && (
        <div className="dock">
          <Link href="/send" className="cta big">✉ 편지 쓰기</Link>
        </div>
      )}
    </main>
  );
}

