import { BIRDS, REFERENCE_KM, type Bird } from "./birds";

/** 하버사인 공식: 두 좌표 사이 직선거리(km) */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** 새 종류와 거리로 도착까지 걸리는 분 */
export function travelMinutes(bird: Bird, km: number) {
  return Math.round((bird.minutesSeoulBusan * km) / REFERENCE_KM);
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

export { BIRDS };
