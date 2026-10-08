/**
 * 노선: 보내는 곳과 받는 곳(전국 어디든)을 고르면, 그 사이를 지나는 랜드마크를 경유지로 자동으로 뽑아요.
 * 노선 id는 "출발지id-도착지id"(예: "seoul-busan")라서 서버에 따로 저장할 게 없고, 받는 사람 화면에서도 같은 경로가 그려져요.
 */
import { haversineKm } from "./geo";
import { EXTRA_LANDMARKS, PLACES, getPlace, type Landmark, type LandmarkKind, type Place } from "./places";

export type RoutePoint = { name: string; sub?: string; kind: LandmarkKind | "sky"; lat: number; lng: number };
export type Route = {
  id: string;
  title: string;
  /** 시간 계산에 쓰는 거리(출발 랜드마크 ~ 도착 랜드마크 직선거리) */
  km: number;
  from: Place;
  to: Place;
  points: RoutePoint[];
  /** 각 지점이 전체 길이의 몇 %쯤에 있는지(0~1). points와 같은 순서 */
  fractions: number[];
};

// 처음에 만든 세 노선은 소요 시간이 바뀌지 않게 거리를 그대로 둡니다
const KM_OVERRIDE: Record<string, number> = { "seoul-busan": 325, "seoul-jeju": 452, "seoul-dokdo": 430 };
const CORRIDOR_MAX_KM = 58; // 직선에서 이만큼(짧은 노선은 더 좁게) 안쪽에 있는 랜드마크만 경유지 후보
const CITY_BONUS_KM = 14; // 산보다 도시 랜드마크(탑·다리·성·한옥)를 조금 우대
const MAX_MID = 4;
const MINOR_MAX_KM = 120;

// 대략적인 평면 좌표(km). 경로 판단에만 써요
function plane(lat0: number, lat: number, lng: number) {
  return [(lng - 0) * 111.32 * Math.cos((lat0 * Math.PI) / 180), lat * 110.57] as const;
}

function skyName(lat: number, lng: number) {
  let nearest: Place | null = null, best = Infinity;
  for (const p of PLACES) { if (p.minor) continue; const d = haversineKm(lat, lng, p.lat, p.lng); if (d < best) { best = d; nearest = p; } }
  if (nearest && best < 70) return `${nearest.name} 근처 상공`;
  if (lng < 125.6) return "서해 상공";
  if (lat < 34.2) return "남해 상공";
  if (lng > 129.8) return "동해 상공";
  return "한반도 상공";
}

export function makeRoute(from: Place, to: Place): Route {
  const id = `${from.id}-${to.id}`;
  const a = from.landmark, b = to.landmark;
  const km = KM_OVERRIDE[id] ?? Math.max(1, Math.round(haversineKm(a.lat, a.lng, b.lat, b.lng)));
  const lat0 = (a.lat + b.lat) / 2;
  const [ax, ay] = plane(lat0, a.lat, a.lng), [bx, by] = plane(lat0, b.lat, b.lng);
  const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1;

  // 직선 가까이에 있는 랜드마크 후보
  const corridor = Math.min(CORRIDOR_MAX_KM, Math.max(8, len * 0.2));
  const seen = new Set<string>([a.name, b.name]);
  const cands: { lm: Landmark; t: number; off: number }[] = [];
  // 서울 구·작은 도시의 랜드마크는 가까운(120km 미만) 노선에서만 경유지로 써요
  const pool = km < MINOR_MAX_KM ? PLACES : PLACES.filter((p) => !p.minor);
  for (const lm of [...pool.map((p) => p.landmark), ...EXTRA_LANDMARKS]) {
    if (seen.has(lm.name)) continue;
    const [px, py] = plane(lat0, lm.lat, lm.lng);
    const t = ((px - ax) * dx + (py - ay) * dy) / (len * len);
    if (t < 0.1 || t > 0.9) continue;
    const off = Math.abs((px - ax) * dy - (py - ay) * dx) / len;
    if (off <= corridor) { cands.push({ lm, t, off: lm.kind === "mountain" ? off : Math.max(0, off - CITY_BONUS_KM) }); seen.add(lm.name); }
  }
  // 직선에 가까운 것부터 고르되, 너무 붙어 있는 건 건너뜀
  cands.sort((p, q) => p.off - q.off);
  const picked: typeof cands = [];
  for (const c of cands) {
    if (picked.length >= MAX_MID) break;
    if (picked.every((q) => Math.abs(q.t - c.t) >= 0.14)) picked.push(c);
  }
  picked.sort((p, q) => p.t - q.t);

  const mids: RoutePoint[] = picked.map(({ lm }) => ({ name: lm.name, kind: lm.kind, lat: lm.lat, lng: lm.lng }));
  // 길이 멀고 경유지가 적으면 중간에 "○○ 상공" 지점을 더해요
  if (km > 90) {
    for (const t of mids.length === 0 ? [0.34, 0.67] : mids.length === 1 ? [picked[0].t < 0.5 ? 0.72 : 0.28] : []) {
      const lat = a.lat + (b.lat - a.lat) * t, lng = a.lng + (b.lng - a.lng) * t;
      mids.push({ name: skyName(lat, lng), kind: "sky", lat, lng });
    }
    mids.sort((p, q) => haversineKm(a.lat, a.lng, p.lat, p.lng) - haversineKm(a.lat, a.lng, q.lat, q.lng));
  }

  const points: RoutePoint[] = [
    { name: a.name, sub: from.name, kind: a.kind, lat: a.lat, lng: a.lng },
    ...mids,
    { name: b.name, sub: to.name, kind: b.kind, lat: b.lat, lng: b.lng },
  ];
  const seg = points.slice(1).map((p, i) => haversineKm(points[i].lat, points[i].lng, p.lat, p.lng));
  const total = seg.reduce((s, v) => s + v, 0) || 1;
  let acc = 0;
  const fractions = [0, ...seg.map((v) => (acc += v) / total)];
  return { id, title: `${from.name} → ${to.name}`, km, from, to, points, fractions };
}

const cache = new Map<string, Route>();
/** 노선 id로 노선을 만들어요. 알 수 없는 id면 서울 → 부산 */
export function getRoute(id: string): Route {
  const hit = cache.get(id);
  if (hit) return hit;
  const [f, t] = id.split("-");
  const from = getPlace(f), to = getPlace(t);
  const route = from && to && from.id !== to.id ? makeRoute(from, to) : makeRoute(getPlace("seoul")!, getPlace("busan")!);
  cache.set(id, route);
  return route;
}

export const routeIdOf = (fromId: string, toId: string) => `${fromId}-${toId}`;

/** 자주 쓰는 노선(붕붕이 소개 화면 등에서 예시로 보여줘요) */
export const ROUTES: Route[] = ["seoul-busan", "seoul-jeju", "seoul-dokdo"].map(getRoute);

/** 진행률(0~1)일 때 새의 위치와 "어디를 지났고 다음은 어디인지" */
export function routePosition(route: Route, p: number) {
  const pts = route.points, fr = route.fractions;
  const q = Math.min(1, Math.max(0, p));
  let i = 0;
  while (i < pts.length - 2 && q >= fr[i + 1]) i++;
  const span = fr[i + 1] - fr[i] || 1;
  const t = Math.min(1, Math.max(0, (q - fr[i]) / span));
  const lat = pts[i].lat + (pts[i + 1].lat - pts[i].lat) * t;
  const lng = pts[i].lng + (pts[i + 1].lng - pts[i].lng) * t;
  const passedIdx = q >= 1 ? pts.length - 1 : i; // 마지막으로 지난 지점
  const next = q >= 1 ? null : pts[i + 1];
  return { lat, lng, passedIdx, next, nextIdx: q >= 1 ? -1 : i + 1, passed: pts[passedIdx], segIndex: i, t };
}
