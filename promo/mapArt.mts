/**
 * 홍보 그림·영상용 한반도 지도(SVG 글자). 앱과 같은 실제 해안선(core/koreaGeo)·지역 좌표(core/places)를 써요.
 * build-ads.mts·build-video.mts가 같이 씀.
 */
import { LAND, decodeRing } from "../core/koreaGeo.ts";
import { getPlace } from "../core/places.ts";

type Opt = { w: number; h: number; from: string; to: string; p?: number; light?: boolean; faded?: boolean; bird?: string; zoom?: number };

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

export function koreaMapSvg(o: Opt) {
  const { w, h } = o;
  const P = projector(w, h, o.zoom);
  const land = Object.values(LAND).flat().map((r) => "M" + decodeRing(r).map(([x, y]) => P(x, y).map((n) => n.toFixed(1)).join(" ")).join("L") + "Z").join("");
  const c = routeCurve(w, h, o.from, o.to, o.zoom);
  const sea = o.light ? "#E3EEF1" : "#D5E5EB", ground = o.light ? "#F4EAD6" : "#EFE3CC";
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="display:block;${o.faded ? "opacity:.55" : ""}">
    <rect width="${w}" height="${h}" fill="${sea}"/>
    <path d="${land}" fill="${ground}" stroke="#B3A27C" stroke-width="2.2" stroke-linejoin="round"/>
    <path d="${c.d}" fill="none" stroke="#C1481F" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16"/>
    <circle cx="${c.a.x}" cy="${c.a.y}" r="14" fill="#C1481F"/><circle cx="${c.b.x}" cy="${c.b.y}" r="14" fill="#1B6E5C"/>
  </svg>`;
}
