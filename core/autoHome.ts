/**
 * 내 동네를 위치(GPS)로 저절로(2026-11-25 대표님: "처음에는 GPS로 위치를 정해 주고, 나중에도 위치가 바뀌면 바꾸겠냐고").
 * - 아직 내 동네를 정한 적 없음 → 지금 위치의 동네로 바로 정해요
 * - 정해 둔 동네와 지금 위치의 동네가 다름 → "바꿀까요?" 한 번 물어요(그대로를 누르면 그 동네는 사흘 동안 다시 안 물어요)
 * 구(동네)까지만 쓰고 좌표는 저장하지 않아요.
 */
export const ASK_AGAIN_MS = 3 * 86400000;
export type AutoHome = "set" | "suggest" | "none";

export function decideAutoHome(o: { homeSet: boolean; homePlace: string; here: string; dismissedAt?: number; now: number }): AutoHome {
  if (!o.here) return "none";
  if (!o.homeSet) return "set";
  if (o.here === o.homePlace) return "none";
  if (o.dismissedAt && o.now - o.dismissedAt < ASK_AGAIN_MS) return "none";
  return "suggest";
}
