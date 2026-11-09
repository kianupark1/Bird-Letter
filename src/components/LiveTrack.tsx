"use client";
/**
 * 대화방 위 지도에 얹는 "지금 어디쯤" 줄(2026-11-09 대표님: "받는 사람이 실시간으로 어디까지 왔는지 체크하는 게 중요, 더 완벽하게").
 * 1초마다: 지금 지나는 곳 → 다음 곳, 날아온 거리(소수 첫째 자리까지 늘어남), 남은 시간(초까지 카운트다운), 얇은 진행 막대.
 * 받는 편지는 "나에게 오는 중", 길을 잃었거나 나무에 걸려 쉬는 중이면 그렇게 보여요.
 */
import { useEffect, useState } from "react";
import { letterProgress, type Letter } from "@/lib/letters";
import { getRoute, routePosition } from "@/lib/routes";
import { getBird } from "@/lib/birds";

type Like = Pick<Letter, "id" | "birdId" | "routeId" | "sentAt" | "arriveAt">;

const hms = (ms: number) => {
  const s = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(x).padStart(2, "0")}` : `${m}:${String(x).padStart(2, "0")}`;
};

export default function LiveTrack({ l, incoming }: { l: Like; incoming: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const route = getRoute(l.routeId), bird = getBird(l.birdId);
  const pr = letterProgress(l, now);
  const pos = routePosition(route, pr.p);
  const leftMs = Math.max(0, pr.total - pr.elapsed) * 60000;
  const flown = route.km * pr.p;
  const where = pr.done ? `${route.to.name} 도착!` : pr.stalled ? `${pos.passed.name} 근처에서 잠깐 쉬는 중` : pos.next ? `${pos.passed.name} → ${pos.next.name}` : route.to.name;
  return (
    <span className="ltrack" role="status" aria-live="off">
      <span className="lt-row">
        <span className="lt-where">{incoming ? "💌 " : "🕊 "}{where}</span>
        <span className="lt-left">{pr.done ? "도착" : hms(leftMs)}</span>
      </span>
      <span className="lt-row lt-sub">
        <span>{incoming ? `${bird.name}가 나에게 오는 중` : `${bird.name} 날아가는 중`}</span>
        <span className="lt-km">{flown.toFixed(1)} / {route.km}km</span>
      </span>
      <span className="lt-bar" aria-hidden><i style={{ width: `${Math.max(2, pr.p * 100)}%` }} /></span>
    </span>
  );
}
