// 핵심 계산 단위 시험: npm run test:core
// 한국어 조사, 하버사인 거리, 새별 도착 시간 계산이 의도대로인지 확인합니다.
import { withIGa, withEulReul } from "../core/korean.ts";
import { haversineKm, travelMinutes, formatMinutes } from "../core/geo.ts";
import { BIRDS } from "../core/birds.ts";
import { ROUTES, getRoute, routePosition, makeRoute } from "../core/routes.ts";
import { PLACES, nearestPlace, getPlace } from "../core/places.ts";
import { MAX_LETTER_CHARS } from "../core/limits.ts";
import { validateSchedule, dedupKey, MAX_AHEAD_MS } from "../core/pushPayload.ts";

let pass = 0, fail = 0;
const eq = (label: string, got: unknown, want: unknown) => {
  if (got === want) { pass++; } else { fail++; console.log(`  ✗ ${label}: ${got} (기대: ${want})`); }
};
const near = (label: string, got: number, want: number, tol: number) => {
  if (Math.abs(got - want) <= tol) { pass++; } else { fail++; console.log(`  ✗ ${label}: ${got.toFixed(1)} (기대: ${want}±${tol})`); }
};

// 조사: 받침 있으면 이, 없으면 가
for (const [n, want] of [["지민", "지민이"], ["민수", "민수가"], ["수진", "수진이"], ["엄마", "엄마가"], ["누군가", "누군가가"], ["정훈", "정훈이"], ["Tom", "Tom가"], ["", "가"]]) {
  eq(`조사 ${n}`, withIGa(n), want);
}

for (const [n, want] of [["한라산", "한라산을"], ["오동도", "오동도를"], ["83타워", "83타워를"], ["추암 촛대바위", "추암 촛대바위를"], ["울릉도", "울릉도를"], ["소양강", "소양강을"]]) {
  eq(`목적격 ${n}`, withEulReul(n), want);
}

// 하버사인: 남대문→도착지 직선거리가 노선에 적힌 거리와 비슷해야 함
const [busan, jeju, dokdo] = ROUTES;
const dist = (r: typeof busan) => haversineKm(r.points[0].lat, r.points[0].lng, r.points[r.points.length - 1].lat, r.points[r.points.length - 1].lng);
near("서울→부산 직선거리(km)", dist(busan), busan.km, 15);
near("서울→제주 직선거리(km)", dist(jeju), jeju.km, 40);
near("서울→독도 직선거리(km)", dist(dokdo), dokdo.km, 40);

// 도착 시간: 실제 비행 속도(시속)로 계산한 서울-부산 시간(분), 거리에 비례
const base: Record<string, number> = { hawk: 217, swallow: 488, pigeon: 300, magpie: 557, bungbungi: 325, crane: 355 };
for (const b of BIRDS) eq(`${b.name} 부산 기준 분`, travelMinutes(b, 325), base[b.id]);
eq("매 제주(452km) 분", travelMinutes(BIRDS[0], 452), 301);
eq("두루미 제주(452km) 분", travelMinutes(BIRDS[5], 452), 493);
eq("새 6종", BIRDS.length, 6);
eq("노선 3개", ROUTES.length, 3);


// 지역·랜드마크: id는 "-"가 없고 중복이 없어야 함(노선 id가 "출발-도착")
eq("지역 id에 '-' 없음", PLACES.every((p) => !p.id.includes("-")), true);
eq("지역 id 중복 없음", new Set(PLACES.map((p) => p.id)).size, PLACES.length);
eq("지역 좌표가 한반도 안", PLACES.every((p) => p.lat > 33 && p.lat < 38.7 && p.lng > 124.5 && p.lng < 132), true);
eq("가까운 지역: 대전역 근처 → 대전", nearestPlace(36.332, 127.434).id, "daejeon");
eq("가까운 지역: 해운대 → 부산", nearestPlace(35.1587, 129.1604).id, "busan");
eq("가까운 지역: 성산 → 서귀포 또는 제주", ["jeju", "seogwipo"].includes(nearestPlace(33.45, 126.92).id), true);

// 노선 자동 생성: 어떤 두 지역을 골라도 시작·끝이 맞고, 지점 비율이 순서대로 0→1이어야 함
let routesOk = true, count = 0;
for (const a of PLACES) for (const b of PLACES) {
  if (a.id === b.id) continue;
  const r = makeRoute(a, b); count++;
  const f = r.fractions;
  if (r.id !== `${a.id}-${b.id}` || r.points.length < 2 || f[0] !== 0 || Math.abs(f[f.length - 1] - 1) > 1e-9 || f.some((v, i) => i && v < f[i - 1])) routesOk = false;
  if (r.points[0].name !== a.landmark.name || r.points[r.points.length - 1].name !== b.landmark.name) routesOk = false;
  if (r.points.length > 6) routesOk = false; // 출발+도착+경유지 최대 4
}
eq(`모든 지역 쌍(${count}개) 노선이 올바름`, routesOk, true);
eq("먼 노선은 경유지가 2곳 이상", getRoute("jeju-sokcho").points.length >= 4, true);
eq("가까운 노선은 경유지가 없어도 됨(수원→서울)", getRoute("suwon-seoul").points.length >= 2, true);
eq("알 수 없는 노선 id는 서울→부산", getRoute("nowhere-xx").id, "seoul-busan");
eq("같은 곳 노선 id는 서울→부산", getRoute("seoul-seoul").id, "seoul-busan");
eq("예전 노선 id 거리 유지(서울→제주)", getRoute("seoul-jeju").km, 452);
{
  const r = getRoute("seoul-busan");
  const start = routePosition(r, 0), mid = routePosition(r, 0.5), end = routePosition(r, 1);
  eq("진행률 0 → 출발지", start.passed.name, "남대문");
  eq("진행률 100% → 도착지", end.passed.name, "광안대교");
  eq("진행률 100%에는 다음 지점 없음", end.next, null);
  eq("진행률 50% → 다음 지점이 있음", !!mid.next, true);
  eq("진행률 50% 위치는 위도가 출발~도착 사이", mid.lat < r.points[0].lat && mid.lat > r.points[r.points.length - 1].lat, true);
}
eq("편지 글자 수 한도는 10만 자", MAX_LETTER_CHARS, 100000);
eq("getPlace 서울", getPlace("seoul")?.landmark.name, "남대문");

// 푸시 예약 요청 검사: 올바른 건 통과, 위험한 건 거절
{
  const now = 1_800_000_000_000;
  const good = () => ({
    subscription: { endpoint: "https://fcm.googleapis.com/fcm/send/abc123", keys: { p256dh: "BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM", auth: "tBHItJI5svbpez7KI4CCXg" } },
    payload: { title: "엄마에게 보낸 편지가 도착했어요!", body: "까치가 제주에 내려앉았어요", url: "/letter/abcDEF123", tag: "l-abc-a" },
    at: now + 60_000,
  });
  const bad = (mut: (g: any) => void) => { const g: any = good(); mut(g); return validateSchedule(g, now).ok; };
  eq("푸시 예약: 올바른 요청 통과", validateSchedule(good(), now).ok, true);
  eq("푸시 예약: 토스 앱 편지 주소(?id=)도 통과", bad((g) => (g.payload.url = "/letter?id=abc123")) , true);
  eq("푸시 예약: 모질라·애플 알림 서버 통과", validateSchedule({ ...good(), subscription: { ...good().subscription, endpoint: "https://updates.push.services.mozilla.com/wpush/v2/x" } }, now).ok && validateSchedule({ ...good(), subscription: { ...good().subscription, endpoint: "https://web.push.apple.com/Qx" } }, now).ok, true);
  eq("푸시 예약: 아무 사이트 주소는 거절", bad((g) => (g.subscription.endpoint = "https://evil.example.com/x")), false);
  eq("푸시 예약: http 주소는 거절", bad((g) => (g.subscription.endpoint = "http://fcm.googleapis.com/x")), false);
  eq("푸시 예약: 비슷한 가짜 도메인 거절", bad((g) => (g.subscription.endpoint = "https://fcm.googleapis.com.evil.com/x")), false);
  eq("푸시 예약: 다른 사이트로 열리는 주소 거절", bad((g) => (g.payload.url = "https://evil.example.com/letter/a")), false);
  eq("푸시 예약: 편지 주소가 아닌 경로 거절", bad((g) => (g.payload.url = "/settings")), false);
  eq("푸시 예약: 이미 지난 시각 거절", bad((g) => (g.at = now - 3_600_000)), false);
  eq("푸시 예약: 8일 넘게 먼 시각 거절", bad((g) => (g.at = now + MAX_AHEAD_MS + 1000)), false);
  eq("푸시 예약: 제목이 너무 길면 거절", bad((g) => (g.payload.title = "가".repeat(81))), false);
  eq("푸시 예약: 구독 키가 없으면 거절", bad((g) => delete g.subscription.keys), false);
  eq("푸시 예약: 숫자 아닌 시각 거절", bad((g) => (g.at = "내일")), false);
  eq("푸시 예약: 빈 요청 거절", validateSchedule(null, now).ok, false);
  eq("중복 방지 값: 같은 입력은 같은 값", dedupKey("https://fcm.googleapis.com/x", "t1"), dedupKey("https://fcm.googleapis.com/x", "t1"));
  eq("중복 방지 값: 다른 구독은 다른 값", dedupKey("https://fcm.googleapis.com/x", "t1") !== dedupKey("https://fcm.googleapis.com/y", "t1"), true);
}

// 표시
eq("125분 표시", formatMinutes(125), "2시간 5분");
eq("40분 표시", formatMinutes(40), "40분");
eq("60분 표시", formatMinutes(60), "1시간");

// 길 잃음·나무 걸림 사고(core/flight.ts)
import { MISHAP_SINCE, elapsedAtFraction, planFor, progressAt, rollMishap, totalMinutes } from "../core/flight.ts";
const after = MISHAP_SINCE + 3600_000;
eq("같은 ID는 항상 같은 결과", JSON.stringify(rollMishap("abc123", "magpie", after)), JSON.stringify(rollMishap("abc123", "magpie", after)));
eq("기준일 전에 보낸 편지는 사고 없음", (() => { for (let i = 0; i < 3000; i++) if (rollMishap(`x${i}`, "magpie", MISHAP_SINCE - 1)) return false; return true; })(), true);
for (const b of BIRDS) {
  const N = 40000;
  let hit = 0;
  for (let i = 0; i < N; i++) if (rollMishap(`id${i}`, b.id, after)) hit++;
  near(`${b.name} 사고율(1/${b.mishapOneIn})`, hit / N, 1 / b.mishapOneIn, 0.35 / b.mishapOneIn);
}
// 사고가 난 편지 하나를 찾아 시간표가 앞뒤 맞는지 확인
let sample = "";
for (let i = 0; i < 100000 && !sample; i++) if (rollMishap(`m${i}`, "magpie", after)) sample = `m${i}`;
const mm = rollMishap(sample, "magpie", after)!;
eq("사고 지점 20~80%", mm.at >= 0.2 && mm.at <= 0.8, true);
eq("지연 25~75%", mm.delayFrac >= 0.25 && mm.delayFrac <= 0.75, true);
const km = 325, tot = totalMinutes(sample, "magpie", km, after);
const baseMin = (km / 35) * 60;
near("사고가 나면 전체 시간이 늘어남", tot, baseMin * (1 + mm.delayFrac), 0.001);
const plan = planFor(sample, "magpie", after, after + tot * 60000);
near("원래 비행 시간 복원", plan.baseMs / 60000, baseMin, 0.001);
const stallMid = (plan.stall!.from + plan.stall!.to) / 2;
eq("멈춰 있는 동안 진행률 고정", progressAt(plan, stallMid).p, mm.at);
eq("멈춰 있는 동안 stalled", progressAt(plan, stallMid).stalled, true);
near("멈춤 직전과 직후 진행률이 이어짐", progressAt(plan, plan.stall!.from - 1).p, progressAt(plan, plan.stall!.to + 1).p, 0.001);
eq("도착 시각에 완료", progressAt(plan, plan.totalMs).done, true);
near("사고 지점 이후 지점은 멈춤만큼 늦게 지남", elapsedAtFraction(plan, 0.95) - 0.95 * plan.baseMs, plan.stall!.to - plan.stall!.from, 1);
near("사고 지점 이전 지점은 그대로", elapsedAtFraction(plan, 0.1), 0.1 * plan.baseMs, 1);
// 사고 없는 편지는 선형
let clean = "";
for (let i = 0; i < 100 && !clean; i++) if (!rollMishap(`c${i}`, "hawk", after)) clean = `c${i}`;
const cp = planFor(clean, "hawk", after, after + 3600_000);
eq("사고 없으면 중간 진행률 50%", progressAt(cp, 1800_000).p, 0.5);

console.log(`핵심 계산 시험: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
