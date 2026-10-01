// 핵심 계산 단위 시험: npm run test:core
// 한국어 조사, 하버사인 거리, 새별 도착 시간 계산이 의도대로인지 확인합니다.
import { withIGa } from "../core/korean.ts";
import { haversineKm, travelMinutes, formatMinutes } from "../core/geo.ts";
import { BIRDS } from "../core/birds.ts";
import { ROUTES } from "../core/routes.ts";

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

// 표시
eq("125분 표시", formatMinutes(125), "2시간 5분");
eq("40분 표시", formatMinutes(40), "40분");
eq("60분 표시", formatMinutes(60), "1시간");

console.log(`핵심 계산 시험: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
