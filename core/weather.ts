/**
 * 비·눈 오는 날은 새가 천천히 날아요(2026-11-22 대표님: "비 오는 날은 더 늦게 도착하게 해줘 ㅎㅎ").
 * - 보내는 순간 출발지·중간·도착지의 "지금 날씨"를 한 번 보고(Open-Meteo, 열쇠 필요 없음), 비나 눈이면 편지에 weather를 적어요.
 * - 그 편지의 비행 시간이 비 30%·눈 50% 늘어나고(도착 시각 arriveAt에 미리 반영), 편지는 꼭 도착해요.
 * - 날씨를 못 받아 오면(느린 인터넷·오류) 그냥 맑은 날처럼 보내요. 보내기를 절대 막지 않아요.
 * - 예약 편지는 출발 시각의 날씨를 모르니 붙이지 않아요.
 */
export type Weather = "rain" | "snow";

/** 비 오면 1.3배, 눈 오면 1.5배 오래 걸려요 */
export const WEATHER_FACTOR: Record<Weather, number> = { rain: 1.3, snow: 1.5 };
export const weatherFactor = (w?: Weather | null) => (w ? WEATHER_FACTOR[w] ?? 1 : 1);

/** WMO 날씨 코드 → 비/눈(그 밖은 null). 이슬비·비·소나기·뇌우는 비, 눈·눈 소나기는 눈 */
export function weatherFromCode(code: number | null | undefined): Weather | null {
  if (typeof code !== "number") return null;
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "snow";
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82) || code >= 95) return "rain";
  return null;
}

/** 여러 지점의 날씨 중 하나라도 비·눈이면 그 날씨(눈이 섞이면 눈) */
export function pickWeather(codes: (number | null | undefined)[], precip: (number | null | undefined)[] = []): Weather | null {
  const ws = codes.map(weatherFromCode);
  if (ws.includes("snow")) return "snow";
  if (ws.includes("rain")) return "rain";
  // 코드가 맑음이어도 지금 내리는 양이 0.2mm 이상이면 비로 봐요
  if (precip.some((p) => typeof p === "number" && p >= 0.2)) return "rain";
  return null;
}

export const weatherLabel = (w: Weather) => (w === "snow" ? "❄️ 눈 오는 날" : "🌧 비 오는 날");
/** 화면 문구(날아가는 중 / 도착한 뒤) */
export const weatherFlying = (w: Weather, bird: string) => (w === "snow" ? `❄️ 눈이 와서 ${bird}가 천천히 날아요` : `🌧 비가 와서 ${bird}가 천천히 날아요`);
export const weatherDone = (w: Weather) => (w === "snow" ? "❄️ 눈 오는 날이라 평소보다 천천히 날아왔어요." : "🌧 비 오는 날이라 평소보다 천천히 날아왔어요.");

/** Open-Meteo 주소: 여러 지점을 한 번에(위도·경도는 소수 둘째 자리까지만 — 정확한 위치를 보내지 않아요) */
export function weatherUrl(points: { lat: number; lng: number }[]) {
  const r = (n: number) => n.toFixed(2);
  return `https://api.open-meteo.com/v1/forecast?latitude=${points.map((p) => r(p.lat)).join(",")}&longitude=${points.map((p) => r(p.lng)).join(",")}&current=weather_code,precipitation`;
}
/** Open-Meteo 응답(한 지점이면 객체, 여러 지점이면 배열) → 비/눈 */
export function weatherFromResponse(j: unknown): Weather | null {
  const arr = (Array.isArray(j) ? j : [j]) as { current?: { weather_code?: number; precipitation?: number } }[];
  return pickWeather(arr.map((x) => x?.current?.weather_code), arr.map((x) => x?.current?.precipitation));
}
