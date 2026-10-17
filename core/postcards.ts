/**
 * 새가 보내는 엽서(시안 v6-1): 편지를 나르던 새가 명소를 지날 때 그림엽서를 한 장 보내요.
 * 보낸 사람·받는 사람 화면에 똑같이 보이고(편지 ID로 정해져서 서버에 저장하는 값이 없어요), 엽서는 도감에 모여요.
 * 도착 시각에는 아무 영향이 없어요(기다림의 미학: 시간을 줄이거나 늘리지 않음).
 */
import type { LandmarkKind } from "./places";
import { getRoute } from "./routes";

export type Postcard = { /** 경로 진행률(0~1): 이 명소를 지나는 지점 */ f: number; place: string; kind: LandmarkKind; text: string };

/** 명소 종류별 엽서 문구({곳}은 명소 이름) */
const LINES: Record<string, string[]> = {
  gate: ["{곳} 처마 밑에서 잠깐 쉬어 가요!", "{곳} 앞을 지나요. 옛날 사람들도 여기서 편지를 기다렸겠죠?"],
  tower: ["{곳} 꼭대기에서 내려다보니 다 보여요!", "{곳} 둘레를 한 바퀴 돌고 가요"],
  bridge: ["{곳} 위에서 잠깐 쉬어 가요!", "{곳} 아래로 물이 반짝반짝해요"],
  mountain: ["{곳} 위를 넘어가요. 바람이 시원해요!", "{곳} 꼭대기 구름 사이로 날아가요"],
  island: ["{곳}에 잠깐 내려앉았어요. 바다 냄새가 나요", "{곳} 위를 빙 돌았어요!"],
  fortress: ["{곳} 성벽 위에서 한숨 돌려요", "{곳} 성문 앞에서 다른 새들과 인사했어요"],
  hanok: ["{곳} 기와지붕 위에서 쉬어 가요", "{곳} 마당에 꽃이 피었어요"],
  beach: ["{곳} 파도 소리를 들으며 날아가요", "{곳} 모래사장 위를 낮게 지나요"],
  lighthouse: ["{곳} 불빛을 따라 길을 찾았어요!", "{곳}에서 바다를 내려다봐요"],
  park: ["{곳} 나무 위에서 잠깐 쉬어 가요", "{곳} 사람들이 손을 흔들어 줬어요"],
};

function hash(s: string) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

/**
 * 이 편지의 엽서들: 출발지·도착지를 뺀 경로 위 명소에서(하늘 지점 제외), 300km 미만이면 1장·그 이상이면 2장.
 * 경로 위에 명소가 없으면(가까운 곳) 엽서가 없어요.
 */
export function postcardsFor(letterId: string, routeId: string): Postcard[] {
  const r = getRoute(routeId);
  const mids = r.points.map((pt, i) => ({ pt, f: r.fractions[i], i })).filter(({ pt, i }) => i > 0 && i < r.points.length - 1 && pt.kind !== "sky");
  if (!mids.length) return [];
  const n = Math.min(mids.length, r.km >= 300 ? 2 : 1);
  const h = hash(`postcard:${letterId}`);
  const pool = [...mids];
  const out: Postcard[] = [];
  for (let k = 0; k < n; k++) {
    const { pt, f } = pool.splice((h >>> (k * 5)) % pool.length, 1)[0];
    const lines = LINES[pt.kind] ?? LINES.park;
    out.push({ f, place: pt.name, kind: pt.kind as LandmarkKind, text: lines[(h >>> (k * 7 + 3)) % lines.length].replaceAll("{곳}", pt.name) });
  }
  return out.sort((a, b) => a.f - b.f);
}

/** 지금까지 받은 엽서(명소 이름 → 엽서, 같은 곳은 가장 최근 한 장). passes: 편지 ID·노선·진행률 */
export function collectPostcards(passes: { id: string; routeId: string; p: number; birdId?: string }[]): Map<string, Postcard & { birdId?: string }> {
  const m = new Map<string, Postcard & { birdId?: string }>();
  for (const { id, routeId, p, birdId } of passes) for (const c of postcardsFor(id, routeId)) if (c.f <= p + 1e-9) m.set(c.place, { ...c, birdId });
  return m;
}
