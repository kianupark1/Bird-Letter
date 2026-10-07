// 한국 지도용 해안선 자료를 만들어요: node scripts/build-korea-geo.mjs <world-atlas가 설치된 폴더>
// 결과: core/koreaGeo.ts (이미 커밋돼 있어서 평소에는 다시 만들 필요 없어요)
// 자료 출처: Natural Earth (공개 자료, npm world-atlas 2.0.2, ISC 라이선스). 만들 때만 임시로 설치해요:
//   npm install world-atlas topojson-client topojson-simplify
import { readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const dir = process.argv[2] ?? ".";
const require = createRequire(dir + "/");
const topo = require("topojson-client");
const simp = require("topojson-simplify");
const t0 = JSON.parse(readFileSync(dir + "/node_modules/world-atlas/countries-10m.json", "utf8"));

// 한반도 주변만 남기고, 조금 단순하게 만들어서 용량을 줄여요
const BOX = { x0: 122.5, x1: 133.5, y0: 31.0, y1: 40.2 };
const t = simp.simplify(simp.presimplify(t0), 0.00002);
const want = { 410: "KOR", 408: "PRK", 392: "JPN", 156: "CHN" };

function clipHalf(ring, inside, inter) {
  const out = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i], b = ring[(i + 1) % ring.length];
    const ai = inside(a), bi = inside(b);
    if (ai) out.push(a);
    if (ai !== bi) out.push(inter(a, b));
  }
  return out;
}
function clip(ring) {
  const ix = (c) => (a, b) => { const tt = (c - a[0]) / (b[0] - a[0]); return [c, a[1] + tt * (b[1] - a[1])]; };
  const iy = (c) => (a, b) => { const tt = (c - a[1]) / (b[1] - a[1]); return [a[0] + tt * (b[0] - a[0]), c]; };
  let r = ring;
  r = clipHalf(r, (p) => p[0] >= BOX.x0, ix(BOX.x0)); if (!r.length) return r;
  r = clipHalf(r, (p) => p[0] <= BOX.x1, ix(BOX.x1)); if (!r.length) return r;
  r = clipHalf(r, (p) => p[1] >= BOX.y0, iy(BOX.y0)); if (!r.length) return r;
  r = clipHalf(r, (p) => p[1] <= BOX.y1, iy(BOX.y1));
  return r;
}
const area = (r) => Math.abs(r.reduce((s, p, i) => { const q = r[(i + 1) % r.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0) / 2);

const out = { KOR: [], PRK: [], JPN: [], CHN: [] };
for (const g of t.objects.countries.geometries) {
  const name = want[+g.id]; if (!name) continue;
  const f = topo.feature(t, g);
  const polys = f.geometry.type === "Polygon" ? [f.geometry.coordinates] : f.geometry.coordinates;
  for (const p of polys) {
    const ring = clip(p[0]);
    if (ring.length < 3) continue;
    // 작은 일본 섬은 빼고, 한국 섬은 작아도 남겨요(독도 같은 점도)
    if (name !== "KOR" && area(ring) < 0.02) continue;
    out[name].push(ring);
  }
}
// 한국의 아주 작은 섬(독도)은 점 4개 모양이라 따로 처리: 그대로 둠
const enc = (rings) => rings.map((r) => {
  const pts = r.map(([x, y]) => [Math.round(x * 100), Math.round(y * 100)]);
  const flat = []; let px = 0, py = 0;
  pts.forEach(([x, y], i) => { flat.push(i === 0 ? x : x - px, i === 0 ? y : y - py); px = x; py = y; });
  return flat;
});
const total = Object.values(out).reduce((n, a) => n + a.reduce((m, r) => m + r.length, 0), 0);
const body = `// 자동 생성 파일(scripts/build-korea-geo.mjs). 직접 고치지 마세요.
// 자료: Natural Earth (공개 자료). 좌표는 경도·위도에 100을 곱한 정수이고, 점 사이는 앞 점과의 차이로 저장했어요.
export type GeoRing = number[];
export const LAND = {
  KOR: ${JSON.stringify(enc(out.KOR))} as GeoRing[],
  PRK: ${JSON.stringify(enc(out.PRK))} as GeoRing[],
  JPN: ${JSON.stringify(enc(out.JPN))} as GeoRing[],
  CHN: ${JSON.stringify(enc(out.CHN))} as GeoRing[],
};
/** 압축을 풀어서 [경도, 위도] 점 목록으로 */
export function decodeRing(r: GeoRing): [number, number][] {
  const pts: [number, number][] = []; let x = 0, y = 0;
  for (let i = 0; i < r.length; i += 2) { x = i === 0 ? r[0] : x + r[i]; y = i === 0 ? r[1] : y + r[i + 1]; pts.push([x / 100, y / 100]); }
  return pts;
}
`;
writeFileSync(new URL("../core/koreaGeo.ts", import.meta.url), body);
console.log("점", total, "개, 파일 크기", (body.length / 1024).toFixed(1) + "KB", Object.fromEntries(Object.entries(out).map(([k, v]) => [k, v.length])));
