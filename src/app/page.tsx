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
import { listFriends, type Friend } from "@/lib/firebase/friends";
import { firebaseEnabled } from "@/lib/firebase/client";
import type { Meta } from "@/lib/firebase/remote";
import BirdIcon from "@/components/BirdIcon";
import PushPrompt from "@/components/PushPrompt";
import InstallCard from "@/components/InstallCard";
import LoginStart from "@/components/LoginStart";
import { useSession } from "@/lib/session";
import NameStep, { shouldAskName } from "@/components/NameStep";
import { useProfile } from "@/lib/settings";
import { roomHref } from "@/lib/room";
import { birdSlot, useRandomBird } from "@/lib/randomBird";

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

  const friendBird = useMemo(() => new Map(friends.map((f) => [f.uid, f.bird])), [friends]);
  const threads = useMemo(() => buildThreads(letters, received, friends), [letters, received, friends]);
  const flyingAny = letters.find((l) => !isScheduled(l.sentAt, now) && !letterProgress(l, now).done);

  return (
    <main className="app inbox">
      <header className="inboxhead">
        <BirdIcon id="magpie" size={52} />
        <div>
          <h1>새 편지</h1>
          <div className="greet">오늘도 편지 날리기 좋은 날 ☀</div>
        </div>
      </header>

      {ready && threads.length === 0 && (
        <div className="inbox-empty">
          {heroBird ? <BirdIcon id={heroBird} size={190} letter className="bob" /> : <div style={birdSlot(190)} />}
          <h2>친구를 초대하면<br />편지를 보낼 수 있어요</h2>
          <p>새가 실제 거리만큼 날아가서<br />천천히 도착해요</p>
          <Link href="/friends" className="cta big">친구 초대하기</Link>
        </div>
      )}

      <ul className="threads">
        {threads.map((t) => {
          const info = rowInfo(t, now, opened);
          return (
            <li key={t.key}>
              <Link href={roomHref(t)} className={`trow ${info.badge ? "hot" : info.progress !== undefined ? "fly" : ""}`}>
                <Face name={t.name} bird={t.uid ? friendBird.get(t.uid) : undefined} />
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

