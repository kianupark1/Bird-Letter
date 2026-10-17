"use client";
import { useEffect, useRef, useState } from "react";
import JourneyMap from "@/components/JourneyMap";
import { routePosition, type Route } from "@/lib/routes";
import { getBird } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { clockText } from "../../core/schedule";

/**
 * 지도 크게 보기(2026-10-17, 대표님: "더 자세히, 멋지게, 계속 보고 싶게"):
 * 새를 따라가며 확대(기본), ＋/－로 확대·축소, 손가락으로 끌어서 둘러보기, 전체 노선 보기.
 * 아래에는 1초마다 늘어나는 "날아온 거리", 다음에 지날 곳과 시각, 도착 예정 시각.
 */
export default function LiveMap({ route, birdId, progress, title, onClose }: {
  route: Route; birdId: string;
  /** 지금 시각(ms)을 주면 진행 정보(진행률 0~1, 남은 분, 도착 시각)를 돌려주는 함수 */
  progress: (now: number) => { p: number; leftMin: number; arriveAt: number; stalled?: boolean };
  title: string; onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(t); }, []);
  const pr = progress(now);
  const pos = routePosition(route, pr.p);
  const [zoom, setZoom] = useState(3);
  const [follow, setFollow] = useState(true);
  const [center, setCenter] = useState<{ lng: number; lat: number } | null>(null);
  const drag = useRef<{ x: number; y: number; lng: number; lat: number } | null>(null);
  const box = useRef<HTMLDivElement>(null);

  const c = follow || !center ? { lng: pos.lng, lat: pos.lat } : center;
  const view = zoom <= 1 && !center && follow ? undefined : { zoom, ...c };
  const bird = getBird(birdId);
  const flown = route.km * pr.p;
  const next = pos.next;
  const nextFrac = pos.nextIdx >= 0 ? route.fractions[pos.nextIdx] : 1;
  const nextMin = pr.p < 1 && pr.leftMin > 0 ? Math.max(1, Math.round(((nextFrac - pr.p) / Math.max(1e-6, 1 - pr.p)) * pr.leftMin)) : 0;

  // 손가락으로 끌어서 둘러보기: 화면에서 움직인 만큼 가운데 좌표를 옮겨요(대략값)
  const kmPerPx = () => {
    const w = box.current?.clientWidth ?? 320;
    return (route.km < 120 ? Math.max(24, route.km * 2.2) : Math.max(170, route.km * 1.2)) / zoom / w;
  };
  return (
    <div className="mapfull live" role="dialog" aria-label={`${title} 지도`}>
      <div className="mf-head">
        <div><b>{title}</b><small>{bird.name} · {pr.p >= 1 ? "도착했어요!" : `도착까지 ${formatMinutes(Math.max(1, pr.leftMin))}`}</small></div>
        <button type="button" className="mf-close" aria-label="닫기" onClick={onClose}>✕</button>
      </div>
      <div
        ref={box}
        className="mf-body"
        style={{ touchAction: "none" }}
        onPointerDown={(e) => { if ((e.target as HTMLElement).closest("button")) return; drag.current = { x: e.clientX, y: e.clientY, ...c }; }}
        onPointerMove={(e) => {
          const d = drag.current; if (!d) return;
          const dx = e.clientX - d.x, dy = e.clientY - d.y;
          if (Math.hypot(dx, dy) < 4) return;
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
          const k = kmPerPx();
          setFollow(false);
          setCenter({ lng: d.lng - (dx * k) / (111.32 * Math.cos((d.lat * Math.PI) / 180)), lat: d.lat + (dy * k) / 110.57 });
        }}
        onPointerUp={() => { drag.current = null; }}
        onPointerCancel={() => { drag.current = null; }}
      >
        <JourneyMap route={route} p={pr.p} birdId={birdId} view={view} h={460} fx fill />
        <div className="lm-ctrl">
          <button type="button" aria-label="확대" onClick={() => setZoom((z) => Math.min(12, z * 1.6))}>＋</button>
          <button type="button" aria-label="축소" onClick={() => setZoom((z) => Math.max(1, z / 1.6))}>－</button>
          <button type="button" aria-label="노선 전체 보기" onClick={() => { setZoom(1); setCenter(null); setFollow(true); }}>⤢</button>
        </div>
        {!follow && <button type="button" className="lm-follow" onClick={() => { setFollow(true); setCenter(null); }}>🐦 {bird.name} 따라가기</button>}
      </div>
      <div className="lm-info">
        <div className="lm-odo"><span>날아온 거리</span><b>{flown.toFixed(2)}<small>km</small></b><span>/ {route.km}km</span></div>
        {pr.p < 1 ? (
          <>
            <div className="lm-row">📍 {pos.passed?.name ? `${pos.passed.name}을(를) 지나` : "출발해서"} {next ? <><b>{next.name}</b>(으)로 가는 중</> : "날아가는 중"}</div>
            {next && <div className="lm-row">⏱ {next.name}까지 약 {formatMinutes(nextMin)} · 도착 예정 <b>{clockText(pr.arriveAt)}</b></div>}
            {pr.stalled && <div className="lm-row">🌳 잠깐 쉬어 가는 중이에요(곧 다시 날아요)</div>}
          </>
        ) : <div className="lm-row">💌 편지가 도착했어요!</div>}
      </div>
    </div>
  );
}
