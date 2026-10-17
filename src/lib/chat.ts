import { getBird } from "./birds";
import { getRoute } from "./routes";
import { elapsedAtFraction, mishapMessage } from "./flight";
import { letterProgress, type Letter } from "./letters";
import type { Meta } from "./firebase/remote";
import { clockText, isScheduled } from "../../core/schedule";
import { withEulReul, withIGa } from "./korean";
import type { ThreadEntry } from "../../core/threads";
import { storiesFor } from "../../core/stories";
import { postcardsFor, type Postcard } from "../../core/postcards";

export type Entry = ThreadEntry<Letter, Meta>;

/** 편지 한 통의 비행 정보를 진행률 계산에 쓰는 모양으로 맞춰요 */
export const asLike = (e: Entry) => (e.dir === "sent" ? e.item : { id: e.item.id, birdId: e.item.birdId, routeId: e.item.routeId, sentAt: e.item.sentAt, arriveAt: e.item.arriveAt });

export type ChatItem =
  | { kind: "day"; key: string; t: number; label: string }
  | { kind: "letter"; key: string; t: number; entry: Entry };

/** 편지를 눌렀을 때 펼쳐 보이는 비행 기록 한 줄 */
export type FlightEvent = { key: string; t: number; icon: string; text: string; sub?: string; future?: boolean; card?: Postcard };

const dayKey = (t: number) => new Date(t).toDateString();
export const dayLabel = (t: number, now: number) => {
  if (dayKey(t) === dayKey(now)) return "오늘";
  if (dayKey(t) === dayKey(now - 86400000)) return "어제";
  const d = new Date(t);
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
};

/**
 * 대화방 목록: 카카오톡처럼 편지 말풍선만 시간 순서로 쌓고, 날짜가 바뀌면 구분선을 넣어요.
 * 출발·지난 곳·이야기·도착 같은 자세한 기록은 말풍선을 눌렀을 때 letterEvents로 보여 줘요.
 */
export function buildChat(entries: Entry[], now: number): ChatItem[] {
  const letters = entries.map((e) => ({ kind: "letter" as const, key: `${e.dir}-${e.item.id}`, t: e.at, entry: e })).sort((a, b) => a.t - b.t);
  const out: ChatItem[] = [];
  let last = "";
  for (const it of letters) {
    const k = dayKey(it.t);
    if (k !== last) { out.push({ kind: "day", key: `day-${k}`, t: it.t, label: dayLabel(it.t, now) }); last = k; }
    out.push(it);
  }
  return out;
}

/** 편지 한 통의 비행 기록: 출발 → 지난 곳(🏮 스탬프) → 이야기 → 사고 → 도착(또는 도착 예정) */
export function letterEvents(e: Entry, now: number): FlightEvent[] {
  if (isScheduled(e.at, now)) return [{ key: "plan", t: e.at, icon: "⏰", text: "출발 예정", sub: clockText(e.at), future: true }];
  const l = asLike(e);
  const bird = getBird(l.birdId), route = getRoute(l.routeId);
  const pr = letterProgress(l, now);
  const arriveAt = l.arriveAt ?? l.sentAt + pr.total * 60000;
  const out: FlightEvent[] = [{ key: "go", t: l.sentAt, icon: "🕊", text: `${withIGa(bird.name)} 출발했어요`, sub: `${clockText(l.sentAt)} · ${route.points[0].name}` }];
  route.points.forEach((pt, i) => {
    if (i === 0 || i === route.points.length - 1) return;
    const at = l.sentAt + elapsedAtFraction(pr.plan, route.fractions[i]);
    if (at <= now) out.push({ key: `p${i}`, t: at, icon: "📍", text: `${withEulReul(pt.name)} 지났어요`, sub: pt.kind === "sky" ? clockText(at) : `${clockText(at)} · 🏮 스탬프` });
  });
  // 비행 중 이야기(소나기, 도토리 줍기 …): 편지 ID로 정해지고 도착 시각에는 영향이 없어요
  for (const { f, story } of storiesFor(l.id, route.km)) {
    if (pr.p < f) continue;
    const at = l.sentAt + elapsedAtFraction(pr.plan, f);
    out.push({ key: `s${story.id}`, t: at, icon: story.icon, text: story.text, sub: story.item ? `${clockText(at)} · ${story.item.emoji} ${withEulReul(story.item.name)} 도감에 담았어요` : clockText(at) });
  }
  // 새가 보내는 엽서: 명소를 지날 때 한 장(편지 ID로 정해지고 도착 시각에는 영향이 없어요)
  for (const c of postcardsFor(l.id, l.routeId)) {
    if (pr.p < c.f) continue;
    const at = l.sentAt + elapsedAtFraction(pr.plan, c.f);
    out.push({ key: `c${c.place}`, t: at + 1, icon: "💌", text: `${bird.name}의 엽서`, sub: `${clockText(at)} · 도감에 모았어요`, card: c });
  }
  if (pr.mishap && pr.p >= pr.mishap.at - 0.0001) {
    const msg = mishapMessage(pr.mishap.kind, bird.name);
    out.push({ key: "mishap", t: l.sentAt + elapsedAtFraction(pr.plan, pr.mishap.at), icon: pr.mishap.kind === "tree" ? "🌳" : "🧭", text: msg.title, sub: msg.body });
  }
  out.sort((a, b) => a.t - b.t);
  out.push(pr.done
    ? { key: "end", t: arriveAt, icon: "🎉", text: `${route.to.name}에 도착했어요`, sub: clockText(arriveAt) }
    : { key: "eta", t: arriveAt, icon: "⏳", text: `${route.to.name} 도착 예정`, sub: clockText(arriveAt), future: true });
  return out;
}

/** 지금까지 온 엽서 중 가장 최근 한 장(날아가는 편지 말풍선 아래에 보여 줘요) */
export function latestPostcard(e: Entry, now: number): { card: Postcard; at: number } | null {
  if (isScheduled(e.at, now)) return null;
  const l = asLike(e);
  const pr = letterProgress(l, now);
  let best: { card: Postcard; at: number } | null = null;
  for (const c of postcardsFor(l.id, l.routeId)) if (pr.p >= c.f) best = { card: c, at: l.sentAt + elapsedAtFraction(pr.plan, c.f) };
  return best;
}
