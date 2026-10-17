"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import LetterReveal from "@/components/Unroll";
import { getBird } from "@/lib/birds";
import { getRoute } from "@/lib/routes";
import { letterProgress, markOpened } from "@/lib/letters";
import * as remote from "@/lib/firebase/remote";
import { savePolaroid } from "@/lib/photo";
import { letterHref } from "@/lib/target";
import { asLike, latestPostcard, letterEvents, type Entry } from "@/lib/chat";
import PostcardView from "@/components/Postcard";
import { clockText, dateTimeText, isScheduled } from "../../core/schedule";
import { withIGa } from "@/lib/korean";
import { mishapMessage } from "@/lib/flight";

/**
 * 대화방의 편지 말풍선(카카오톡처럼 깔끔하게): 한 줄 내용 + 작은 상태 한 줄 + 옆에 보낸 시각.
 * 누르면 그 자리에서 펼쳐져서 비행 기록(출발·지난 곳·이야기·도착)과 편지 내용이 보여요.
 */
export default function ChatLetter({ entry, name, now, isNew, onOpened, onResend}: { entry: Entry; name: string; now: number; isNew: boolean; onOpened: (id: string) => void; onResend?: (e: Entry) => void}) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const [waitOk, setWaitOk] = useState(false);
  const mine = entry.dir === "sent";
  const l = asLike(entry);
  const bird = getBird(l.birdId), route = getRoute(l.routeId);
  const sched = isScheduled(entry.at, now);
  const pr = letterProgress(l, now);
  const done = pr.done && !sched;
  const arriveAt = l.arriveAt ?? l.sentAt + pr.total * 60000;
  const myText = mine ? (entry.item as { message: string }).message : "";
  const ownPhotos = mine ? (entry.item as { photos?: string[] }).photos ?? [] : [];

  // 펼쳤을 때: 받는 사람은 도착한 뒤에만 서버에서 내용·사진을 받아요(보낸 사람은 내 글을 언제든 봐요)
  useEffect(() => {
    if (!open || (!done && !mine)) return; // 내 편지는 날아가는 중에도 펼쳐 봐요
    if (!mine) {
      markOpened(entry.item.id); onOpened(entry.item.id);
      if (body === null) remote.getBody(entry.item.id).then((m) => m !== null && setBody(m)).catch(() => {});
    }
    const own = mine ? (entry.item as { photos?: string[] }).photos : undefined;
    if (own?.length) return; // 내 폰에 있는 사진은 말풍선에 바로 보여요
    else remote.getPhotos(entry.item.id).then(setPhotos).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done]);

  // 말풍선에 보일 내용: 내 편지는 메신저처럼 쓴 글 전체가 바로 보여요(2026-10-17 대표님)
  const line = mine
    ? (myText.trim() || "(사진 편지)")
    : sched ? "곧 출발할 편지" : done ? (isNew ? "💌 편지가 도착했어요! 눌러서 열기" : "💌 편지 다시 읽기") : "🔒 도착하면 열어 볼 수 있어요";
  // 작은 상태 한 줄
  const status = sched ? `⏰ ${dateTimeText(entry.at)} 출발 예정`
    : done ? `${bird.name} · 도착 ✓ ${clockText(arriveAt)}`
    : pr.stalled && pr.mishap ? `${pr.mishap.kind === "tree" ? "🌳 나무에 걸림" : "🧭 길 잃음"} · 다시 찾으면 ${clockText(arriveAt)} 도착`
    : `${bird.name} 비행 중 · ${clockText(arriveAt)} 도착 예정`;
  const time = <span className="ch-time">{clockText(sched ? entry.at : l.sentAt)}</span>;
  const row = (bubble: React.ReactNode) => <div className={`ch-row ${mine ? "me" : "you"}`}>{mine && time}{bubble}{!mine && time}</div>;
  const cls = `ch-letter ${mine ? "me" : "you"} ${isNew ? "arrived" : ""} ${open ? "open" : ""}`;
  const head = (
    <>
      <span className={`ch-line${mine ? " full" : ""}`}>{line}</span>
      {mine && ownPhotos.length > 0 && <span className="ch-thumbs">{ownPhotos.map((src, i) => <img key={i} src={src} alt={`보낸 사진 ${i + 1}`} />)}</span>}
      <span className="ch-status"><BirdIcon id={bird.id} size={22} letter={!done} /> {status}</span>
      {!done && !sched && <span className="ch-bar" aria-hidden><i style={{ width: `${Math.round(pr.p * 100)}%` }} /></span>}
    </>
  );

  // 예약 편지는 취소 같은 기능이 있는 기존 화면으로 가요
  if (sched) return row(<Link href={letterHref(entry.item.id)} className={cls}>{head}</Link>);

  // 길을 잃었거나 나무에 걸려 멈춘 동안: 채팅에 바로 알리고, 보낸 사람은 기다리거나 다른 새로 다시 보낼 수 있어요
  const lostMsg = !done && pr.stalled && pr.mishap ? mishapMessage(pr.mishap.kind, bird.name) : null;
  const lost = lostMsg && (
    <div className="ch-lost" role="status">
      <b>{pr.mishap!.kind === "tree" ? "🌳" : "🧭"} {lostMsg.title}</b>
      <span>{mine ? `기다리면 ${clockText(arriveAt)}쯤 꼭 도착해요. 다른 새로 다시 보낼 수도 있어요.` : `길을 다시 찾는 중이에요. ${clockText(arriveAt)}쯤 도착해요.`}</span>
      {mine && onResend && !waitOk && (
        <span className="ch-lost-btns">
          <button type="button" className="chip" onClick={() => setWaitOk(true)}>기다릴게요</button>
          <button type="button" className="chip hot" onClick={() => onResend(entry)}>↺ 다른 새로 다시 보내기</button>
        </span>
      )}
    </div>
  );

  // 날아가는 동안 새가 보낸 가장 최근 엽서(접혀 있을 때 말풍선 아래에 한 장)
  const pc = !done && !open ? latestPostcard(entry, now) : null;

  return row(
    <div className={cls}>
      <button type="button" className="ch-tap" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{head}</button>
      {lost}
      {pc && !lost && <PostcardView card={pc.card} birdId={bird.id} birdName={bird.name} sub={`${bird.name}의 엽서 · ${clockText(pc.at)} · 도감에 모았어요`} small />}
      {open && (
        <div className="ch-detail">
          <ol className="ch-log" aria-label="비행 기록">
            {letterEvents(entry, now).map((ev) => (
              ev.card
                ? <li key={ev.key} className="card"><PostcardView card={ev.card} birdId={bird.id} birdName={bird.name} sub={`${bird.name}의 엽서 · ${ev.sub}`} small /></li>
                : <li key={ev.key} className={ev.future ? "future" : ""}><span className="ic" aria-hidden>{ev.icon}</span><span><b>{ev.text}</b>{ev.sub && <small>{ev.sub}</small>}</span></li>
            ))}
          </ol>
          <div className="ch-route">{route.title} · {route.km}km · {bird.name} 시속 약 {bird.kmh}km</div>
          {mine && !ownPhotos.length && photos.length > 0 && <span className="ch-thumbs">{photos.map((src, i) => <img key={i} src={src} alt={`보낸 사진 ${i + 1}`} />)}</span>}
          {done && !mine ? (
            <LetterReveal
              message={body ?? ""} photos={photos} caption={`${bird.name}가 물고 온 사진`} sub={`${route.title} · ${dateTimeText(arriveAt)}`} loading
              onSave={async (src) => {
                try {
                  const r = await savePolaroid(src, `${bird.name}가 물고 온 사진`, `${route.title} · ${dateTimeText(arriveAt)}`);
                  setNotice(r === "downloaded" ? "폴라로이드를 저장했어요." : "저장 창에서 '이미지 저장'을 눌러 주세요.");
                } catch { setNotice("저장하지 못했어요. 잠시 후 다시 시도해 주세요."); }
              }}
            />
          ) : null}
          {mine && !done && <div className="small" style={{ textAlign: "center" }}>{name}님은 편지가 도착한 뒤에 읽을 수 있어요</div>}
          {notice && <div className="small" role="status">{notice}</div>}
          {!mine && done && <Link href={letterHref(entry.item.id)} className="ch-more">신고·차단</Link>}
        </div>
      )}
    </div>,
  );
}
