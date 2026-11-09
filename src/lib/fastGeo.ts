"use client";
/**
 * "내 위치로"를 빨리(2026-11-09 대표님: "내 위치 찾기가 너무 오래 걸려").
 * 구(동네)까지만 알면 되니 정밀 GPS를 기다리지 않아요:
 *  ① 폰에 남아 있는 최근 위치(30분 안)가 있으면 기다리지 않고 바로
 *  ② 없으면 대략 위치(와이파이·기지국)를 받아 5km 안쪽이면 바로, 아니면 2초 안에 받은 것 중 가장 나은 것
 *  ③ 앱이 열려 있는 동안 한 번 찾은 위치는 30분 동안 다시 안 찾음(메모리에만, 좌표는 저장·전송하지 않아요)
 */
type Pos = { lat: number; lng: number };
let mem: (Pos & { at: number }) | null = null;
const FRESH = 30 * 60_000;

export function quickPosition(): Promise<Pos> {
  if (mem && Date.now() - mem.at < FRESH) return Promise.resolve(mem);
  const g = typeof navigator !== "undefined" ? navigator.geolocation : undefined;
  if (!g) return Promise.reject(new Error("no-geo"));
  return new Promise((resolve, reject) => {
    let done = false, watch: number | null = null, best: GeolocationPosition | null = null;
    const timers: ReturnType<typeof setTimeout>[] = [];
    const end = () => { done = true; if (watch !== null) g.clearWatch(watch); timers.forEach(clearTimeout); };
    const ok = (p: GeolocationPosition) => {
      if (done) return;
      end();
      mem = { lat: p.coords.latitude, lng: p.coords.longitude, at: Date.now() };
      resolve(mem);
    };
    const consider = (p: GeolocationPosition) => {
      if (done) return;
      if (p.coords.accuracy <= 5000) return ok(p);
      if (!best || p.coords.accuracy < best.coords.accuracy) best = p;
    };
    const fail = (e: unknown) => {
      if (done) return;
      if (best) return ok(best);
      end();
      reject(e);
    };
    // ① 폰에 남은 최근 위치: 없으면 곧바로 실패하고 ②가 이어서 찾아요
    g.getCurrentPosition(ok, () => {}, { maximumAge: FRESH, timeout: 0 });
    // ② 대략 위치를 지켜보다 쓸 만한 첫 값에서 멈춰요
    watch = g.watchPosition(consider, (e) => { if (e.code === 1) fail(e); }, { enableHighAccuracy: false, maximumAge: FRESH, timeout: 12_000 });
    timers.push(setTimeout(() => { if (best) ok(best); }, 2000));
    timers.push(setTimeout(() => fail(new Error("timeout")), 12_000));
  });
}
