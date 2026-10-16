"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, readOpened, useLetters, useNow, type Letter } from "@/lib/letters";
import { listFriends, type Friend } from "@/lib/firebase/friends";
import type { Meta } from "@/lib/firebase/remote";
import { isScheduled } from "../../../core/schedule";
import { getPlace } from "../../../core/places";
import { buildThreads, keyFromParams, type Thread } from "../../../core/threads";
import Face from "@/components/Face";
import { useSession } from "@/lib/session";
import JourneyMap from "@/components/JourneyMap";
import BirdIcon from "@/components/BirdIcon";
import ChatLetter from "@/components/ChatLetter";
import RoomComposer from "@/components/RoomComposer";
import { asLike, buildChat } from "@/lib/chat";
import { readStats } from "@/lib/firebase/stats";

export default function RoomPage() {
  return (
    <Suspense fallback={<main className="app" aria-busy="true" />}>
      <Room />
    </Suspense>
  );
}

function Room() {
  const router = useRouter();
  const params = useSearchParams();
  const { state } = useSession();
  const { letters, received, ready, add } = useLetters();
  // 방금 보낸 편지가 '출발 예정'으로 잘못 보이지 않게, 시계가 갱신되기 전이라도 지금 시각보다 뒤처지지 않게 해요
  const tick = useNow(5000);
  const now = Math.max(tick, Date.now());
  const [friends, setFriends] = useState<Friend[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const [friendPlace, setFriendPlace] = useState<string | undefined>();

  useEffect(() => { if (state === "login") router.replace("/"); }, [state, router]);
  useEffect(() => {
    setOpened(readOpened());
    listFriends().then(setFriends).catch(() => {});
  }, []);

  const key = keyFromParams(params.get("u"), params.get("n"));
  const thread: Thread<Letter, Meta> | undefined = useMemo(() => buildThreads(letters, received, friends).find((t) => t.key === key), [letters, received, friends, key]);
  const name = thread?.name ?? "";
  const theirUid = thread?.uid;
  // 친구가 직접 알려 준 동네(구)가 있으면 받는 곳으로 자동 사용해요. 못 읽거나 없으면 직접 골라요
  useEffect(() => {
    if (!theirUid) return;
    let off = false;
    readStats(theirUid).then((s) => { if (!off) setFriendPlace(s?.place); });
    return () => { off = true; };
  }, [theirUid]);
  const items = useMemo(() => (thread ? buildChat(thread.entries, now, name) : []), [thread, now, name]);

  // 새 소식이 쌓이면 맨 아래로 내려가요
  const last = items[items.length - 1]?.key;
  useEffect(() => { endRef.current?.scrollIntoView({ block: "end" }); }, [last, ready]);

  if (state !== "ready" || !ready) return <main className="app" aria-busy="true" />;
  if (!thread || !key) {
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
  let map: React.ReactNode = null;
  let subtitle = "";
  if (active) {
    const l = asLike(active);
    const bird = getBird(l.birdId), route = getRoute(l.routeId);
    const pr = letterProgress(l, now);
    const left = Math.max(1, Math.ceil(pr.total - pr.elapsed));
    subtitle = `${route.title} · ${bird.name}`;
    map = (
      <div className="ch-map" role="status" aria-live="polite">
        <JourneyMap route={route} p={pr.p} birdId={bird.id} />
        <div className="eta">도착까지 <em>{formatMinutes(left)}</em></div>
      </div>
    );
  }

  // 받는 곳을 처음 정할 때 알아서 짐작: 마지막 편지의 노선에서 상대가 있는 곳
  const lastEntry = thread.entries[0];
  let guess: string | undefined;
  if (lastEntry) {
    const [a, b] = asLike(lastEntry).routeId.split("-");
    const g = lastEntry.dir === "sent" ? b : a;
    if (getPlace(g)) guess = g;
  }
  const newestId = thread.entries.find((e) => e.dir === "received" && letterProgress(asLike(e), now).done && !opened.has(e.item.id))?.item.id;

  return (
    <main className="app room chat">
      <header className="roomhead">
        <Link href="/" className="roomback" aria-label="뒤로">‹</Link>
        <Face name={name} bird={thread.uid ? friends.find((f) => f.uid === thread.uid)?.bird : undefined} size={52} />
        <div>
          <div className="rname">{name}</div>
          {subtitle && <div className="rsub">{subtitle}</div>}
        </div>
      </header>
      {map}
      <div className="ch-feed">
        {items.length === 0 && (
          <div className="roomempty"><BirdIcon id="magpie" size={120} /><p>아직 주고받은 편지가 없어요.<br />아래에 첫 편지를 써 보세요</p></div>
        )}
        {items.map((it) =>
          it.kind === "day" ? <div key={it.key} className="ch-day">{it.label}</div>
          : it.kind === "event" ? (
            <div key={it.key} className={`ch-ev ${it.tone ?? ""}`}><span>{it.icon} {it.text}</span>{it.sub && <small>{it.sub}</small>}</div>
          ) : (
            <ChatLetter key={it.key} entry={it.entry} name={name} now={now} isNew={it.entry.item.id === newestId} onOpened={(id) => setOpened((s) => new Set(s).add(id))} />
          ),
        )}
        <div ref={endRef} />
      </div>
      <RoomComposer threadKey={key} name={name} toUid={thread.uid} guessPlace={guess} friendPlace={friendPlace} add={add} />
    </main>
  );
}
