// 핵심 계산 단위 시험: npm run test:core
// 한국어 조사, 하버사인 거리, 새별 도착 시간 계산이 의도대로인지 확인합니다.
import { withIGa, withEulReul } from "../core/korean.ts";
import { haversineKm, travelMinutes, formatMinutes } from "../core/geo.ts";
import { BIRDS } from "../core/birds.ts";
import { ROUTES, getRoute, routePosition, makeRoute } from "../core/routes.ts";
import { PLACES, nearestPlace, getPlace } from "../core/places.ts";
import { MAX_LETTER_CHARS } from "../core/limits.ts";

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

// 도착 시간: 서울-부산 기준 시간(분)이 문서와 같고, 거리에 비례
const base: Record<string, number> = { hawk: 15, swallow: 30, pigeon: 40, magpie: 55, bungbungi: 20, crane: 90 };
for (const b of BIRDS) eq(`${b.name} 부산 기준 분`, travelMinutes(b, 325), base[b.id]);
eq("매 제주(452km) 분", travelMinutes(BIRDS[0], 452), 21);
eq("두루미 제주(452km) 분", travelMinutes(BIRDS[5], 452), 125);
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

// 표시
eq("125분 표시", formatMinutes(125), "2시간 5분");
eq("40분 표시", formatMinutes(40), "40분");
eq("60분 표시", formatMinutes(60), "1시간");

console.log(`핵심 계산 시험: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
