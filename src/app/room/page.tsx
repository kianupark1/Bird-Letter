"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { mishapMessage } from "@/lib/flight";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, readOpened, useLetters, useNow, type Letter } from "@/lib/letters";
import { listFriends, type Friend } from "@/lib/firebase/friends";
import type { Meta } from "@/lib/firebase/remote";
import { clockText, dateTimeText, isScheduled } from "../../../core/schedule";
import { avatarTone, buildThreads, initialOf, keyFromParams, type Thread, type ThreadEntry } from "../../../core/threads";
import { letterHref } from "@/lib/target";
import { useSession } from "@/lib/session";
import JourneyMap from "@/components/JourneyMap";
import BirdIcon from "@/components/BirdIcon";

export default function RoomPage() {
  return (
    <Suspense fallback={<main className="app" aria-busy="true" />}>
      <Room />
    </Suspense>
  );
}

type Entry = ThreadEntry<Letter, Meta>;
const asLike = (e: Entry) => (e.dir === "sent" ? e.item : { id: e.item.id, birdId: e.item.birdId, routeId: e.item.routeId, sentAt: e.item.sentAt, arriveAt: e.item.arriveAt });

function Room() {
  const router = useRouter();
  const params = useSearchParams();
  const { state } = useSession();
  const { letters, received, ready } = useLetters();
  const now = useNow(5000);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  useEffect(() => { if (state === "login") router.replace("/"); }, [state, router]);
  useEffect(() => {
    setOpened(readOpened());
    listFriends().then(setFriends).catch(() => {});
  }, []);

  const key = keyFromParams(params.get("u"), params.get("n"));
  const thread: Thread<Letter, Meta> | undefined = useMemo(() => buildThreads(letters, received, friends).find((t) => t.key === key), [letters, received, friends, key]);

  if (state !== "ready" || !ready) return <main className="app" aria-busy="true" />;
  if (!thread) {
    return (
      <main className="app">
        <Link href="/" className="roomback" aria-label="뒤로">‹</Link>
        <div className="empty">이 대화방을 찾을 수 없어요.</div>
      </main>
    );
  }

  // 지도에 보여줄 편지: 오고 있는 편지 > 날아가는 내 편지(가장 최근 것)
  const live = (dir: "received" | "sent") =>
    thread.entries.find((e) => e.dir === dir && !isScheduled(e.at, now) && !letterProgress(asLike(e), now).done);
  const active = live("received") ?? live("sent");
  const incoming = active?.dir === "received";
  const name = thread.name;

  let hero: React.ReactNode = null;
  let subtitle = "";
  if (active) {
    const l = asLike(active);
    const bird = getBird(l.birdId), route = getRoute(l.routeId);
    const pr = letterProgress(l, now);
    const arriveAt = l.arriveAt ?? l.sentAt + pr.total * 60000;
    const left = Math.max(1, Math.ceil(pr.total - pr.elapsed));
    const msg = pr.mishap && (pr.stalled || pr.p > pr.mishap.at - 0.0001) ? mishapMessage(pr.mishap.kind, bird.name) : null;
    subtitle = `${route.title} · ${bird.name}`;
    hero = (
      <>
        <div className="roommap"><JourneyMap route={route} p={pr.p} birdId={bird.id} /></div>
        {pr.stalled && msg && <div className="roomwarn" role="status">{pr.mishap!.kind === "tree" ? "🌳" : "🧭"} {msg.title} {msg.body}</div>}
        <div className="roometa" role="status" aria-live="polite">
          <div className="big">도착까지 <em>{formatMinutes(left)}</em></div>
          <div className="sm">{dateTimeText(arriveAt).split(" ").slice(0, 2).join(" ") === dateTimeText(now).split(" ").slice(0, 2).join(" ") ? "오늘" : dateTimeText(arriveAt).split(" ").slice(0, 2).join(" ")} {clockText(arriveAt)}쯤 도착해요 · {incoming ? "편지는 도착하면 열 수 있어요" : `내용은 ${name}님만 읽어요`}</div>
          <div className="sm">{bird.name} 시속 약 {bird.kmh}km</div>
          <div className="progress"><i style={{ width: `${Math.round(pr.p * 100)}%` }} /></div>
        </div>
      </>
    );
  } else if (thread.entries.length === 0) {
    hero = <div className="roomempty"><BirdIcon id="magpie" size={120} /><p>아직 주고받은 편지가 없어요.<br />첫 편지를 보내 보세요</p></div>;
  } else {
    hero = <div className="roomempty"><p>지금 날아가는 편지는 없어요</p></div>;
  }

  const write = thread.uid ? `/send?to=${encodeURIComponent(thread.uid)}` : `/send?name=${encodeURIComponent(name)}`;

  return (
    <main className="app room">
      <header className="roomhead">
        <Link href="/" className="roomback" aria-label="뒤로">‹</Link>
        <span className={`tav sm tone${avatarTone(name)}`} aria-hidden>{initialOf(name)}</span>
        <div>
          <div className="rname">{name}</div>
          {subtitle && <div className="rsub">{subtitle}</div>}
        </div>
      </header>

      {hero}

      {thread.entries.length > 0 && <div className="dayhint">주고받은 편지</div>}
      <ul className="roomcards">
        {thread.entries.map((e) => {
          const l = asLike(e);
          const bird = getBird(l.birdId);
          const sched = isScheduled(e.at, now);
          const pr = letterProgress(l, now);
          const isNew = e.dir === "received" && pr.done && !opened.has(e.item.id);
          let sub: string;
          if (sched) sub = `${dateTimeText(e.at)} 출발 예정`;
          else if (!pr.done) sub = e.dir === "received" ? `날아오는 중 · ${clockText(l.arriveAt ?? 0)} 도착` : `날아가는 중 · ${formatMinutes(Math.max(1, Math.ceil(pr.total - pr.elapsed)))} 남음`;
          else sub = e.dir === "received" ? (isNew ? "도착했어요 · 눌러서 열기" : "도착했어요 · 눌러서 다시 읽기") : "도착 ✓ · 눌러서 보기";
          return (
            <li key={`${e.dir}-${e.item.id}`}>
              <Link href={letterHref(e.item.id)} className={`rcard ${e.dir === "sent" ? "me" : ""} ${isNew ? "isnew" : ""}`}>
                <span className="ric"><BirdIcon id={bird.id} size={44} letter={!pr.done} /></span>
                <span>
                  <b>{e.dir === "sent" ? "내가 보낸 편지" : `${name}님이 보낸 편지`}</b>
                  <span className="rsub2">{sub}</span>
                </span>
                {isNew && <span className="tbadge">새 편지</span>}
              </Link>
            </li>
          );
        })}
      </ul>

      <div className="dock room-dock">
        <Link href={write} className="cta big">✉ {name}에게 편지 쓰기</Link>
      </div>
    </main>
  );
}
