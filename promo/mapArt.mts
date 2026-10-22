/**
 * 홍보 그림·영상용 한반도 지도(SVG 글자). 앱과 같은 실제 해안선(core/koreaGeo)·지역 좌표(core/places)를 써요.
 * build-ads.mts·build-video.mts·docs/시안/build-v8.mts가 같이 씀.
 * 2026-10-22 대표님: "지도가 형태만 있다, 더 자세히, 귀엽게" → 스티커처럼 테두리 두른 땅, 물결 바다, 강, 눈 덮인 산,
 * 동글동글 나무, 도시 명소 그림과 이름표, 뭉게구름. 꾸밈 좌표는 대략값(core/mapDetail), 진짜 지도는 아니에요.
 */
import { LAND, decodeRing } from "../core/koreaGeo.ts";
import { getPlace, REGION_LABELS } from "../core/places.ts";
import { PEAKS, RIVERS } from "../core/mapDetail.ts";

type Opt = { w: number; h: number; from: string; to: string; p?: number; light?: boolean; faded?: boolean; bird?: string; zoom?: number; plain?: boolean };

/** 경도·위도 → 그림 좌표(위도에 맞춰 가로를 줄여 모양이 찌그러지지 않게, 화면을 꽉 채우게) */
export function projector(w: number, h: number, zoom = 1) {
  const lng0 = 125.4, lng1 = 130.2, lat0 = 33.0, lat1 = 38.9;
  const k = Math.cos((36 * Math.PI) / 180);
  const sx = w / ((lng1 - lng0) * k), sy = h / (lat1 - lat0);
  const s = Math.max(sx, sy) * zoom;
  const cx = (lng0 + lng1) / 2, cy = (lat0 + lat1) / 2 - 0.15;
  return (lng: number, lat: number): [number, number] => [w / 2 + (lng - cx) * k * s, h / 2 - (lat - cy) * s];
}

/** 출발·도착을 잇는 살짝 휜 길(앱 지도처럼 활 모양)과 그 위 p(0~1) 지점 */
export function routeCurve(w: number, h: number, from: string, to: string, zoom = 1) {
  const P = projector(w, h, zoom);
  const a = getPlace(from)!, b = getPlace(to)!;
  const [x0, y0] = P(a.lng, a.lat), [x1, y1] = P(b.lng, b.lat);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
  const cx = mx - dy * 0.22, cy = my + dx * 0.22;
  const at = (t: number) => {
    const u = 1 - t;
    const x = u * u * x0 + 2 * u * t * cx + t * t * x1, y = u * u * y0 + 2 * u * t * cy + t * t * y1;
    const tx = 2 * u * (cx - x0) + 2 * t * (x1 - cx), ty = 2 * u * (cy - y0) + 2 * t * (y1 - cy);
    return { x, y, angle: (Math.atan2(ty, tx) * 180) / Math.PI };
  };
  return { d: `M${x0} ${y0} Q${cx} ${cy} ${x1} ${y1}`, at, a: { x: x0, y: y0, name: a.name }, b: { x: x1, y: y1, name: b.name }, P };
}

/** 지도 꾸밈에 쓰는 CSS(날아가는 새 그림자 등). 지도를 쓰는 페이지의 <style>에 넣어요 */
export const MAP_CSS = `.fb-shadow { fill: #000; opacity: .14; }`;

// 이름으로 정해지는 흔들림(같은 그림이 늘 같은 모습)
const rnd = (seed: number) => { let s = seed >>> 0; return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32); };
const f = (n: number) => n.toFixed(1);

/** 그림 좌표의 점이 땅 안인지(나무·물결을 알맞은 곳에 두려고) */
function landTest(rings: [number, number][][]) {
  return (x: number, y: number) => {
    let inside = false;
    for (const r of rings) for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
}

// 큰 도시만 이름표(명소 그림과 함께)
const CITY_IDS = ["seoul", "incheon", "chuncheon", "gangneung", "daejeon", "jeonju", "gwangju", "daegu", "busan", "ulsan", "gyeongju", "yeosu", "jeju", "sokcho"];
const shortName = (n: string) => n.replace(/^서울 .*/, "서울");

function mountain(x: number, y: number, s: number) {
  return `<g transform="translate(${f(x)} ${f(y)}) scale(${s})">
    <path d="M-22 12 Q-14 -4 -6 -16 Q0 -24 6 -16 Q14 -4 22 12 Z" fill="#8FC27E" stroke="#5E9A55" stroke-width="2" stroke-linejoin="round"/>
    <path d="M0 -21 Q6 -14 12 -2 Q4 4 -2 12 L-6 12 Q2 2 0 -21 Z" fill="#76AE68" opacity=".7"/>
    <path d="M-7 -14 Q0 -24 7 -14 Q4 -10 2 -12 Q0 -9 -2 -12 Q-4 -10 -7 -14 Z" fill="#FFFFFF"/>
    <circle cx="-5" cy="2" r="1.6" fill="#3B5A33"/><circle cx="5" cy="2" r="1.6" fill="#3B5A33"/>
    <path d="M-2.5 6 Q0 8 2.5 6" stroke="#3B5A33" stroke-width="1.4" fill="none" stroke-linecap="round"/>
    <ellipse cx="-9" cy="6" rx="2.6" ry="1.6" fill="#F29B8E" opacity=".7"/><ellipse cx="9" cy="6" rx="2.6" ry="1.6" fill="#F29B8E" opacity=".7"/>
  </g>`;
}
const tree = (x: number, y: number, s: number, hue: number) =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})"><rect x="-1.6" y="2" width="3.2" height="6" rx="1.2" fill="#A0774F"/><circle cx="0" cy="-2" r="7" fill="${hue ? "#9BCB86" : "#86BD74"}"/><circle cx="-2.4" cy="-4" r="2.2" fill="#fff" opacity=".35"/></g>`;
const cloud = (x: number, y: number, s: number, o: number) =>
  `<g transform="translate(${f(x)} ${f(y)}) scale(${f(s)})" opacity="${o}"><ellipse cx="0" cy="6" rx="46" ry="14" fill="#fff"/><circle cx="-20" cy="0" r="16" fill="#fff"/><circle cx="4" cy="-8" r="22" fill="#fff"/><circle cx="26" cy="0" r="14" fill="#fff"/></g>`;

export function koreaMapSvg(o: Opt) {
  const { w, h } = o;
  const P = projector(w, h, o.zoom);
  const unit = Math.min(w, h) / 1080; // 크기가 달라도 꾸밈 비율이 같게
  const rings = Object.values(LAND).flat().map((r) => decodeRing(r).map(([x, y]) => P(x, y)));
  const land = rings.map((r) => "M" + r.map((q) => q.map(f).join(" ")).join("L") + "Z").join("");
  const isLand = landTest(rings);
  const c = routeCurve(w, h, o.from, o.to, o.zoom);
  const sea = o.light ? ["#E4F1F5", "#D6EAF1"] : ["#D3E9F1", "#BFDDEA"];
  if (o.plain) {
    return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;${o.faded ? "opacity:.55" : ""}">
      <rect width="${w}" height="${h}" fill="${sea[0]}"/><path d="${land}" fill="#EFE3CC" stroke="#B3A27C" stroke-width="2.2" stroke-linejoin="round"/></svg>`;
  }
  const R = rnd(w * 7 + h);
  // 바다 물결(땅 밖에만), 땅 위 나무(땅 안에만, 길 근처는 비워 둬요)
  const waves: string[] = [], trees: string[] = [];
  const nearRoute = (x: number, y: number) => { for (let t = 0; t <= 1; t += 0.05) { const q = c.at(t); if (Math.hypot(q.x - x, q.y - y) < 70 * unit) return true; } return false; };
  const step = 92 * unit;
  for (let y = step / 2; y < h; y += step) for (let x = step / 2; x < w; x += step) {
    const jx = x + (R() - 0.5) * step * 0.8, jy = y + (R() - 0.5) * step * 0.8;
    if (isLand(jx, jy)) { if (R() < 0.55 && !nearRoute(jx, jy)) trees.push(tree(jx, jy, (1.3 + R() * 0.7) * unit, R() < 0.5 ? 1 : 0)); }
    else if (R() < 0.45) waves.push(`<path d="M${f(jx - 14 * unit)} ${f(jy)} q${f(7 * unit)} ${f(-7 * unit)} ${f(14 * unit)} 0 t${f(14 * unit)} 0" fill="none" stroke="#fff" stroke-width="${f(3 * unit)}" stroke-linecap="round" opacity=".7"/>`);
  }
  const rivers = RIVERS.filter((r) => r.widthKm >= 0.3).map((r) =>
    `<path d="M${r.pts.map(([lng, lat]) => P(lng, lat).map(f).join(" ")).join("L")}" fill="none" stroke="#8FC6E3" stroke-width="${f(6 * unit)}" stroke-linecap="round" stroke-linejoin="round"/>`).join("");
  const regions = REGION_LABELS.map((r) => { const [x, y] = P(r.lng, r.lat); return `<text x="${f(x)}" y="${f(y)}" text-anchor="middle" font-size="${f(30 * unit)}" font-weight="800" fill="#B99B6B" opacity=".45" letter-spacing="${f(6 * unit)}">${r.name}</text>`; }).join("");
  const peaks = PEAKS.filter((pk) => !["남산", "관악산", "북한산"].includes(pk.name)).map((pk) => { const [x, y] = P(pk.lng, pk.lat); return nearRoute(x, y - 20 * unit) ? "" : mountain(x, y, 1.5 * unit); }).join("");
  const label = (x: number, y: number, name: string, dy: number) => {
    const tw = name.length * 26 * unit + 28 * unit;
    return `<rect x="${f(x - tw / 2)}" y="${f(y + dy)}" width="${f(tw)}" height="${f(40 * unit)}" rx="${f(20 * unit)}" fill="#fff" opacity=".94"/>
      <text x="${f(x)}" y="${f(y + dy + 28 * unit)}" text-anchor="middle" font-size="${f(26 * unit)}" font-weight="800" fill="#2A2118">${name}</text>`;
  };
  const cities = CITY_IDS.filter((id) => id !== o.from && id !== o.to).map((id) => getPlace(id)).filter(Boolean).map((pl) => {
    const [x, y] = P(pl!.lng, pl!.lat);
    return `<g><circle cx="${f(x)}" cy="${f(y)}" r="${f(8 * unit)}" fill="#fff" stroke="#1E3A5C" stroke-width="${f(3 * unit)}"/>${label(x, y, shortName(pl!.name), 12 * unit)}</g>`;
  }).join("");
  const clouds = [[0.18, 0.12, 1.4, 0.85], [0.82, 0.2, 1.1, 0.8], [0.12, 0.55, 1.0, 0.7], [0.88, 0.62, 1.3, 0.75], [0.6, 0.9, 1.2, 0.7]]
    .map(([px, py, s, op]) => cloud(px * w, py * h, s * unit, op)).join("");
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;${o.faded ? "opacity:.6" : ""}">
    <defs><linearGradient id="seaG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${sea[0]}"/><stop offset="1" stop-color="${sea[1]}"/></linearGradient></defs>
    <rect width="${w}" height="${h}" fill="url(#seaG)"/>
    ${waves.join("")}
    <path d="${land}" fill="#FFF8EA" stroke="#FFF8EA" stroke-width="${f(22 * unit)}" stroke-linejoin="round"/>
    <path d="${land}" fill="#F4E6C8" stroke="#C9AE7E" stroke-width="${f(3.5 * unit)}" stroke-linejoin="round"/>
    ${regions}${rivers}${trees.join("")}${peaks}${clouds}${cities}
    <path d="${c.d}" fill="none" stroke="#fff" stroke-width="${f(16 * unit)}" stroke-linecap="round" opacity=".9"/>
    <path d="${c.d}" fill="none" stroke="#C1481F" stroke-width="${f(7 * unit)}" stroke-linecap="round" stroke-dasharray="${f(2 * unit)} ${f(16 * unit)}"/>
    <circle cx="${f(c.a.x)}" cy="${f(c.a.y)}" r="${f(18 * unit)}" fill="#fff"/><circle cx="${f(c.a.x)}" cy="${f(c.a.y)}" r="${f(12 * unit)}" fill="#C1481F"/>
    <circle cx="${f(c.b.x)}" cy="${f(c.b.y)}" r="${f(18 * unit)}" fill="#fff"/><circle cx="${f(c.b.x)}" cy="${f(c.b.y)}" r="${f(12 * unit)}" fill="#1B6E5C"/>
    ${label(c.a.x, c.a.y, shortName(c.a.name), 22 * unit)}${label(c.b.x, c.b.y, shortName(c.b.name), 22 * unit)}
  </svg>`;
}
