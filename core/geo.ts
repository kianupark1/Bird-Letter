import { BIRDS, type Bird } from "./birds";

/** 하버사인 공식: 두 좌표 사이 직선거리(km) */
export function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const rad = (d: number) => (d * Math.PI) / 180;
  const dLat = rad(lat2 - lat1);
  const dLng = rad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * 쉬어 가며 날기(2026-10-17, 대표님: "새가 너무 빠르다, 더 오래 걸리게"): 새는 쉬지 않고 날지 않아요.
 * 쉬고·먹고·바람을 피하는 시간까지 넣어 실제 순항 속도로 계산한 시간의 3배, 아무리 가까워도 최소 1시간.
 * (새마다 빠르고 느린 순서는 그대로. 값을 바꾸면 앞으로 보내는 편지부터 적용돼요)
 */
export const REST_FACTOR = 3;
export const MIN_FLIGHT_MIN = 60;
/** 쉬어 가는 시간 없이 순항 속도로만 계산한 분(예전 편지·참고용) */
export function cruiseMinutes(bird: Bird, km: number) {
  return Math.round((km / bird.kmh) * 60);
}
/** 새가 도착까지 걸리는 분(사고가 없을 때, 쉬어 가는 시간 포함) */
export function travelMinutes(bird: Bird, km: number) {
  return Math.round(Math.max(MIN_FLIGHT_MIN, (km / bird.kmh) * 60 * REST_FACTOR));
}

export function formatMinutes(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60), m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

export { BIRDS };
