// 보내는 순간의 날씨(비·눈이면 새가 천천히). 계산은 core/weather.ts
import { weatherFromResponse, weatherUrl, type Weather } from "../../core/weather";
import { getRoute } from "./routes";
export * from "../../core/weather";

/** 출발지·중간·도착지의 지금 날씨. 2.5초 안에 못 받으면 null(맑은 날처럼) */
export async function weatherNow(routeId: string, ms = 2500): Promise<Weather | null> {
  try {
    const r = getRoute(routeId);
    const a = r.from, b = r.to;
    const pts = [{ lat: a.lat, lng: a.lng }, { lat: (a.lat + b.lat) / 2, lng: (a.lng + b.lng) / 2 }, { lat: b.lat, lng: b.lng }];
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    const res = await fetch(weatherUrl(pts), { signal: ctl.signal, cache: "no-store" }).finally(() => clearTimeout(t));
    if (!res.ok) return null;
    return weatherFromResponse(await res.json());
  } catch {
    return null;
  }
}
