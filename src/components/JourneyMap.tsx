"use client";
import { useMemo } from "react";
import { LAND, decodeRing } from "../../core/koreaGeo";
import { PLACES, REGION_LABELS } from "../../core/places";
import { routePosition, type Route } from "@/lib/routes";
import BirdIcon from "@/components/BirdIcon";
import LandmarkIcon from "@/components/LandmarkIcon";

type Props = {
  route: Route;
  /** 진행률 0~1 */
  p: number;
  birdId: string;
  /** 편지 쓰기 첫 화면처럼 작게 미리 보여줄 때(도시 이름을 줄여요) */
  compact?: boolean;
};

const W = 320, H = 300;

/** 경로가 한 화면에 잘 들어오도록 확대·이동을 정하고, 경도·위도를 화면 좌표로 바꾸는 함수를 만들어요 */
function makeProjection(route: Route) {
  const lats = route.points.map((q) => q.lat), lngs = route.points.map((q) => q.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const cy = (minLat + maxLat) / 2, cx = (minLng + maxLng) / 2;
  const kx = 111.32 * Math.cos((cy * Math.PI) / 180), ky = 110.57;
  // 가까운 노선(서울 안 등)은 더 확대해서 구·동네 이름이 보이게 해요
  const minSpan = route.km < 120 ? Math.max(24, route.km * 2.2) : 170;
  const vx = Math.max((maxLng - minLng) * kx * 1.6, minSpan), vy = Math.max((maxLat - minLat) * ky * 1.5, minSpan);
  const scale = Math.min(W / vx, H / vy); // 1km가 화면에서 몇 칸인지
  const proj = (lng: number, lat: number): [number, number] => [W / 2 + (lng - cx) * kx * scale, H / 2 - (lat - cy) * ky * scale];
  return { proj, scale, kx, ky, cx, cy };
}

const f1 = (n: number) => Math.round(n * 10) / 10;

/** 해안선 자료로 지도 바탕을 그려요(경로가 바뀔 때만 다시 계산) */
function useLandPaths(route: Route) {
  return useMemo(() => {
    const { proj, scale, kx, ky, cx, cy } = makeProjection(route);
    const toPath = (rings: number[][]) => {
      let d = "";
      for (const r of rings) {
        const pts = decodeRing(r).map(([lng, lat]) => proj(lng, lat));
        // 윤곽의 네모 범위가 화면과 겹치면 그려요(확대하면 큰 육지의 점이 화면 밖에만 있을 수 있어요)
        const xs = pts.map((q) => q[0]), ys = pts.map((q) => q[1]);
        if (Math.max(...xs) < -60 || Math.min(...xs) > W + 60 || Math.max(...ys) < -60 || Math.min(...ys) > H + 60) continue;
        d += "M" + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join("L") + "Z";
      }
      return d;
    };
    // 위도·경도 격자선(1도 간격)
    const grid: string[] = [];
    const lngSpan = W / (kx * scale) / 2 + 1, latSpan = H / (ky * scale) / 2 + 1;
    for (let lng = Math.floor(cx - lngSpan); lng <= Math.ceil(cx + lngSpan); lng++) { const [x] = proj(lng, cy); if (x > 0 && x < W) grid.push(`M${f1(x)} 0V${H}`); }
    for (let lat = Math.floor(cy - latSpan); lat <= Math.ceil(cy + latSpan); lat++) { const [, y] = proj(cx, lat); if (y > 0 && y < H) grid.push(`M0 ${f1(y)}H${W}`); }
    return { kor: toPath(LAND.KOR), prk: toPath(LAND.PRK), jpn: toPath(LAND.JPN), chn: toPath(LAND.CHN), grid: grid.join(""), proj, scale };
  }, [route]);
}

type Box = { x0: number; y0: number; x1: number; y1: number };
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** 실제 해안선 위에 랜드마크·도시 이름·날아가는 새를 그리는 한국 지도 */
export default function JourneyMap({ route, p, birdId, compact }: Props) {
  const { kor, prk, jpn, chn, grid, proj, scale } = useLandPaths(route);
  const pos = routePosition(route, p);

  const pts = route.points.map((q) => proj(q.lng, q.lat));
  const [bx, by] = proj(pos.lng, pos.lat);
  const done = [...pts.slice(0, pos.segIndex + 1), [bx, by]] as [number, number][];
  const line = (a: [number, number][]) => a.map(([x, y], i) => `${i ? "L" : "M"}${f1(x)} ${f1(y)}`).join(" ");
  const [nx, ny] = pts[Math.min(pos.segIndex + 1, pts.length - 1)];
  const facingLeft = nx < bx - 0.5;

  // 이름표가 서로 겹치지 않게: 경로 지점 → 도시 → 도 이름 순서로, 안 겹칠 때만 그려요
  const iconBoxes: Box[] = pts.map(([x, y]) => ({ x0: x - 11, y0: y - 11, x1: x + 11, y1: y + 11 }));
  const barKm = [100, 50, 20, 10, 5, 2, 1].find((k) => k * scale <= 150) ?? 1;
  const barLen = barKm * scale;
  const placed: Box[] = [
    { x0: bx - 24, y0: by - 38, x1: bx + 24, y1: by + 4 }, // 새가 있는 자리
    { x0: 4, y0: H - 30, x1: 20 + barLen + 28, y1: H - 2 }, // 축척 막대
    { x0: W - 30, y0: 6, x1: W - 2, y1: 40 }, // 나침반
  ];
  const labels: { key: string; text: string; x: number; y: number; cls: string; anchor: "start" | "end" }[] = [];
  const tryLabel = (key: string, text: string, x: number, y: number, size: number, cls: string, pref: "right" | "left", own = -1) => {
    const w = text.length * size * 0.98 + 4, h = size + 3;
    const opts = pref === "right" ? ([[11, 0, "start"], [-11, 0, "end"], [0, -15, "start"], [0, 19, "start"]] as const) : ([[-11, 0, "end"], [11, 0, "start"], [0, -15, "start"], [0, 19, "start"]] as const);
    for (const [dx, dy, anchor] of opts) {
      const lx = x + dx, ly = y + dy;
      const box: Box = anchor === "start" ? { x0: lx - 2, y0: ly - h + 3, x1: lx + w, y1: ly + 3 } : { x0: lx - w, y0: ly - h + 3, x1: lx + 2, y1: ly + 3 };
      if (box.x0 < 2 || box.x1 > W - 2 || box.y0 < 2 || box.y1 > H - 2) continue;
      if (placed.some((b) => hit(b, box)) || iconBoxes.some((b, i) => i !== own && hit(b, box))) continue;
      placed.push(box);
      labels.push({ key, text, x: lx, y: ly, cls, anchor });
      return true;
    }
    return false;
  };
  // 1) 경로 지점(출발·경유·도착)
  route.points.forEach((q, i) => {
    const [x, y] = pts[i];
    tryLabel(`r${i}`, q.name, x, y + 4, 11.5, "lbl main", x > W * 0.6 ? "left" : "right", i);
  });
  // 2) 도시
  if (!compact) {
    const onRoute = new Set(route.points.map((q) => q.sub).filter(Boolean));
    for (const pl of PLACES) {
      if (onRoute.has(pl.name)) continue;
      if (pl.minor && scale < 2.5) continue; // 서울 구·작은 도시는 확대한 지도에서만
      if ((pl.id === "dokdo" || pl.id === "ulleung") && scale < 0.35) continue;
      const [x, y] = proj(pl.lng, pl.lat);
      if (x < 12 || x > W - 12 || y < 12 || y > H - 12) continue;
      tryLabel(`c${pl.id}`, pl.name, x, y + 4, 10, "lbl city", "right");
    }
  }
  // 3) 도 이름(아주 흐리게)
  const regions = compact ? [] : REGION_LABELS.map((r) => ({ ...r, xy: proj(r.lng, r.lat) })).filter((r) => r.xy[0] > 24 && r.xy[0] < W - 24 && r.xy[1] > 14 && r.xy[1] < H - 14);
  const regionShown = regions.filter((r) => {
    const box: Box = { x0: r.xy[0] - 14, y0: r.xy[1] - 10, x1: r.xy[0] + 14, y1: r.xy[1] + 4 };
    if (placed.some((b) => hit(b, box)) || iconBoxes.some((b) => hit(b, box))) return false;
    placed.push(box);
    return true;
  });
  const cityDots = compact ? [] : PLACES.filter((pl) => labels.some((l) => l.key === `c${pl.id}`)).map((pl) => ({ id: pl.id, xy: proj(pl.lng, pl.lat) }));

  return (
    <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${route.title} 여정 지도. ${route.points.map((q) => q.name).join(", ")}을 지나요.`}>
      <rect width={W} height={H} className="sea" />
      <path d={grid} className="grid" />
      <path d={chn} className="land dim" />
      <path d={jpn} className="land dim" />
      <path d={prk} className="land dim" />
      <path d={kor} className="coast" />
      <path d={kor} className="land" />

      {regionShown.map((r) => (
        <text key={r.name} x={r.xy[0]} y={r.xy[1]} className="region" textAnchor="middle">{r.name}</text>
      ))}
      {cityDots.map((c) => <circle key={c.id} cx={c.xy[0]} cy={c.xy[1]} r="2" className="citydot" />)}

      <path d={line(pts)} className="route-line" />
      <path d={line(done)} className="route-done" />

      {route.points.map((q, i) => {
        const [x, y] = pts[i];
        const passed = i <= pos.passedIdx;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r="9" className={`lmring ${passed ? "passed" : ""}`} />
            <LandmarkIcon kind={q.kind} x={x} y={y} scale={0.62} />
          </g>
        );
      })}
      {labels.map((l) => <text key={l.key} x={l.x} y={l.y} textAnchor={l.anchor} className={l.cls}>{l.text}</text>)}

      <g className="mapbird" aria-hidden>
        <g transform={facingLeft ? `translate(${f1(bx * 2)} 0) scale(-1 1)` : undefined}>
          <BirdIcon id={birdId} size={50} x={bx - 25} y={by - 38} letter />
        </g>
      </g>

      <g aria-hidden>
        <path d={`M10 ${H - 12}h${f1(barLen)}`} className="scalebar" />
        <path d={`M10 ${H - 15}v6M${f1(10 + barLen)} ${H - 15}v6`} className="scalebar" />
        <text x="10" y={H - 18} className="scaletext">{barKm}km</text>
        <text x={W - 16} y="20" className="scaletext" textAnchor="middle">N</text>
        <path d={`M${W - 16} 24v10M${W - 19} 29l3-5 3 5`} className="scalebar" />
      </g>
    </svg>
  );
}
