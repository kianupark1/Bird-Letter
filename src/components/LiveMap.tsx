"use client";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import JourneyMap, { mapBase } from "@/components/JourneyMap";
import { routePosition, type Route } from "@/lib/routes";
import { getBird } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { whenText } from "../../core/schedule";
import { euro, withEulReul } from "@/lib/korean";

/**
 * 지도 크게 보기(2026-10-17, 대표님: "더 자세히, 멋지게, 계속 보고 싶게"):
 * 새를 따라가며 확대(기본), 두 손가락으로 벌리고 오므려 확대·축소(2026-10-18, 대표님: "자연스럽게"),
 * 두 번 톡 치면 그 자리 확대, ＋/－도 부드럽게, 손가락으로 끌어서 둘러보기, 전체 노선 보기.
 * 손가락이 움직이는 동안은 지도 그림을 통째로 늘였다 줄였다 해서 끊기지 않고, 손을 떼면 그 배율로 다시 그려서
 * 확대할수록 작은 도시·하천·길 이름이 더 보여요. 가장 작게(노선 전체)는 예전 그대로예요.
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
  const box = useRef<HTMLDivElement>(null);
  const layer = useRef<HTMLDivElement>(null);

  const c = follow || !center ? { lng: pos.lng, lat: pos.lat } : center;
  const view = zoom <= 1 && !center && follow ? undefined : { zoom, ...c };
  const H = 460;

  // ── 손가락·마우스로 확대·축소·이동 ──
  // 움직이는 동안의 임시 변형(지도 그림을 통째로 옮기고 늘림). 손을 떼면 배율·가운데로 바꿔서 다시 그려요
  const live = useRef({ k: 1, tx: 0, ty: 0 });
  const ptrs = useRef(new Map<number, { x: number; y: number }>());
  const base = useRef<{ k: number; tx: number; ty: number; pts: { x: number; y: number }[] } | null>(null);
  const moved = useRef(false);
  const tap = useRef<{ t: number; x: number; y: number; down: number } | null>(null);
  const anim = useRef(0);
  const wheelT = useRef(0);
  const freezeRef = useRef(() => {});
  const st = useRef({ zoom, view, c });
  st.current = { zoom, view, c };
  const MAXZ = 12; // 더 키우면 그릴 것이 거의 없어 빈 화면처럼 보여요

  const applyLive = () => {
    const { k, tx, ty } = live.current;
    if (layer.current) layer.current.style.transform = k === 1 && !tx && !ty ? "" : `translate(${tx}px, ${ty}px) scale(${k})`;
  };
  // 화면 좌표(이 상자 안, 확대 글씨 설정과 상관없는 값)
  const local = (cx: number, cy: number) => {
    const el = box.current!; const rc = el.getBoundingClientRect();
    const f = el.clientWidth / (rc.width || 1);
    return { x: (cx - rc.left) * f, y: (cy - rc.top) * f };
  };
  const clampK = (k: number) => { const z = st.current.zoom; return Math.min(MAXZ / z, Math.max(1 / z, k)); };
  // 지금 임시 변형을 실제 배율·가운데 좌표로 바꿔요
  const commit = () => {
    const { k, tx, ty } = live.current;
    if (k === 1 && Math.abs(tx) < 1 && Math.abs(ty) < 1) { live.current = { k: 1, tx: 0, ty: 0 }; applyLive(); return; }
    const el = box.current; if (!el) return;
    const bw = el.clientWidth, bh = el.clientHeight;
    const b = mapBase(route, H);
    const s = Math.max(bw / b.w, bh / b.h), offX = (bw - b.w * s) / 2, offY = (bh - b.h * s) / 2;
    const { zoom: z, view: v } = st.current;
    const sc = b.scale * (v ? v.zoom : 1), ccx = v ? v.lng : b.cx, ccy = v ? v.lat : b.cy;
    const qx = (bw / 2 - tx) / k, qy = (bh / 2 - ty) / k; // 새 화면 가운데에 올 지점(지금 화면 기준)
    const sx = (qx - offX) / s, sy = (qy - offY) / s;
    const nz = Math.min(MAXZ, Math.max(1, z * k));
    if (keepFollow.current && nz > 1.04) { keepFollow.current = false; setZoom(nz); pendingReset.current = true; return; }
    keepFollow.current = false;
    if (nz <= 1.04) { setZoom(1); setCenter(null); setFollow(true); }
    else {
      setZoom(nz);
      setFollow(false);
      setCenter({ lng: ccx + (sx - b.w / 2) / (b.kx * sc), lat: ccy - (sy - b.h / 2) / (b.ky * sc) });
    }
    pendingReset.current = true;
  };
  const pendingReset = useRef(false);
  // 새 배율로 다시 그린 직후(화면에 보이기 전)에 임시 변형을 풀어요 → 깜빡임 없음
  useLayoutEffect(() => {
    if (!pendingReset.current) return;
    pendingReset.current = false;
    live.current = { k: 1, tx: 0, ty: 0 };
    applyLive();
  });
  // 버튼·두 번 톡: (fx,fy)를 중심으로 k배까지 0.25초 동안 부드럽게
  const keepFollow = useRef(false);
  const animateZoom = (k: number, fx?: number, fy?: number) => {
    keepFollow.current = fx === undefined && follow; // ＋/－ 버튼은 따라가던 중이면 계속 따라가요
    const el = box.current; if (!el) return;
    cancelAnimationFrame(anim.current);
    const x = fx ?? el.clientWidth / 2, y = fy ?? el.clientHeight / 2;
    const from = { ...live.current };
    const target = clampK(from.k * k) / from.k;
    const t0 = performance.now();
    const step = (t: number) => {
      const u = Math.min(1, (t - t0) / 250), e = 1 - Math.pow(1 - u, 3);
      const kk = from.k * Math.pow(target, e);
      const px = (x - from.tx) / from.k, py = (y - from.ty) / from.k;
      live.current = { k: kk, tx: x - kk * px, ty: y - kk * py };
      applyLive();
      if (u < 1) anim.current = requestAnimationFrame(step); else commit();
    };
    anim.current = requestAnimationFrame(step);
  };
  // 손으로 지도를 움직이기 시작하면 새 따라가기를 멈추고 지금 가운데에 고정해요(움직이는 중에 지도가 밀리지 않게)
  const freeze = () => {
    if (!follow) return;
    const v = st.current.view, b = mapBase(route, H);
    setFollow(false);
    setCenter(v ? { lng: v.lng, lat: v.lat } : { lng: b.cx, lat: b.cy }); // 노선 전체 화면이면 그 가운데
  };
  freezeRef.current = freeze;
  const rebase = () => { base.current = { ...live.current, pts: [...ptrs.current.values()] }; };
  // 마우스 휠(컴퓨터)·트랙패드 확대
  useEffect(() => {
    const el = box.current; if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      cancelAnimationFrame(anim.current);
      freezeRef.current();
      const { x, y } = local(e.clientX, e.clientY);
      const cur = live.current;
      const k = clampK(cur.k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025))) ;
      const px = (x - cur.tx) / cur.k, py = (y - cur.ty) / cur.k;
      live.current = { k, tx: x - k * px, ty: y - k * py };
      applyLive();
      clearTimeout(wheelT.current);
      wheelT.current = window.setTimeout(commit, 180);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const bird = getBird(birdId);
  const flown = route.km * pr.p;
  const next = pos.next;
  const nextFrac = pos.nextIdx >= 0 ? route.fractions[pos.nextIdx] : 1;
  const nextMin = pr.p < 1 && pr.leftMin > 0 ? Math.max(1, Math.round(((nextFrac - pr.p) / Math.max(1e-6, 1 - pr.p)) * pr.leftMin)) : 0;

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
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("button")) return;
          cancelAnimationFrame(anim.current);
          try { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); } catch {}
          ptrs.current.set(e.pointerId, local(e.clientX, e.clientY));
          if (ptrs.current.size === 1) { moved.current = false; const p0 = ptrs.current.get(e.pointerId)!; tap.current = { t: tap.current?.t ?? 0, x: tap.current?.x ?? p0.x, y: tap.current?.y ?? p0.y, down: performance.now() }; }
          rebase();
        }}
        onPointerMove={(e) => {
          if (!ptrs.current.has(e.pointerId) || !base.current) return;
          ptrs.current.set(e.pointerId, local(e.clientX, e.clientY));
          const b = base.current, now2 = [...ptrs.current.values()];
          if (now2.length >= 2 && b.pts.length >= 2) {
            // 두 손가락: 벌리면 확대, 오므리면 축소(손가락 사이 가운데를 기준으로)
            const m0 = { x: (b.pts[0].x + b.pts[1].x) / 2, y: (b.pts[0].y + b.pts[1].y) / 2 };
            const m1 = { x: (now2[0].x + now2[1].x) / 2, y: (now2[0].y + now2[1].y) / 2 };
            const d0 = Math.hypot(b.pts[0].x - b.pts[1].x, b.pts[0].y - b.pts[1].y) || 1;
            const d1 = Math.hypot(now2[0].x - now2[1].x, now2[0].y - now2[1].y);
            const k = clampK(b.k * (d1 / d0));
            const px = (m0.x - b.tx) / b.k, py = (m0.y - b.ty) / b.k;
            live.current = { k, tx: m1.x - k * px, ty: m1.y - k * py };
            if (!moved.current) freeze();
            moved.current = true;
          } else if (now2.length === 1 && b.pts.length === 1) {
            const dx = now2[0].x - b.pts[0].x, dy = now2[0].y - b.pts[0].y;
            if (!moved.current && Math.hypot(dx, dy) < 6) return;
            if (!moved.current) freeze();
            moved.current = true;
            live.current = { k: b.k, tx: b.tx + dx, ty: b.ty + dy };
          }
          applyLive();
        }}
        onPointerUp={(e) => {
          const p0 = ptrs.current.get(e.pointerId);
          ptrs.current.delete(e.pointerId);
          if (ptrs.current.size > 0) { rebase(); return; }
          base.current = null;
          if (moved.current) { commit(); return; }
          // 두 번 톡: 그 자리를 두 배로
          const t = performance.now(), tp = tap.current;
          if (p0 && tp && t - tp.t < 320 && Math.hypot(p0.x - tp.x, p0.y - tp.y) < 30) { tap.current = null; freeze(); animateZoom(2, p0.x, p0.y); return; }
          if (p0) tap.current = { t, x: p0.x, y: p0.y, down: 0 };
        }}
        onPointerCancel={(e) => { ptrs.current.delete(e.pointerId); if (!ptrs.current.size) { base.current = null; if (moved.current) commit(); } }}
      >
        <div ref={layer} className="lm-layer"><JourneyMap route={route} p={pr.p} birdId={birdId} view={view} h={H} fx fill /></div>
        <div className="lm-ctrl">
          <button type="button" aria-label="확대" onClick={() => animateZoom(1.8)}>＋</button>
          <button type="button" aria-label="축소" onClick={() => animateZoom(1 / 1.8)}>－</button>
          <button type="button" aria-label="노선 전체 보기" onClick={() => { setZoom(1); setCenter(null); setFollow(true); }}>⤢</button>
        </div>
        {!follow && <button type="button" className="lm-follow" onClick={() => { setFollow(true); setCenter(null); }}>🐦 {bird.name} 따라가기</button>}
      </div>
      <div className="lm-info">
        <div className="lm-odo"><span>날아온 거리</span><b>{flown.toFixed(2)}<small>km</small></b><span>/ {route.km}km</span></div>
        {pr.p < 1 ? (
          <>
            <div className="lm-row">📍 {pos.passed?.name ? `${withEulReul(pos.passed.name)} 지나` : "출발해서"} {next ? <><b>{next.name}</b>{euro(next.name)} 가는 중</> : "날아가는 중"}</div>
            {next && <div className="lm-row">⏱ {next.name}까지 약 {formatMinutes(nextMin)} · 도착 예정 <b>{whenText(pr.arriveAt)}</b></div>}
            {pr.stalled && <div className="lm-row">🌳 잠깐 쉬어 가는 중이에요(곧 다시 날아요)</div>}
          </>
        ) : <div className="lm-row">💌 편지가 도착했어요!</div>}
      </div>
    </div>
  );
}
