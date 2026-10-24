/**
 * 펜팔 우표(2026-10-24 대표님 결정: "우표 방식으로 가자", 기획 docs/펜팔-우표-기획.md).
 * - 모르는 사람에게 보내는 **첫 편지**에만 우표가 들어요. 답장과 이미 이어진 펜팔끼리는 무료예요.
 * - 하루에 첫 편지 FREE_PER_DAY통은 무료이고, 그 뒤부터 우표 1장씩 써요.
 * - 상대가 도착 뒤 REFUND_DAYS일 안에 답장하지 않으면 그 우표는 돌려줘요("수락 안 하면 돈 안 냄").
 * 결제·우표 개수는 서버가 정해요(앱이 계산한 값을 믿지 않음). 여기는 화면과 서버가 같이 쓰는 계산만 있어요.
 */
export const FREE_PER_DAY = 1;
export const REFUND_DAYS = 7;
const DAY = 86_400_000;

/** 한국 날짜(자정 기준)로 같은 날인지 */
export const kstDay = (ms: number) => Math.floor((ms + 9 * 3_600_000) / DAY);

/** 오늘 남은 무료 첫 편지 수 */
export function freeLeft(firstSentAt: number[], now: number): number {
  const today = kstDay(now);
  return Math.max(0, FREE_PER_DAY - firstSentAt.filter((t) => kstDay(t) === today).length);
}

/** 이번 첫 편지에 우표가 필요한지 */
export const needsStamp = (firstSentAt: number[], now: number) => freeLeft(firstSentAt, now) === 0;

export type StampedLetter = { arriveAt: number; repliedAt?: number | null; usedStamp: boolean; refunded?: boolean };

/** 우표를 돌려줄 편지인지: 우표를 썼고, 도착 뒤 REFUND_DAYS일이 지나도록 답장이 없을 때 */
export function refundable(l: StampedLetter, now: number): boolean {
  if (!l.usedStamp || l.refunded) return false;
  const deadline = l.arriveAt + REFUND_DAYS * DAY;
  if (l.repliedAt != null && l.repliedAt <= deadline) return false;
  return now >= deadline;
}

/** 남은 우표 = 산 것 − 쓴 것 + 돌려받은 것(0 밑으로 안 내려감) */
export const stampBalance = (bought: number, used: number, refunded: number) => Math.max(0, bought - used + refunded);
