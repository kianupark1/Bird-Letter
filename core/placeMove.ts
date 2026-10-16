/**
 * "내 동네"를 옮길 수 있는지 살펴봐요. 거리를 억지로 늘리려고 보내는 곳을 마구 바꾸는 것을 막아요.
 * 같은 동네 근처(30km 이내)는 언제든 괜찮고, 그보다 멀리 옮길 때는 비행기보다 빠르게(시속 700km 초과) 옮기는 것만 막아요.
 */
import { haversineKm } from "./geo";
import type { Place } from "./places";

export const NEAR_KM = 30;
export const MAX_MOVE_KMH = 700;

export function canMoveHome(from: Pick<Place, "lat" | "lng">, to: Pick<Place, "lat" | "lng">, hoursSince: number): { ok: boolean; waitMinutes: number; km: number } {
  const km = haversineKm(from.lat, from.lng, to.lat, to.lng);
  if (km <= NEAR_KM) return { ok: true, waitMinutes: 0, km };
  const needHours = km / MAX_MOVE_KMH;
  if (hoursSince >= needHours) return { ok: true, waitMinutes: 0, km };
  return { ok: false, waitMinutes: Math.ceil((needHours - Math.max(0, hoursSince)) * 60), km };
}
