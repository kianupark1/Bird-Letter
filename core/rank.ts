/**
 * 친구랑 나의 "누가 제일 멀리 보냈나" 랭킹 계산(화면과 서버 저장은 따로).
 * 거리는 각자 앱이 자기 편지의 노선 거리(km)로 계산해서 올려요. 친구끼리 즐기는 용도라 직접 입력한 값을 믿어요.
 */
export type Stats = { km: number; maxKm: number; count: number };
export type RankEntry = { uid: string; name: string; bird?: string; me: boolean; stats: Stats | null };
export type RankKind = "total" | "longest";

const val = (e: RankEntry, kind: RankKind) => (e.stats ? (kind === "total" ? e.stats.km : e.stats.maxKm) : 0);

/** 내가 보낸 편지들(노선 거리 km 목록)로 내 기록을 만들어요 */
export function myStats(kmList: number[]): Stats {
  const ok = kmList.filter((k) => Number.isFinite(k) && k > 0);
  return { km: Math.round(ok.reduce((a, b) => a + b, 0)), maxKm: Math.round(Math.max(0, ...ok)), count: ok.length };
}

/** 기록이 큰 순서로. 기록이 없는 친구(아직 새 버전을 안 연 친구)는 맨 뒤 */
export function rankOf(entries: RankEntry[], kind: RankKind): RankEntry[] {
  return [...entries].sort((a, b) => {
    const A = a.stats ? 1 : 0, B = b.stats ? 1 : 0;
    if (A !== B) return B - A;
    return (val(b, kind) - val(a, kind)) || a.name.localeCompare(b.name, "ko");
  });
}

/** 내 순위(1부터)와 1위까지 남은 km. 내가 1위면 gap은 0 */
export function myPlace(sorted: RankEntry[], kind: RankKind) {
  const i = sorted.findIndex((e) => e.me);
  if (i < 0) return null;
  const top = sorted[0];
  return { rank: i + 1, gapKm: Math.max(0, val(top, kind) - val(sorted[i], kind)), leader: top };
}

export const rankValue = val;
