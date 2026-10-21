/**
 * 지도 공유 사진(8차 시안, 2026-10-21 대표님 확정): 인스타 스토리·카카오톡용 세로 사진(1080×1920)에 들어갈 글과 지도 좌표.
 * 편지 내용·진짜 이름·사진은 넣지 않아요(이름은 내가 부르는 이름만, 끌 수 있음). 그림은 src/lib/shareMap.ts가 그려요.
 */
import { formatMinutes } from "./geo";
import { eulReul, iGa } from "./korean";
import { routePosition, type Route } from "./routes";

export const SHARE_W = 1080, SHARE_H = 1920;

export type ShareInput = {
  route: Route;
  birdName: string;
  /** 내가 보낸 편지인지(받은 편지면 "○○에게서 오는 편지") */
  mine: boolean;
  /** 상대 이름(내가 부르는 이름). 비우면 이름 없이 */
  name?: string;
  p: number;
  done: boolean;
  stalled?: "lost" | "tree" | null;
  leftMin: number;
  totalMin: number;
};

/** 강조할 글자(지나는 곳)는 hl로 나눠서 돌려줘요: [앞, 강조, 뒤] */
export type ShareText = { pill: string; title: [string, string, string]; sub: string; foot: string; bar: number | null; center: boolean };

export function shareText(o: ShareInput): ShareText {
  const n = o.name?.trim();
  const pill = o.done
    ? n ? (o.mine ? `${n}에게 편지가 도착했어요 💌` : `${n}의 편지가 도착했어요 💌`) : "편지가 도착했어요 💌"
    : n ? (o.mine ? `${n}에게 가는 편지 💌` : `${n}에게서 오는 편지 💌`) : "새 편지가 날아가는 중 💌";
  if (o.done) {
    return { pill, title: ["", `${o.route.km}km`, "를 날아왔어요"], sub: `${o.birdName} · ${formatMinutes(Math.max(1, Math.round(o.totalMin)))} 걸렸어요`, foot: "", bar: null, center: true };
  }
  const here = shareHere(o.route, o.p);
  const title: [string, string, string] =
    o.stalled === "tree" ? ["", here.name, " 근처에서 나무에 걸려 쉬는 중 🌳"]
    : o.stalled === "lost" ? ["", here.name, " 근처에서 길을 찾는 중 🧭"]
    : here.at === "start" ? ["지금 막 ", here.name, `${eulReul(here.name)} 떠났어요 🕊️`]
    : here.at === "end" ? ["", here.name, `${iGa(here.name)} 눈앞이에요 🕊️`]
    : ["지금 ", here.name, `${eulReul(here.name)} 지나는 중 🕊️`];
  return {
    pill, title,
    sub: `${o.route.from.name} → ${o.route.to.name} ${o.route.km}km · ${o.birdName}`,
    foot: `도착까지 ${formatMinutes(Math.max(1, Math.ceil(o.leftMin)))}`,
    bar: Math.min(1, Math.max(0, o.p)), center: false,
  };
}

/** 지금 새와 가장 가까운 지점 이름(출발 직후·도착 직전은 따로 알려요) */
export function shareHere(route: Route, p: number): { name: string; at: "start" | "mid" | "end" } {
  const pts = route.points;
  if (p < 0.08) return { name: pts[0].name, at: "start" };
  if (p > 0.92) return { name: pts[pts.length - 1].name, at: "end" };
  const pos = routePosition(route, p);
  const near = pos.t > 0.5 && pos.next ? pos.next : pos.passed;
  const at = near === pts[0] ? "start" : near === pts[pts.length - 1] ? "end" : "mid";
  return { name: near.name, at };
}

type LL = { lat: number; lng: number };
/**
 * 사진 위 지도 좌표: 출발·도착이 사진 가운데 위쪽(아래 카드에 가리지 않는 곳)에 오도록 확대해요.
 * 짧은 노선도 너무 크게 확대되지 않게(최소 약 2.2도 범위), 긴 노선은 한반도가 보이게.
 */
export function shareProjector(a: LL, b: LL, w = SHARE_W, box = { top: 330, bottom: 1240, side: 150 }) {
  const k = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const spanX = Math.abs(a.lng - b.lng) * k, spanY = Math.abs(a.lat - b.lat);
  const bw = w - box.side * 2, bh = box.bottom - box.top;
  const s = Math.min(bw / Math.max(spanX, 0.01), bh / Math.max(spanY, 0.01), bh / 2.2);
  const cx = (a.lng + b.lng) / 2, cy = (a.lat + b.lat) / 2, my = (box.top + box.bottom) / 2;
  return (lng: number, lat: number): [number, number] => [w / 2 + (lng - cx) * k * s, my - (lat - cy) * s];
}

/** 출발·도착을 잇는 살짝 휜 길(앱 지도처럼 활 모양)과 그 위 t(0~1) 지점 */
export function shareCurve(P: (lng: number, lat: number) => [number, number], a: LL, b: LL) {
  const [x0, y0] = P(a.lng, a.lat), [x1, y1] = P(b.lng, b.lat);
  const mx = (x0 + x1) / 2, my = (y0 + y1) / 2, dx = x1 - x0, dy = y1 - y0;
  const cx = mx - dy * 0.22, cy = my + dx * 0.22;
  const at = (t: number) => {
    const u = 1 - t;
    return { x: u * u * x0 + 2 * u * t * cx + t * t * x1, y: u * u * y0 + 2 * u * t * cy + t * t * y1 };
  };
  return { x0, y0, cx, cy, x1, y1, at };
}
