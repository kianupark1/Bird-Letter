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
import { asLike, type Entry } from "@/lib/chat";
import { dateTimeText, isScheduled } from "../../core/schedule";
import { withIGa } from "@/lib/korean";

/** 대화방 안의 편지 말풍선. 눌러서 그 자리에서 펼쳐 읽어요(새 화면으로 가지 않아요) */
export default function ChatLetter({ entry, name, now, isNew, onOpened }: { entry: Entry; name: string; now: number; isNew: boolean; onOpened: (id: string) => void }) {
  const [open, setOpen] = useState(false);
  const [body, setBody] = useState<string | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [notice, setNotice] = useState("");
  const mine = entry.dir === "sent";
  const l = asLike(entry);
  const bird = getBird(l.birdId), route = getRoute(l.routeId);
  const sched = isScheduled(entry.at, now);
  const pr = letterProgress(l, now);
  const done = pr.done && !sched;
  const arriveAt = l.arriveAt ?? l.sentAt + pr.total * 60000;
  const text = mine ? (entry.item as { message: string }).message : body;

  // 펼쳤을 때: 받는 사람은 도착한 뒤에만 서버에서 내용·사진을 받아요(보낸 사람은 내 글을 언제든 봐요)
  useEffect(() => {
    if (!open) return;
    if (!mine) {
      if (!done) return;
      markOpened(entry.item.id); onOpened(entry.item.id);
      if (body === null) remote.getBody(entry.item.id).then((m) => m !== null && setBody(m));
    }
    if (done) {
      const own = mine ? (entry.item as { photos?: string[] }).photos : undefined;
      if (own?.length) setPhotos(own);
      else remote.getPhotos(entry.item.id).then(setPhotos).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, done]);

  const who = mine ? "내가 보낸 편지" : `${withIGa(name)} 보낸 편지`;
  let sub: string;
  if (sched) sub = `${dateTimeText(entry.at)} 출발 예정 · 눌러서 보기`;
  else if (mine) sub = done ? "도착 ✓ · 눌러서 다시 보기" : "눌러서 내가 쓴 글 보기";
  else sub = done ? (isNew ? "도착했어요 · 눌러서 열기" : "눌러서 다시 읽기") : "🔒 도착하면 열 수 있어요";

  const inner = (
    <span className="top">
      <BirdIcon id={bird.id} size={46} letter={!done} />
      <span>
        <b>{who}{isNew && <span className="stamp">새 편지</span>}</b>
        <span className="d">{sub}</span>
      </span>
    </span>
  );
  const cls = `ch-letter ${mine ? "me" : "you"} ${isNew ? "arrived" : ""}`;
  // 예약한 편지는 취소 같은 기능이 있는 기존 화면으로 가요
  if (sched) return <Link href={letterHref(entry.item.id)} className={cls}>{inner}</Link>;
  const canOpen = mine || done;
  return (
    <div className={cls}>
      {canOpen ? <button type="button" className="ch-tap" aria-expanded={open} onClick={() => setOpen((v) => !v)}>{inner}</button> : <div className="ch-tap locked">{inner}</div>}
      {open && canOpen && (
        done ? (
          <div className="ch-open">
            <LetterReveal
              message={text ?? ""} photos={photos} caption={`${bird.name}가 물고 온 사진`} sub={`${route.title} · ${dateTimeText(arriveAt)}`} loading={!mine}
              onSave={async (src) => {
                try {
                  const r = await savePolaroid(src, `${bird.name}가 물고 온 사진`, `${route.title} · ${dateTimeText(arriveAt)}`);
                  setNotice(r === "downloaded" ? "폴라로이드를 저장했어요." : "저장 창에서 '이미지 저장'을 눌러 주세요.");
                } catch { setNotice("저장하지 못했어요. 잠시 후 다시 시도해 주세요."); }
              }}
            />
            {notice && <div className="small" role="status">{notice}</div>}
            {!mine && <Link href={letterHref(entry.item.id)} className="ch-more">신고·차단은 여기서</Link>}
          </div>
        ) : (
          <div className="paper ch-open">{text || "(글이 없어요)"}</div>
        )
      )}
    </div>
  );
}
