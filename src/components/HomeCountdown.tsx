"use client";
import Link from "next/link";
import { getBird } from "@/lib/birds";
import { getRoute, routePosition } from "@/lib/routes";
import { letterProgress, useNow, type Letter } from "@/lib/letters";
import type { Meta } from "@/lib/firebase/remote";
import { asLike } from "@/lib/chat";
import { roomHref } from "@/lib/room";
import { withEulReul, withIGa } from "@/lib/korean";
import { isScheduled, whenText } from "../../core/schedule";
import type { Thread } from "../../core/threads";
import BirdIcon from "./BirdIcon";

/** "3:12:45"(하루가 넘으면 "1일 3:12:45") */
export function countdownText(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const hms = `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return d ? `${d}일 ${hms}` : hms;
}

/**
 * 홈 맨 위 카운트다운(시안 v6-4): 오고 있는 편지가 있으면 그 편지, 없으면 날아가는 내 편지 중 가장 먼저 도착하는 것.
 * 1초마다 줄어드는 남은 시간 + 새가 지금 어디쯤인지 + 도착 예정 시각. 누르면 그 사람 대화방으로 가요.
 */
export default function HomeCountdown({ threads }: { threads: Thread<Letter, Meta>[] }) {
  const now = useNow(1000);
  type Pick = { t: Thread<Letter, Meta>; e: Thread<Letter, Meta>["entries"][number]; arriveAt: number };
  let pick = null as Pick | null;
  for (const dir of ["received", "sent"] as const) {
    for (const t of threads) for (const e of t.entries) {
      if (e.dir !== dir || isScheduled(e.at, now)) continue;
      const l = asLike(e);
      const pr = letterProgress(l, now);
      if (pr.done) continue;
      const arriveAt = l.arriveAt ?? l.sentAt + pr.total * 60000;
      if (!pick || arriveAt < pick.arriveAt) pick = { t, e, arriveAt };
    }
    if (pick) break;
  }
  if (!pick) return null;
  const { t, e, arriveAt } = pick as Pick;
  const l = asLike(e);
  const bird = getBird(l.birdId), route = getRoute(l.routeId);
  const pr = letterProgress(l, now);
  const pos = routePosition(route, pr.p);
  const where = pr.stalled
    ? (pr.mishap?.kind === "tree" ? "나무에서 빠져나오는 중" : "길을 다시 찾는 중")
    : pos.next && pos.next.kind !== "sky" && pos.t > 0.5 ? `${pos.next.name} 가까이 날아가는 중` : pos.passed.kind === "sky" ? `${withEulReul(pos.passed.name)} 지나는 중` : `${pos.passed.name} 위를 지나는 중`;
  const title = e.dir === "received" ? `💌 ${t.name}의 편지가 오고 있어요` : `🕊 ${withIGa(bird.name)} ${t.name}에게 날아가는 중`;
  return (
    <Link href={roomHref(t)} className="hcount">
      <span className="hc-title">{title}</span>
      <span className="hc-n" role="timer">{countdownText(arriveAt - now)}</span>
      <span className="hc-sub">{bird.name} · 지금 {where} · {whenText(arriveAt, now)}쯤</span>
      <span className="hc-track" aria-hidden><i style={{ width: `${Math.round(pr.p * 100)}%` }} /><span className="hc-bird" style={{ left: `${Math.round(pr.p * 100)}%` }}><BirdIcon id={bird.id} size={40} letter /></span></span>
    </Link>
  );
}
