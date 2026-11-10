"use client";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, markSeen, readOpened, useLetters, useNow, type Letter } from "@/lib/letters";
import { cachedFriends, listFriends, type Friend } from "@/lib/firebase/friends";
import type { Meta } from "@/lib/firebase/remote";
import { isScheduled } from "../../../core/schedule";
import { getPlace } from "../../../core/places";
import { buildThreads, isPenpalThread, isUnnamed, keyFromParams, nameKey, type Thread } from "../../../core/threads";
import { cityLabel, cityOf, penpalName, penpalRoute } from "../../../core/penpal";
import { useProfile } from "@/lib/settings";
import { blockSender, reportLetter } from "@/lib/firebase/remote";
import Face from "@/components/Face";
import { useSession } from "@/lib/session";
import JourneyMap from "@/components/JourneyMap";
import LiveMap from "@/components/LiveMap";
import ShareMap from "@/components/ShareMap";
import LiveTrack from "@/components/LiveTrack";
import BirdIcon from "@/components/BirdIcon";
import ChatLetter from "@/components/ChatLetter";
import RoomComposer, { type Resend } from "@/components/RoomComposer";
import { WELCOME_FROM } from "../../../core/welcome";
import { asLike, buildChat } from "@/lib/chat";
import { WAITING_LINES, pickLine } from "../../../core/waiting";
import { readStats } from "@/lib/firebase/stats";
import { usePeople } from "@/lib/people";
import { useBeforePaint } from "@/lib/fastStart";
import { firebaseEnabled } from "@/lib/firebase/client";
import { IS_TOSS, letterHref } from "@/lib/target";
import { smsHref } from "@/lib/contactInvite";
import { KAKAO_SHARE_READY, shareToKakao } from "@/lib/kakaoShare";
import { telFor } from "@/lib/pendingTel";
import { euro, withIGa } from "@/lib/korean";
import ProfileZoom from "@/components/ProfileZoom";

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
  const { letters, received, ready, backend, add, cancel } = useLetters();
  // 방금 보낸 편지가 '출발 예정'으로 잘못 보이지 않게, 시계가 갱신되기 전이라도 지금 시각보다 뒤처지지 않게 해요
  const tick = useNow(5000);
  const now = Math.max(tick, Date.now());
  const [friends, setFriends] = useState<Friend[]>([]);
  const [friendsKnown, setFriendsKnown] = useState(false);
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const endRef = useRef<HTMLDivElement>(null);
  const [friendPlace, setFriendPlace] = useState<string | undefined>();
  const [bigMap, setBigMap] = useState(false);
  const [shareOn, setShareOn] = useState(false); // 지도 사진 공유 시트
  const [zoomFace, setZoomFace] = useState(false); // 얼굴을 누르면 크게 보기
  // 대화 내용을 먼저 띄우고, 움직이는 지도는 바로 다음 순간에 그려요(대화방이 "팍" 열리게)
  const [mapOn, setMapOn] = useState(false);
  useEffect(() => { const id = requestAnimationFrame(() => setTimeout(() => setMapOn(true), 0)); return () => cancelAnimationFrame(id); }, []);
  const [resend, setResend] = useState<Resend | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [pickFriend, setPickFriend] = useState(false);
  const { book, merge, mergeSame, rename, hide } = usePeople();
  const { profile } = useProfile();

  useEffect(() => { if (state === "login") router.replace("/"); }, [state, router]);
  // 화면에 보이기 전에 지난번 친구 목록·읽은 표시를 먼저 넣고, 서버 목록은 뒤에서 받아요(빨리 뜨게)
  useBeforePaint(() => {
    setOpened(readOpened());
    if (firebaseEnabled) { const c = cachedFriends(); if (c.length) { setFriends(c); setFriendsKnown(true); } }
  }, []);
  useEffect(() => {
    listFriends().then((f) => { setFriends(f); setFriendsKnown(true); }).catch(() => {}); // 서버를 쓰지 않거나 규칙 전이면 친구 없이 보여요
  }, []);

  const key = keyFromParams(params.get("u"), params.get("n"));
  const uParam = params.get("u");
  const allThreads = useMemo(() => buildThreads(letters, received, friends, book), [letters, received, friends, book]);
  // 같은 사람으로 합친 계정 주소(?u=다른 계정)로 들어와도 그 사람의 방을 찾아요
  const nParam = params.get("n")?.trim() || null;
  // 처음 쓰는 이름(?n=이름)이면 빈 대화방을 열어 바로 쓰게 해요(같은 이름의 방이 있으면 그 방으로)
  const thread: Thread<Letter, Meta> | undefined = useMemo(() => {
    const hit = allThreads.find((t) => t.key === key || (!!uParam && !!t.uids?.includes(uParam)));
    if (hit || !nParam) return hit;
    return allThreads.find((t) => nameKey(t.name) === nameKey(nParam)) ?? { key: `n:${nParam}`, name: nParam, entries: [], lastAt: 0 };
  }, [allThreads, key, uParam, nParam]);
  // 이름만 적은 사람을 친구와 합쳤으면, 옛 주소(?n=이름)로 들어와도 친구 방으로 옮겨 줘요
  useEffect(() => {
    if (nParam && !uParam && book.alias[nParam]) router.replace(`/room?u=${encodeURIComponent(book.alias[nParam])}`);
  }, [uParam, nParam, book, router]);
  const name = thread?.name ?? "";
  const theirUid = thread?.uid;
  // 친구가 직접 알려 준 동네(구)가 있으면 받는 곳으로 자동 사용해요. 못 읽거나 없으면 직접 골라요
  useEffect(() => {
    if (!theirUid) return;
    let off = false;
    readStats(theirUid).then((s) => { if (!off) setFriendPlace(s?.place); });
    return () => { off = true; };
  }, [theirUid]);
  const items = useMemo(() => (thread ? buildChat(thread.entries, now) : []), [thread, now, name]);
  // 방에 들어와서 본 도착한 편지는 목록의 안 읽은 수를 꺼요(카카오톡처럼, 2026-11-01 대표님: "확인해도 계속 떠")
  useEffect(() => {
    if (!thread) return;
    markSeen(thread.entries.filter((e) => e.dir === "received" && letterProgress(asLike(e), now).done).map((e) => e.item.id));
  }, [thread, now]);

  // 새 소식이 쌓이면 맨 아래로 내려가요
  const last = items[items.length - 1]?.key;
  // (2026-11-03 대표님: "들어가면 맨 밑으로 저절로 가야 하는데 바로 전까지만 떠") 입력줄이 아래에 붙어 있어서 끝 표시만 보이게 하면
  // 마지막 편지가 입력줄 뒤에 가려졌고, 지도·사진이 늦게 그려지면 높이가 늘어 다시 위로 밀렸어요 → 문서 맨 끝까지, 처음 1.5초 동안은 높이가 늘 때마다 다시
  useEffect(() => {
    if (!ready) return;
    const toEnd = () => { const se = document.scrollingElement ?? document.documentElement; se.scrollTop = se.scrollHeight; };
    toEnd();
    const raf = requestAnimationFrame(toEnd);
    const feed = endRef.current?.parentElement;
    const ro = typeof ResizeObserver !== "undefined" && feed ? new ResizeObserver(toEnd) : null;
    if (ro && feed) ro.observe(feed);
    const ts = [150, 400, 900].map((ms) => setTimeout(toEnd, ms));
    const stop = setTimeout(() => ro?.disconnect(), 1500);
    return () => { cancelAnimationFrame(raf); ts.forEach(clearTimeout); clearTimeout(stop); ro?.disconnect(); };
  }, [last, ready]);

  // 친구 폰 알림 결과(src/lib/letters.ts가 보낸 직후 알려 줘요)
  const [pushMiss, setPushMiss] = useState<{ id: string; status: string } | null>(null);
  useEffect(() => {
    const h = (e: Event) => { const d = (e as CustomEvent).detail; if (d && d.status !== "ok" && (!thread?.uids || thread.uids.includes(d.toUid))) setPushMiss({ id: d.letterId, status: d.status }); };
    window.addEventListener("saepyeonji:friendpush", h);
    return () => window.removeEventListener("saepyeonji:friendpush", h);
  }, [thread]);
  if (state !== "ready" || !ready) return <main className="app" aria-busy="true" />;
  if (!thread && key && backend === "checking") return <main className="app" aria-busy="true" />; // 서버 목록을 받기 전에는 "찾을 수 없어요"를 띄우지 않아요
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
      <>
        <div className="ch-mapwrap">
          <button type="button" className="ch-map" aria-label="지도 크게 보기" onClick={() => setBigMap(true)}>
            {mapOn ? <JourneyMap route={route} p={pr.p} birdId={bird.id} fx ends /> : <div className="map" style={{ height: 108 }} aria-hidden />}
            <LiveTrack l={l} incoming={active.dir === "received"} />
            <span className="zoom" aria-hidden>⤢</span>
          </button>
          {!IS_TOSS && <button type="button" className="ch-share" onClick={() => setShareOn(true)}>📸 공유</button>}
        </div>
        {shareOn && (
          <ShareMap birdId={bird.id} name={isUnnamed(name) ? undefined : name} onClose={() => setShareOn(false)}
            input={{ route, birdName: bird.name, mine: active.dir === "sent", p: pr.p, done: false, stalled: pr.stalled && pr.mishap ? pr.mishap.kind : null, leftMin: left, totalMin: pr.total }} />
        )}
        {bigMap && (
          <LiveMap route={route} birdId={bird.id} title={route.title} onClose={() => setBigMap(false)}
            progress={(t) => { const r = letterProgress(l, t); return { p: r.p, leftMin: Math.ceil(r.total - r.elapsed), arriveAt: l.sentAt + r.total * 60000, stalled: r.stalled }; }} />
        )}
      </>
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
  // 펜팔 방(시안 v5-3): 도시끼리 노선, 펜팔 이름으로 답장, 넘기기·신고·차단
  const pen = isPenpalThread(thread);
  let penpal: { routeId: string; fromName: string; replyTo?: string } | undefined;
  const lastRecv = thread.entries.find((e) => e.dir === "received");
  if (pen) {
    const myCity = cityOf(profile.homePlace);
    const anyRoute = asLike(thread.entries[0]).routeId.split("-");
    const theirCity = lastRecv ? cityOf(asLike(lastRecv).routeId.split("-")[0]) : cityOf(anyRoute[1]);
    penpal = { routeId: penpalRoute(myCity, theirCity), fromName: profile.penpalName?.trim() || penpalName(cityLabel(myCity), profile.avatarBird || "magpie"), replyTo: lastRecv?.item.id };
  }
  const skip = () => { hide(thread.key); router.replace("/"); };
  const reportBlock = async () => {
    if (!thread.uid || !window.confirm(`${name}님을 신고하고 차단할까요?\n차단하면 서로 다시 편지를 주고받을 수 없어요.`)) return;
    try { if (lastRecv) await reportLetter(lastRecv.item.id, "펜팔 신고"); } catch {}
    try { await blockSender(thread.uid); } catch {}
    skip();
  };
  // 보낼 계정: 친구로 이어진 계정(또는 나에게 편지를 보낸 계정, 답장으로)만. 링크를 열어 보기만 한 임시 계정이면
  // 바로 보낼 수 없으니 예전처럼 링크 편지로 보내요(로그인하면 자동으로 친구가 돼요)
  const sendUid = thread.uid && (!friendsKnown || friends.some((f) => f.uid === thread.uid) || thread.entries.some((e) => e.dir === "received" && e.item.fromUid === thread.uid)) ? thread.uid : undefined;
  // 앱이 없는 사람(이름만 있는 방): 가장 최근에 보낸 편지 링크를 문자로 알려 줘요(번호는 저장하지 않아요)
  // 친구에게 보냈는데 친구 폰에 알림이 안 켜져 있으면(구독 없음) 그 편지도 카카오톡·문자로 알리게 해요(2026-11-10 대표님)
  const missEntry = pushMiss ? thread.entries.find((e) => e.dir === "sent" && e.item.id === pushMiss.id) : undefined;
  const lastSent = sendUid ? missEntry : thread.entries.find((e) => e.dir === "sent");
  let smsBody = "";
  if (lastSent && firebaseEnabled && !IS_TOSS && typeof location !== "undefined") {
    const l = asLike(lastSent), r = getRoute(l.routeId);
    // 2026-11-09 대표님: 받는 사람이 "받고 싶게" — 궁금증(내용은 도착해야 열림)과 남은 시간
    const lp = letterProgress(l, now);
    const leftTxt = lp.done ? "벌써 도착했어요! 지금 열어 볼 수 있어요" : `도착까지 약 ${formatMinutes(Math.max(1, Math.ceil(lp.total - lp.elapsed)))}`;
    smsBody = `💌 ${profile.nickname ? `${profile.nickname}님이` : "누군가"} ${name}에게 편지를 보냈어요\n무슨 내용일까요? 도착해야 열 수 있어요.\n지금 ${withIGa(getBird(l.birdId).name)} ${r.title} ${r.km}km를 날아가는 중 · ${leftTxt}\n👉 어디쯤 날고 있는지 보기: ${location.origin}${letterHref(lastSent.item.id)}`;
  }
  const tellId = smsBody && lastSent ? lastSent.item.id : "";
  const tellKakao = async () => {
    if (!lastSent) return;
    const l = asLike(lastSent);
    if (KAKAO_SHARE_READY && (await shareToKakao(lastSent.item.id, getBird(l.birdId).name))) return;
    try {
      if (navigator.share) await navigator.share({ text: smsBody }); // 공유 창에서 카카오톡을 고르면 돼요
      else { await navigator.clipboard.writeText(smsBody); window.alert("알림 글을 복사했어요. 카카오톡에 붙여 넣어 보내 주세요."); }
    } catch {}
  };
  const newestId = thread.entries.find((e) => e.dir === "received" && letterProgress(asLike(e), now).done && !opened.has(e.item.id))?.item.id;

  return (
    <main className="app room chat">
      {/* 제목줄 + 날아가는 편지 지도는 함께 위에 붙어 있어요(2026-11-09 대표님: "지도 보려고 다 올려야 해서 불편, 전송 중이면 위에 뜨게, 사이즈 살짝 줄여") */}
      <div className="roomtop">
      <header className="roomhead">
        <Link href="/" className="roomback" aria-label="뒤로">‹</Link>
        <button type="button" className="facebtn" aria-label={`${name} 프로필 크게 보기`} onClick={() => setZoomFace(true)}>
          <Face name={name} bird={thread.uid ? friends.find((f) => f.uid === thread.uid)?.bird : undefined} photo={thread.uid ? friends.find((f) => f.uid === thread.uid)?.photo : undefined} size={52} />
        </button>
        <div style={{ minWidth: 0 }}>
          {thread.uid && thread.uid !== WELCOME_FROM ? (
            <button type="button" className="rname rname-btn" aria-label={`${name} 이름 바꾸기`}
              onClick={() => { const v = window.prompt("이 친구를 뭐라고 부를까요? (내 폰에만 저장돼요)", name); if (v !== null) rename(thread.uid!, v); }}>{name} <span aria-hidden>✎</span></button>
          ) : <div className="rname">{name}</div>}
          {(subtitle || pen) && <div className="rsub">{pen ? `펜팔 🌏${subtitle ? ` · ${subtitle}` : ""}` : subtitle}</div>}
        </div>
      </header>
      {map}
      </div>
      {zoomFace && (
        <ProfileZoom name={name} bird={thread.uid ? friends.find((f) => f.uid === thread.uid)?.bird : undefined}
          photo={thread.uid ? friends.find((f) => f.uid === thread.uid)?.photo : undefined}
          penpalUid={pen ? thread.uid : undefined} onClose={() => setZoomFace(false)} />
      )}
      {pen && (
        <div className="ppbar" role="note">
          <span>모르는 누군가와의 펜팔이에요. 사진·연락처는 보내지 않아요</span>
          <button type="button" className="chip" onClick={skip}>넘기기</button>
          <button type="button" className="chip" onClick={() => void reportBlock()}>🚩 신고·차단</button>
        </div>
      )}
      {!pen && thread.uid && isUnnamed(name) && (
        <form className="namecard" onSubmit={(e) => { e.preventDefault(); if (nameDraft.trim()) { rename(thread.key.slice(2), nameDraft); setNameDraft(""); } }}>
          <b>이 친구의 이름을 정해 주세요</b>
          <span>친구가 아직 이름을 정하지 않았어요. 내가 정한 이름은 나에게만 보이고, 친구가 이름을 정하면 그 이름으로 바뀌어요.</span>
          <div className="row"><input className="field" value={nameDraft} maxLength={12} placeholder="예: 석영" aria-label="친구 이름" onChange={(e) => setNameDraft(e.target.value)} />
            <button type="submit" className="chip hot" disabled={!nameDraft.trim()}>정하기</button></div>
        </form>
      )}
      {/* 같은 사람일 수 있는 방(이름 없는 친구·친구 목록에 없는 예전 계정)이 있을 때만 물어요. 늘 띄우면 매번 합치라는 것처럼 보여요
          (그 밖에는 이름이 같으면 저절로 합쳐지고, 홈에서 길게 누르기로도 합칠 수 있어요) */}
      {!pen && thread.uid && allThreads.some((t) => t.key !== thread.key && t.uid && !isPenpalThread(t) && (isUnnamed(t.name) || !friends.some((f) => f.uid === t.uid))) && (
        <button type="button" className="linkbtn samebtn" onClick={() => setPickFriend(true)}>같은 사람이 목록에 또 있나요? 합치기</button>
      )}
      {!pen && !sendUid && lastSent && (
        <div className="mergecard">
          <div><b>{name}님은 아직 앱이 없나요?</b><span>편지가 간다고 알려 주세요. 링크로 날아오는 모습을 보고, 도착하면 열어 봐요.</span></div>
          <div className="mc-btns">
            {smsBody && <button type="button" className="chip hot" onClick={() => void tellKakao()}>💬 카카오톡으로</button>}
            {smsBody && <a className="chip" href={smsHref(telFor(name), smsBody)}>✉ 문자로</a>}
            {friends.length > 0 && <button type="button" className="chip" onClick={() => setPickFriend(true)}>친구와 합치기</button>}
          </div>
        </div>
      )}
      {tellId && lastSent && <TellSheet id={tellId} sentAt={asLike(lastSent).sentAt} name={name} body={smsBody} tel={telFor(name)} onKakao={tellKakao} friend={!!missEntry} reason={pushMiss?.status} />}
      {pickFriend && (
        <>
          <button type="button" className="ch-dim" aria-label="닫기" onClick={() => setPickFriend(false)} />
          <div className="ch-sheet" role="dialog" aria-label="친구와 합치기">
            <h2>{name}님은 누구인가요?</h2>
            <p className="small" style={{ margin: "0 0 4px", textAlign: "center" }}>같은 사람을 고르면 한 방으로 모이고, 앞으로도 계속 한 사람으로 보여요(내 계정에 저장).</p>
            {allThreads.filter((t) => t.key !== thread.key && t.uid).map((t) => (
              <button key={t.key} type="button" className="trow" style={{ width: "100%", border: 0, font: "inherit", color: "inherit", cursor: "pointer" }}
                onClick={() => {
                  if (thread.uid) {
                    // 친구 방끼리: 이 방(지금 보고 있는 이름)을 남기고 고른 사람을 여기로 모아요
                    for (const u of t.uids ?? [t.uid!]) mergeSame(u, thread.key.slice(2), name);
                    setPickFriend(false);
                  } else {
                    merge(name, t.uid!); setPickFriend(false); router.replace(`/room?u=${encodeURIComponent(t.uid!)}`);
                  }
                }}>
                <Face name={t.name} bird={friends.find((f) => f.uid === t.uid)?.bird} photo={friends.find((f) => f.uid === t.uid)?.photo} />
                <span className="tmid"><span className="tname">{t.name}</span><span className="tst">{t.entries.length ? `편지 ${t.entries.length}통` : "아직 편지 없음"} · 같은 사람으로 합치고 &quot;{name}&quot;{euro(name)} 불러요</span></span>
              </button>
            ))}
          </div>
        </>
      )}
      <div className="ch-feed">
        {items.length === 0 && (
          <div className="roomempty"><BirdIcon id="magpie" size={120} /><p>{name}님에게 첫 편지를 써 보세요<br /><b>아래 칸에 쓰고 ➤</b></p></div>
        )}
        {items.map((it) =>
          it.kind === "day" ? <div key={it.key} className="ch-day">{it.label}</div>
          : (
            <ChatLetter key={it.key} entry={it.entry} name={name} now={now} isNew={it.entry.item.id === newestId} onOpened={(id) => setOpened((s) => new Set(s).add(id))}
              onResend={(e) => e.dir === "sent" && setResend({ replaceId: e.item.id, message: e.item.message, birdId: e.item.birdId })} />
          ),
        )}
        {active && <div className="ch-wait">🕊 {pickLine(WAITING_LINES, active.item.id)}</div>}
        <div ref={endRef} />
      </div>
      {thread.uid === WELCOME_FROM ? (
        // 환영 편지 방: 새편지에게는 답장하지 않아요 → 첫 편지 쓰러 가기
        <div className="welcomefoot">
          <p>새편지가 보낸 환영 편지예요. 이제 가장 보고 싶은 사람에게 첫 편지를 보내 보세요 🕊</p>
          <Link href="/?write=1" className="cta big welcomego">✉ 첫 편지 쓰기</Link>
        </div>
      ) : (
      <RoomComposer threadKey={key} name={name} toUid={sendUid} guessPlace={guess} friendPlace={friendPlace} add={add} needName={!pen && !!thread.uid && isUnnamed(name)} penpal={penpal} replyTo={thread.entries.find((e) => e.dir === "received" && e.item.fromUid === thread.uid)?.item.id} resend={resend} onResendDone={() => setResend(null)} cancel={cancel} />
      )}
    </main>
  );
}

/** 방금(2분 안) 앱 없는 사람에게 보낸 편지면, 한 번만 "알려 주세요" 창을 띄워요 */
function TellSheet({ id, sentAt, name, body, tel, onKakao, friend, reason }: { id: string; sentAt: number; name: string; body: string; tel: string; onKakao: () => Promise<void>; friend?: boolean; reason?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Date.now() - sentAt > 120000) return;
    const k = "saepyeonji.told.v1";
    let told: string[] = [];
    try { told = JSON.parse(localStorage.getItem(k) || "[]"); } catch {}
    if (told.includes(id)) return;
    try { localStorage.setItem(k, JSON.stringify([...told, id].slice(-100))); } catch {}
    setOpen(true);
  }, [id, sentAt]);
  if (!open) return null;
  return (
    <>
      <button type="button" className="ch-dim" aria-label="닫기" onClick={() => setOpen(false)} />
      <div className="ch-sheet tellsheet" role="dialog" aria-label={`${name}님께 알리기`}>
        <h2>{name}님께 편지가 간다고 알려 주세요</h2>
        {friend ? <p className="small" style={{ margin: 0, textAlign: "center" }}>{reason === "fail" ? `알림 서버가 ${name}님께 알림을 보내지 못했어요.` : `${name}님 폰에 새편지 알림이 꺼져 있어서 편지가 온 걸 모를 수 있어요.`} 카카오톡으로 한 번 알려 주세요. ({name}님 앱의 설정 → 알림을 켜면 다음부터는 저절로 가요)</p>
        : <p className="small" style={{ margin: 0, textAlign: "center" }}>{name}님은 아직 새편지 앱이 없어요. 무슨 내용인지는 도착해야 열려요 — 링크 하나면 앱 없이도 날아오는 모습을 보며 같이 기다릴 수 있어요.</p>}
        <div className="tell-preview">{body}</div>
        <button type="button" className="sbtn kakao" onClick={() => { void onKakao(); setOpen(false); }}><span aria-hidden>💬</span> 카카오톡으로 알리기</button>
        <a className="sbtn sms" href={smsHref(tel, body)} onClick={() => setOpen(false)}><span aria-hidden>✉</span> 문자로 알리기</a>
        <button type="button" className="linkbtn" onClick={() => setOpen(false)}>나중에 할게요</button>
      </div>
    </>
  );
}
