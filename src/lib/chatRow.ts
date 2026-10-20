import { getBird } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { letterProgress, type Letter } from "@/lib/letters";
import type { Meta } from "@/lib/firebase/remote";
import { clockText, dateTimeText, isScheduled } from "../../core/schedule";
import type { Thread } from "../../core/threads";

/** 채팅 목록(편지 탭·펜팔 탭) 한 줄에 보여 줄 것 */
export type Row = { preview: string; hot?: boolean; time: string; badge?: number; progress?: number };

/** 카카오톡처럼 시각: 오늘은 "오후 3:12", 어제는 "어제", 그 전은 "10월 17일" */
export function listTime(ms: number, now: number): string {
  if (!ms) return "";
  const d = new Date(ms), n = new Date(now);
  const day = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((day(n) - day(d)) / 86400000);
  if (diff <= 0) return clockText(ms);
  if (diff === 1) return "어제";
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

/** 채팅 목록 한 줄: 카카오톡처럼 이름·마지막 소식 한 줄·시각·안 읽은 수 */
export function rowInfo(t: Thread<Letter, Meta>, now: number, opened: Set<string>): Row {
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
    // 카카오톡처럼 상대가 읽었는지 보여 줘요(앱으로 바로 보낸 편지만 알 수 있어요)
    if (last.item.readAt) return { preview: "✓ 보낸 편지를 상대방이 읽었어요", time };
    if (last.item.toUid) return { preview: "보낸 편지가 도착했어요 · 아직 안 읽었어요", time };
    return { preview: "✓ 보낸 편지가 도착했어요", time };
  }
  return { preview: "받은 편지를 읽었어요", time };
}

