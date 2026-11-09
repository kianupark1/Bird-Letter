/**
 * 가장자리 밀기로 뒤로·앞으로(2026-11-09 대표님: "왼쪽에서 오른쪽으로 밀면 뒤로, 오른쪽에서 왼쪽으로 밀면 앞으로").
 * 아이폰 앱(스토어 앱·홈 화면 앱)은 사파리와 달리 이 동작이 없어서 화면이 직접 계산해요.
 * - 화면 왼쪽 끝(EDGE px 안)에서 시작해 오른쪽으로 MIN_DX 넘게 밀면 "back"
 * - 화면 오른쪽 끝에서 시작해 왼쪽으로 밀면 "forward"
 * - 세로로 더 많이 움직였거나 너무 느리면(목록을 내리는 중) 아무것도 안 함
 */
export const EDGE = 28;
export const MIN_DX = 70;
export const MAX_MS = 900;

export type Swipe = { x0: number; y0: number; x1: number; y1: number; ms: number; width: number };

export function swipeAction(s: Swipe): "back" | "forward" | null {
  const dx = s.x1 - s.x0, dy = Math.abs(s.y1 - s.y0);
  if (s.ms > MAX_MS || dy > Math.abs(dx) * 0.6) return null;
  if (s.x0 <= EDGE && dx >= MIN_DX) return "back";
  if (s.x0 >= s.width - EDGE && -dx >= MIN_DX) return "forward";
  return null;
}

/** 밀고 있는 동안 표시할 진행 정도(0~1)와 방향. 가장자리에서 시작하지 않았으면 null */
export function swipeProgress(x0: number, x1: number, width: number): { dir: "back" | "forward"; p: number } | null {
  if (x0 <= EDGE && x1 > x0) return { dir: "back", p: Math.min(1, (x1 - x0) / MIN_DX) };
  if (x0 >= width - EDGE && x1 < x0) return { dir: "forward", p: Math.min(1, (x0 - x1) / MIN_DX) };
  return null;
}
