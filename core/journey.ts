/**
 * 우주 여행 이정표: 편지가 날아간 거리를 지구 한 바퀴·달·화성에 빗대요(재미용, 대략값).
 * 달은 지구와 달의 평균 거리, 화성은 가장 가까워질 때의 거리, 태양은 평균 거리예요. 정확한 값은 문서마다 조금 달라요.
 */
export type Milestone = { id: string; name: string; emoji: string; km: number };
export const EARTH_KM = 40075;
export const MILESTONES: Milestone[] = [
  { id: "korea", name: "한반도 끝에서 끝", emoji: "🇰🇷", km: 1100 },
  { id: "earth", name: "지구 한 바퀴", emoji: "🌏", km: EARTH_KM },
  { id: "moon", name: "달", emoji: "🌙", km: 384400 },
  { id: "mars", name: "화성", emoji: "🔴", km: 54600000 },
  { id: "sun", name: "태양", emoji: "☀️", km: 149600000 },
];

export type Journey = { laps: number; next: Milestone | null; prev: Milestone | null; pct: number; leftKm: number; reached: Milestone[] };

/** 거리(km)가 어디까지 왔는지: 지구 몇 바퀴, 다음 목적지까지 몇 %·몇 km */
export function journeyOf(km: number): Journey {
  const k = Math.max(0, km);
  const reached = MILESTONES.filter((m) => k >= m.km);
  const next = MILESTONES.find((m) => k < m.km) ?? null;
  const prev = reached.length ? reached[reached.length - 1] : null;
  const base = prev?.km ?? 0;
  const pct = next ? Math.min(100, ((k - base) / (next.km - base)) * 100) : 100;
  return { laps: k / EARTH_KM, next, prev, pct, leftKm: next ? Math.max(0, next.km - k) : 0, reached };
}

/** 지구 바퀴 수를 읽기 쉽게: 0.03바퀴, 1.5바퀴, 12바퀴 */
export function lapsText(km: number): string {
  const l = Math.max(0, km) / EARTH_KM;
  if (l < 0.01) return l === 0 ? "0바퀴" : "0.01바퀴 미만";
  return `${l < 10 ? (Math.round(l * 100) / 100).toString() : Math.round(l).toLocaleString("ko-KR")}바퀴`;
}
