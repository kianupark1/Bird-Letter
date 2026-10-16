import { getBird } from "./birds";
import { getRoute } from "./routes";
import { elapsedAtFraction, mishapMessage } from "./flight";
import { letterProgress, type Letter } from "./letters";
import type { Meta } from "./firebase/remote";
import { clockText, isScheduled } from "../../core/schedule";
import { withEulReul, withIGa } from "./korean";
import type { ThreadEntry } from "../../core/threads";

export type Entry = ThreadEntry<Letter, Meta>;

/** 편지 한 통의 비행 정보를 진행률 계산에 쓰는 모양으로 맞춰요 */
export const asLike = (e: Entry) => (e.dir === "sent" ? e.item : { id: e.item.id, birdId: e.item.birdId, routeId: e.item.routeId, sentAt: e.item.sentAt, arriveAt: e.item.arriveAt });

export type ChatItem =
  | { kind: "day"; key: string; t: number; label: string }
  | { kind: "letter"; key: string; t: number; entry: Entry }
  | { kind: "event"; key: string; t: number; icon: string; text: string; sub?: string; tone?: "hot" | "soft" };

const dayKey = (t: number) => new Date(t).toDateString();
export const dayLabel = (t: number, now: number) => {
  if (dayKey(t) === dayKey(now)) return "오늘";
  if (dayKey(t) === dayKey(now - 86400000)) return "어제";
  const d = new Date(t);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/**
 * 대화방에 쌓을 것들을 오래된 것부터 시간 순서로 만들어요.
 * 편지 말풍선 → "새가 출발했어요" → "OO을 지나고 있어요"(날아가는 중일 때만) → "도착했어요". 날아가는 중이면 끝에 도착 예정도 붙여요.
 * 이미 도착한 편지는 출발·도착만 남겨서 대화가 길어지지 않게 해요.
 */
export function buildChat(entries: Entry[], now: number, name: string): ChatItem[] {
  const out: ChatItem[] = [];
  for (const e of entries) {
    const id = `${e.dir}-${e.item.id}`;
    out.push({ kind: "letter", key: id, t: e.at, entry: e });
    if (isScheduled(e.at, now)) continue; // 아직 출발 전: 말풍선만(출발 예정 표시는 말풍선 안에)
    const l = asLike(e);
    const bird = getBird(l.birdId), route = getRoute(l.routeId);
    const pr = letterProgress(l, now);
    const sub = `${route.points[0].name} → ${route.to.name}`;
    out.push({ kind: "event", key: `${id}-go`, t: l.sentAt, icon: "🕊", text: `${withIGa(bird.name)} 출발했어요`, sub: `${clockText(l.sentAt)} · ${sub}` });
    if (pr.done) {
      const at = l.arriveAt ?? l.sentAt + pr.total * 60000;
      out.push({ kind: "event", key: `${id}-end`, t: at, icon: "🎉", text: `${withIGa(bird.name)} 도착했어요!`, sub: clockText(at), tone: "hot" });
      continue;
    }
    if (pr.mishap && pr.p >= pr.mishap.at - 0.0001) {
      const msg = mishapMessage(pr.mishap.kind, bird.name);
      out.push({ kind: "event", key: `${id}-mishap`, t: l.sentAt + elapsedAtFraction(pr.plan, pr.mishap.at), icon: pr.mishap.kind === "tree" ? "🌳" : "🧭", text: msg.title, sub: msg.body, tone: "soft" });
    }
    route.points.forEach((pt, i) => {
      if (i === 0 || i === route.points.length - 1) return;
      const at = l.sentAt + elapsedAtFraction(pr.plan, route.fractions[i]);
      if (at <= now) out.push({ kind: "event", key: `${id}-p${i}`, t: at, icon: "📍", text: `${withEulReul(pt.name)} 지났어요`, sub: clockText(at) });
    });
    const arriveAt = l.arriveAt ?? l.sentAt + pr.total * 60000;
    out.push({ kind: "event", key: `${id}-eta`, t: Math.max(now, l.sentAt + 1), icon: "⏳", text: `${clockText(arriveAt)}쯤 도착해요`, sub: e.dir === "sent" ? `${name}님만 읽어요` : "도착하면 열 수 있어요", tone: "soft" });
  }
  // 오래된 것부터. 시각이 같으면 넣은 순서(편지 → 출발 → 지남)를 지켜요
  const sorted = out.map((x, i) => [x, i] as const).sort((a, b) => a[0].t - b[0].t || a[1] - b[1]).map((x) => x[0]);
  const withDays: ChatItem[] = [];
  let last = "";
  for (const it of sorted) {
    const k = dayKey(it.t);
    if (k !== last) { withDays.push({ kind: "day", key: `day-${k}`, t: it.t, label: dayLabel(it.t, now) }); last = k; }
    withDays.push(it);
  }
  return withDays;
}
