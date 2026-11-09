/**
 * 가장자리 밀기로 뒤로(2026-11-09 대표님: "왼쪽에서 오른쪽으로 밀면 뒤로" → "뒤로만" → "손맛 더 살려 줘").
 * 아이폰처럼: 왼쪽 끝(EDGE px 안)에서 손가락을 대면 판이 손가락을 따라오고,
 * 놓았을 때 화면 폭의 THRESHOLD 넘게 왔거나 빠르게 튕겼으면 뒤로, 아니면 제자리로 돌아가요.
 * 천천히 끌어도 됨(시간 제한 없음). 처음 몇 px에서 세로로 더 움직이면 목록 내리기로 보고 손을 뗌.
 */
export const EDGE = 40;
export const THRESHOLD = 0.3;
export const FLICK_V = 0.35; // px/ms
export const FLICK_MIN = 40;
export const LOCK_PX = 8;

/** 처음 움직임으로 가로(h)·세로(v) 판정. 아직 모르면 null */
export function lockDirection(dx: number, dy: number): "h" | "v" | null {
  const ax = Math.abs(dx), ay = Math.abs(dy);
  if (ay >= LOCK_PX && ay > ax) return "v";
  if (ax >= LOCK_PX && ax > ay * 1.2) return dx > 0 ? "h" : "v";
  return null;
}

/** 손을 뗐을 때 뒤로 갈지. dx = 끌어온 거리, vx = 마지막 순간 속도(px/ms) */
export function shouldGoBack(dx: number, vx: number, width: number): boolean {
  if (dx <= 0) return false;
  if (vx < -0.2) return false; // 되돌리는 쪽으로 튕겼으면 취소
  return dx >= width * THRESHOLD || (vx >= FLICK_V && dx >= FLICK_MIN);
}

/** 판 위치: 손가락을 그대로 따라오되, 더 갈 곳이 없으면(탭 첫 화면) 고무줄처럼 조금만 */
export function paneOffset(dx: number, canGoBack: boolean): number {
  if (dx <= 0) return 0;
  return canGoBack ? dx : Math.min(36, dx * 0.18);
}
