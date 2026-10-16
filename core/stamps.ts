/**
 * 스탬프 도감: 편지가 지나간 명소를 모아요. 편지를 보내거나 받으면 그 노선의 명소를 새가 지날 때마다 스탬프가 찍혀요.
 * 모으는 것은 서버에 따로 저장하지 않고, 편지 목록(노선+진행률)에서 매번 계산해요.
 */
import { EXTRA_LANDMARKS, PLACES, type LandmarkKind } from "./places";
import { getRoute } from "./routes";

export type Stamp = { name: string; kind: LandmarkKind; group: string };

const KIND_LABEL: Record<string, string> = { gate: "문", tower: "탑", bridge: "다리", mountain: "산", island: "섬", fortress: "성", hanok: "한옥", beach: "바다", lighthouse: "등대", park: "공원" };
export const kindLabel = (k: string) => KIND_LABEL[k] ?? "명소";

/** 도감에 실리는 모든 명소(중복 이름은 한 번만) */
export function allStamps(): Stamp[] {
  const seen = new Set<string>();
  const out: Stamp[] = [];
  for (const p of PLACES) {
    if (seen.has(p.landmark.name)) continue;
    seen.add(p.landmark.name);
    out.push({ name: p.landmark.name, kind: p.landmark.kind, group: p.minor ? "서울 구석구석" : p.region });
  }
  for (const l of EXTRA_LANDMARKS) {
    if (seen.has(l.name)) continue;
    seen.add(l.name);
    out.push({ name: l.name, kind: l.kind, group: l.kind === "mountain" ? "산" : "명소" });
  }
  return out;
}

/** 편지들이 지금까지 지난 명소 이름 모음. p는 0~1 진행률 */
export function stampsFromPasses(passes: { routeId: string; p: number }[]): Set<string> {
  const got = new Set<string>();
  for (const { routeId, p } of passes) {
    if (!(p > 0)) continue;
    const r = getRoute(routeId);
    r.points.forEach((pt, i) => {
      if (pt.kind === "sky") return;
      if (r.fractions[i] <= p + 1e-9) got.add(pt.name);
    });
  }
  return got;
}

export type Badge = { id: string; emoji: string; label: string; need: string; got: boolean };

/** 모은 명소로 받는 배지 */
export function badgesFor(got: Set<string>): Badge[] {
  const all = allStamps();
  const n = all.filter((s) => got.has(s.name)).length;
  const ofKind = (k: string) => all.filter((s) => s.kind === k && got.has(s.name)).length;
  const groupDone = (g: string) => { const gs = all.filter((s) => s.group === g); return gs.length > 0 && gs.every((s) => got.has(s.name)); };
  return [
    { id: "first", emoji: "🏮", label: "첫 스탬프", need: "명소 1곳", got: n >= 1 },
    { id: "ten", emoji: "🧭", label: "길잡이 새", need: "명소 10곳", got: n >= 10 },
    { id: "thirty", emoji: "🗺", label: "전국 구경꾼", need: "명소 30곳", got: n >= 30 },
    { id: "fifty", emoji: "🏆", label: "스탬프 박사", need: "명소 50곳", got: n >= 50 },
    { id: "mountain", emoji: "⛰", label: "산 사랑 새", need: "산 5곳", got: ofKind("mountain") >= 5 },
    { id: "island", emoji: "🏝", label: "바다 건넌 새", need: "섬 1곳", got: ofKind("island") >= 1 },
    { id: "seoul", emoji: "🏙", label: "서울 한 바퀴", need: "서울 구석구석 모두", got: groupDone("서울 구석구석") },
  ];
}
