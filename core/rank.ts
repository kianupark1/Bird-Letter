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

/** 하루에 같은 사람에게 반영되는 편지 수 / 하루 전체 반영 편지 수(거리를 부풀리려고 편지를 마구 보내는 것을 막아요) */
export const PER_FRIEND_PER_DAY = 2;
export const PER_DAY = 8;
const DAY_MS = 86400000, KST_MS = 9 * 3600000;

/** 랭킹에 반영되는 거리만 골라 기록을 만들어요: 편지마다 받는 사람(키)과 보낸 시각을 보고 하루 한도를 넘는 편지는 빼요 */
export function myStatsCapped(items: { km: number; toKey: string; at: number }[]): Stats {
  const sorted = [...items].sort((a, b) => a.at - b.at);
  const perDay = new Map<number, number>(), perFriend = new Map<string, number>();
  const kept: number[] = [];
  for (const it of sorted) {
    const day = Math.floor((it.at + KST_MS) / DAY_MS);
    const fk = `${day}|${it.toKey}`;
    if ((perDay.get(day) ?? 0) >= PER_DAY || (perFriend.get(fk) ?? 0) >= PER_FRIEND_PER_DAY) continue;
    perDay.set(day, (perDay.get(day) ?? 0) + 1);
    perFriend.set(fk, (perFriend.get(fk) ?? 0) + 1);
    kept.push(it.km);
  }
  return myStats(kept);
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
