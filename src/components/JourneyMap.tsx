"use client";
import { useMemo } from "react";
import { LAND, decodeRing } from "../../core/koreaGeo";
import { PLACES, REGION_LABELS } from "../../core/places";
import { routePosition, type Route } from "@/lib/routes";
import FlyBird from "@/components/FlyBird";
import { PARKS, PEAKS, RIVERS, ROADS } from "../../core/mapDetail";
import LandmarkIcon from "@/components/LandmarkIcon";

type Props = {
  route: Route;
  /** 진행률 0~1 */
  p: number;
  birdId: string;
  /** 편지 쓰기 첫 화면처럼 작게 미리 보여줄 때(도시 이름을 줄여요) */
  compact?: boolean;
  /** 확대해서 보기(크게 보기 화면): zoom 배율과 가운데 좌표. 없으면 노선 전체가 보이게 */
  view?: { zoom: number; lng: number; lat: number };
  /** 지도 높이(너비는 320 기준). 크게 보기 화면은 더 길쭉하게 */
  h?: number;
  /** 움직이는 꾸밈(구름·반짝이는 자취·도착지 물결·밤하늘) */
  fx?: boolean;
  /** 밤인지(밤하늘·별). 없으면 지금 시각으로 정해요 */
  night?: boolean;
  /** 화면을 꽉 채우기(가장자리는 조금 잘릴 수 있어요) */
  fill?: boolean;
};

let W = 320, H = 300;

/** 노선 전체가 한 화면에 들어오는 기본 틀: 1km가 몇 칸인지(scale)·가운데 좌표. 지도 크게 보기의 손가락 확대 계산에도 써요 */
export function mapBase(route: Route, h = H) {
  const lats = route.points.map((q) => q.lat), lngs = route.points.map((q) => q.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const cy = (minLat + maxLat) / 2, cx = (minLng + maxLng) / 2;
  const kx = 111.32 * Math.cos((cy * Math.PI) / 180), ky = 110.57;
  // 가까운 노선(서울 안 등)은 더 확대해서 구·동네 이름이 보이게 해요
  const minSpan = route.km < 120 ? Math.max(24, route.km * 2.2) : 170;
  const vx = Math.max((maxLng - minLng) * kx * 1.6, minSpan), vy = Math.max((maxLat - minLat) * ky * 1.5, minSpan);
  return { scale: Math.min(W / vx, h / vy), cx, cy, kx, ky, w: W, h };
}

/** 경로가 한 화면에 잘 들어오도록 확대·이동을 정하고, 경도·위도를 화면 좌표로 바꾸는 함수를 만들어요 */
function makeProjection(route: Route, view?: Props["view"]) {
  const b = mapBase(route);
  let scale = b.scale, cx2 = b.cx, cy2 = b.cy;
  if (view) { scale *= view.zoom; cx2 = view.lng; cy2 = view.lat; }
  return projectionAt(cx2, cy2, scale, b.kx, b.ky);
}
function projectionAt(cx: number, cy: number, scale: number, kx: number, ky: number) {
  const proj = (lng: number, lat: number): [number, number] => [W / 2 + (lng - cx) * kx * scale, H / 2 - (lat - cy) * ky * scale];
  return { proj, scale, kx, ky, cx, cy };
}

const f1 = (n: number) => Math.round(n * 10) / 10;
type XY = [number, number];

/** 부드러운 곡선(캐트멀롬): 지점들을 꺾이지 않게 이어요. i번째 구간의 t(0~1) 위치 */
function crPoint(P: XY[], i: number, t: number): XY {
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[Math.min(P.length - 1, i + 1)], p3 = P[Math.min(P.length - 1, i + 2)];
  const t2 = t * t, t3 = t2 * t;
  const f = (a: number, b: number, c: number, d: number) => 0.5 * (2 * b + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
  return [f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])];
}
/** 곡선을 잘게 나눠 그린 선. upTo가 있으면 그 구간·위치까지만 */
function curvePath(P: XY[], upTo?: { i: number; t: number }) {
  const out: XY[] = [P[0]];
  const last = upTo ? upTo.i : P.length - 2;
  for (let i = 0; i <= last && i < P.length - 1; i++) {
    const end = upTo && i === upTo.i ? upTo.t : 1;
    const n = Math.max(2, Math.ceil(18 * end));
    for (let k = 1; k <= n; k++) out.push(crPoint(P, i, (k / n) * end));
  }
  return out.map(([x, y], i) => `${i ? "L" : "M"}${f1(x)} ${f1(y)}`).join(" ");
}
/** 공원·숲을 동그라미 대신 울퉁불퉁한 모양으로(이름으로 모양이 정해져서 늘 같아요) */
function blobPath(cx: number, cy: number, r: number, seed: string) {
  let h = 0; for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const n = 9, pts: XY[] = [];
  for (let k = 0; k < n; k++) { h = (h * 1103515245 + 12345) >>> 0; const rr = r * (0.72 + ((h >>> 8) % 1000) / 1000 * 0.5); const a = (k / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * 0.86]); }
  let d = "";
  for (let k = 0; k < n; k++) { const a = pts[k], b = pts[(k + 1) % n]; const m: XY = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; d += k ? ` Q${f1(a[0])} ${f1(a[1])} ${f1(m[0])} ${f1(m[1])}` : `M${f1(m[0])} ${f1(m[1])}`; }
  const a0 = pts[0], m0: XY = [(pts[n - 1][0] + a0[0]) / 2, (pts[n - 1][1] + a0[1]) / 2];
  return d + ` Q${f1(pts[n - 1][0])} ${f1(pts[n - 1][1])} ${f1(m0[0])} ${f1(m0[1])} Q${f1(a0[0])} ${f1(a0[1])} ${f1((a0[0] + pts[1][0]) / 2)} ${f1((a0[1] + pts[1][1]) / 2)}Z`;
}
const reducedMotion = () => { try { return window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch { return false; } };

/** 해안선 자료로 지도 바탕을 그려요(경로가 바뀔 때만 다시 계산) */
function useLandPaths(route: Route, view?: Props["view"], h = 300) {
  return useMemo(() => {
    H = h;
    const { proj, scale, kx, ky, cx, cy } = makeProjection(route, view);
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
    // 큰 강(폭은 실제 강폭을 따르되 너무 얇거나 두껍지 않게), 공원·숲, 산
    const onScreen = (xs: number[], ys: number[]) => !(Math.max(...xs) < -40 || Math.min(...xs) > W + 40 || Math.max(...ys) < -40 || Math.min(...ys) > H + 40);
    const rivers = RIVERS.map((r) => {
      const pts = r.pts.map(([lng, lat]) => proj(lng, lat)) as XY[];
      if (!onScreen(pts.map((q) => q[0]), pts.map((q) => q[1]))) return null;
      const w = Math.max(r.widthKm < 0.2 ? 0.7 : 0.9, Math.min(11, r.widthKm * scale));
      if (r.widthKm < 0.2 && scale < 6) return null; // 작은 하천은 많이 확대했을 때만
      // 이름표: 화면 안쪽에서 가운데에 가장 가까운 강 위 지점
      const inner = pts.filter(([x, y]) => x > 30 && x < W - 30 && y > 20 && y < H - 20);
      const lab = w >= 1.4 && inner.length ? inner.reduce((a, q) => (Math.hypot(q[0] - W / 2, q[1] - H / 2) < Math.hypot(a[0] - W / 2, a[1] - H / 2) ? q : a)) : null;
      return { name: r.name, d: curvePath(pts), w, lab };
    }).filter(Boolean) as { name: string; d: string; w: number; lab: XY | null }[];
    const roads = ROADS.map((r) => {
      if (!r.major && scale < 6) return null;
      const pts = r.pts.map(([lng, lat]) => proj(lng, lat)) as XY[];
      if (!onScreen(pts.map((q) => q[0]), pts.map((q) => q[1]))) return null;
      return { name: r.name, d: curvePath(pts), w: r.major ? Math.max(1, Math.min(4, 0.06 * scale)) : Math.max(1.4, Math.min(5, 0.035 * scale)), major: r.major };
    }).filter(Boolean) as { name: string; d: string; w: number; major: boolean }[];
    const parks = PARKS.map((p) => { const xy = proj(p.lng, p.lat), r = Math.min(70, p.r * scale); return { name: p.name, xy, r, d: blobPath(xy[0], xy[1], r, p.name) }; }).filter((p) => p.r >= 2.5 && p.xy[0] > -p.r && p.xy[0] < W + p.r && p.xy[1] > -p.r && p.xy[1] < H + p.r);
    const peaks = PEAKS.map((p) => ({ name: p.name, xy: proj(p.lng, p.lat) })).filter((p) => p.xy[0] > 6 && p.xy[0] < W - 6 && p.xy[1] > 10 && p.xy[1] < H - 6);
    return { kor: toPath(LAND.KOR), prk: toPath(LAND.PRK), jpn: toPath(LAND.JPN), chn: toPath(LAND.CHN), grid: grid.join(""), proj, scale, rivers, roads, parks, peaks };
  }, [route, view?.zoom, view?.lng, view?.lat, h]);
}

type Box = { x0: number; y0: number; x1: number; y1: number };
const hit = (a: Box, b: Box) => a.x0 < b.x1 && a.x1 > b.x0 && a.y0 < b.y1 && a.y1 > b.y0;

/** 실제 해안선 위에 랜드마크·도시 이름·날아가는 새를 그리는 한국 지도 */
export default function JourneyMap({ route, p, birdId, compact, view, h = 300, fx, night, fill }: Props) {
  const { kor, prk, jpn, chn, grid, proj, scale, rivers, roads, parks, peaks: allPeaks } = useLandPaths(route, view, h);
  // 경로 지점과 이름이 같은 산은 따로 그리지 않아요(이름표가 두 번 나오지 않게)
  const peaks = allPeaks.filter((pk) => !route.points.some((q) => q.name === pk.name));
  H = h;
  const isNight = night ?? (() => { const hr = new Date().getHours(); return hr >= 19 || hr < 6; })();
  const pos = routePosition(route, p);

  const pts = route.points.map((q) => proj(q.lng, q.lat)) as XY[];
  // 새가 나는 길은 꺾이지 않는 곡선. 지점이 둘뿐이면 살짝 둥근 활 모양으로 날아요
  let spts: XY[] = pts, seg = { i: pos.segIndex, t: pos.t };
  if (pts.length === 2) {
    const [[x0, y0], [x1, y1]] = pts, dx = x1 - x0, dy = y1 - y0, k = 0.14;
    spts = [pts[0], [(x0 + x1) / 2 - dy * k, (y0 + y1) / 2 + dx * k], pts[1]];
    seg = pos.t < 0.5 ? { i: 0, t: pos.t * 2 } : { i: 1, t: (pos.t - 0.5) * 2 };
  }
  if (p >= 1) seg = { i: spts.length - 2, t: 1 };
  const [bx, by] = crPoint(spts, seg.i, seg.t);
  const ahead = crPoint(spts, seg.i, Math.min(1, seg.t + 0.04)), behind = crPoint(spts, seg.i, Math.max(0, seg.t - 0.04));
  const heading = (Math.atan2(ahead[1] - behind[1], ahead[0] - behind[0]) * 180) / Math.PI;
  const still = reducedMotion();

  // 이름표가 서로 겹치지 않게: 경로 지점 → 도시 → 도 이름 순서로, 안 겹칠 때만 그려요
  const iconBoxes: Box[] = pts.map(([x, y]) => ({ x0: x - 11, y0: y - 11, x1: x + 11, y1: y + 11 }));
  const barKm = [100, 50, 20, 10, 5, 2, 1].find((k) => k * scale <= 150) ?? 1;
  const barLen = barKm * scale;
  const placed: Box[] = [
    { x0: bx - 18, y0: by - 16, x1: bx + 18, y1: by + 18 }, // 새가 있는 자리
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
  // 2-1) 산 이름(확대했을 때만)
  if (!compact && scale >= 1.2) for (const pk of peaks) tryLabel(`k${pk.name}`, pk.name, pk.xy[0], pk.xy[1] + 4, 9.5, "lbl peak", "right");
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
    <svg className="map" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio={fill ? "xMidYMid slice" : undefined} role="img" aria-label={`${route.title} 여정 지도. ${route.points.map((q) => q.name).join(", ")}을 지나요.`}>
      <rect width={W} height={H} className="sea" />
      <path d={grid} className="grid" />
      <path d={chn} className="land dim" />
      <path d={jpn} className="land dim" />
      <path d={prk} className="land dim" />
      <path d={kor} className="coast" />
      <path d={kor} className="land" />
      {/* 공원·숲(초록), 큰 강, 산 */}
      {parks.map((pk) => <path key={pk.name} d={pk.d} className="park" />)}
      {roads.map((r) => <path key={`rc${r.name}`} d={r.d} className={`road-case ${r.major ? "major" : ""}`} style={{ strokeWidth: r.w + 1.6 }} />)}
      {roads.map((r) => <path key={`r${r.name}`} d={r.d} className={`road ${r.major ? "major" : ""}`} style={{ strokeWidth: r.w }} />)}
      {rivers.map((r) => <path key={r.name} d={r.d} className="river" style={{ strokeWidth: r.w }} />)}
      {rivers.map((r) => r.lab && <text key={`rl${r.name}`} x={r.lab[0]} y={r.lab[1] + (r.w > 4 ? 3 : -4)} className="river-lbl" textAnchor="middle">{r.name}</text>)}
      {!compact && peaks.map((pk) => <path key={pk.name} d={`M${f1(pk.xy[0] - 6)} ${f1(pk.xy[1] + 3)}l4 -7 2.5 3.5 2 -2.5 3.5 6z`} className="peak" />)}
      {fx && isNight && (
        <g aria-hidden>
          <rect width={W} height={H} className="fx-night" />
          {[[0.1, 0.08], [0.3, 0.15], [0.55, 0.06], [0.82, 0.12], [0.92, 0.3], [0.15, 0.4], [0.7, 0.62], [0.05, 0.75]].map(([sx, sy], i) => (
            <circle key={i} cx={W * sx} cy={H * sy} r={i % 3 ? 0.9 : 1.4} className="fx-star" style={{ animationDelay: `${i * 0.4}s` }} />
          ))}
        </g>
      )}

      {regionShown.map((r) => (
        <text key={r.name} x={r.xy[0]} y={r.xy[1]} className="region" textAnchor="middle">{r.name}</text>
      ))}
      {cityDots.map((c) => <circle key={c.id} cx={c.xy[0]} cy={c.xy[1]} r="2" className="citydot" />)}

      <path d={curvePath(spts)} className="route-glow" />
      <path d={curvePath(spts)} className="route-line" />
      <path d={curvePath(spts, seg)} className="route-done" />

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

      {fx && (
        <g aria-hidden>
          {/* 도착지 물결 */}
          <circle cx={pts[pts.length - 1][0]} cy={pts[pts.length - 1][1]} r="10" className="fx-pulse" />
          {/* 새 뒤에 남는 반짝이 자취 */}
          {[0.06, 0.12, 0.18, 0.24].map((d, i) => {
            const [tx, ty] = crPoint(spts, seg.i, Math.max(0, seg.t - d));
            return <circle key={i} cx={tx} cy={ty} r={2.6 - i * 0.5} className="fx-trail" style={{ animationDelay: `${i * 0.25}s` }} />;
          })}
        </g>
      )}
      <g className="mapbird" aria-hidden>
        <FlyBird birdId={birdId} x={f1(bx)} y={f1(by)} angle={heading} size={compact ? 0.6 : h >= 400 ? 0.7 : 0.85} still={still || p >= 1} />
      </g>

      {fx && (
        <g aria-hidden className="fx-clouds">
          {([[0.2, 0.18, 1, "c1"], [0.72, 0.42, 1.25, "c2"], [0.4, 0.8, 0.9, "c3"]] as const).map(([cx, cy, k, c]) => (
            <g key={c} className={`fx-cloud ${c}`} transform={`translate(${f1(W * cx)} ${f1(H * cy)}) scale(${k})`}>
              <circle cx="-14" cy="2" r="9" /><circle cx="0" cy="-4" r="13" /><circle cx="15" cy="1" r="10" /><rect x="-22" y="2" width="46" height="9" rx="4.5" />
            </g>
          ))}
        </g>
      )}
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
