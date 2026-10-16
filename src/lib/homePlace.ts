"use client";
import { getPlace } from "../../core/places";
import { canMoveHome } from "../../core/placeMove";

const KEY = "saepyeonji.homeMove.v1";

/** "내 동네"를 옮겨도 되는지 보고, 되면 옮긴 시각을 기억해요. 거리를 억지로 늘리려는 잦은 이동을 막아요(내 폰 기준) */
export function tryMoveHome(currentId: string, nextId: string): { ok: true } | { ok: false; message: string } {
  if (currentId === nextId) return { ok: true };
  const cur = getPlace(currentId), next = getPlace(nextId);
  if (!cur || !next) return { ok: true };
  let lastAt = 0;
  try { lastAt = (JSON.parse(localStorage.getItem(KEY) ?? "{}") as { at?: number }).at ?? 0; } catch {}
  const hours = lastAt ? (Date.now() - lastAt) / 3600000 : 1e6; // 처음 정할 때는 제한 없음
  const r = canMoveHome(cur, next, hours);
  if (!r.ok) return { ok: false, message: `${cur.name}에서 ${next.name}까지는 ${Math.round(r.km)}km예요. 이렇게 빨리 옮겨 갈 수 없어서, 약 ${r.waitMinutes}분 뒤에 바꿀 수 있어요.` };
  try { localStorage.setItem(KEY, JSON.stringify({ id: nextId, at: Date.now() })); } catch {}
  return { ok: true };
}
