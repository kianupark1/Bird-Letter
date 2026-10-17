// 핵심 계산 단위 시험: npm run test:core
// 한국어 조사, 하버사인 거리, 새별 도착 시간 계산이 의도대로인지 확인합니다.
import { withIGa, withEulReul } from "../core/korean.ts";
import { haversineKm, travelMinutes, cruiseMinutes, formatMinutes } from "../core/geo.ts";
import { BIRDS } from "../core/birds.ts";
import { ROUTES, getRoute, routePosition, makeRoute } from "../core/routes.ts";
import { PLACES, nearestPlace, getPlace } from "../core/places.ts";
import { searchPlaces, choseong } from "../core/placeSearch.ts";
import { validateDepart, isScheduled, toInputValue, fromInputValue, dateTimeText, MAX_SCHEDULE_DAYS } from "../core/schedule.ts";
import { MAX_PHOTOS, MAX_PHOTO_CHARS } from "../core/limits.ts";
import { MAX_LETTER_CHARS } from "../core/limits.ts";
import { validateSchedule, dedupKey, MAX_AHEAD_MS } from "../core/pushPayload.ts";
import { generateKeyPairSync, createVerify, createSign } from "node:crypto";
import { createCustomToken, createAccessAssertion, verifyFirebaseIdToken, parseServiceAccount, verifyGithubOidc } from "../core/serverAuth.ts";
import { loginWithKakao, type KakaoDeps } from "../core/kakaoLogin.ts";

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
for (const b of BIRDS) eq(`${b.name} 부산 순항 분`, cruiseMinutes(b, 325), base[b.id]);
for (const b of BIRDS) eq(`${b.name} 부산은 새 성격대로`, travelMinutes(b, 325), Math.round(Math.max(b.minMin, (325 / b.kmh) * 60 * b.rest)));
{
  const g = (id: string) => BIRDS.find((b) => b.id === id)!;
  eq("가까운 곳: 매는 몇 분", travelMinutes(g("hawk"), 4), 10);
  eq("가까운 곳: 비둘기는 1시간", travelMinutes(g("pigeon"), 4), 60);
  eq("가까운 곳: 까치는 하루", travelMinutes(g("magpie"), 4), 1440);
  eq("가까운 곳은 새마다 모두 다름", new Set(BIRDS.map((b) => travelMinutes(b, 4))).size, BIRDS.length);
  eq("서울-부산도 매가 가장 빠르고 까치가 가장 느림", [...BIRDS].sort((a, b) => travelMinutes(a, 325) - travelMinutes(b, 325)).map((b) => b.id).join(",").startsWith("hawk") && [...BIRDS].sort((a, b) => travelMinutes(a, 325) - travelMinutes(b, 325)).at(-1)!.id === "magpie", true);
}
eq("하루 넘으면 일로 표시", formatMinutes(1440 + 7 * 60 + 5), "1일 7시간");
eq("딱 하루", formatMinutes(1440), "1일");
eq("매 제주(452km) 순항 분", cruiseMinutes(BIRDS[0], 452), 301);
eq("두루미 제주(452km) 순항 분", cruiseMinutes(BIRDS[5], 452), 493);
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
// 예약 발송: 출발 시각 확인과 표시
{
  const now = Date.UTC(2026, 9, 13, 3, 0, 0);
  eq("예약: 비워 두면 안내", validateDepart(null, now) !== null, true);
  eq("예약: 30초 뒤는 안 됨", validateDepart(now + 30_000, now) !== null, true);
  eq("예약: 2분 뒤는 됨", validateDepart(now + 120_000, now), null);
  eq("예약: 30일 뒤는 됨", validateDepart(now + 30 * 86400_000, now), null);
  eq("예약: 366일 뒤는 안 됨", validateDepart(now + 366 * 86400_000, now) !== null, true);
  eq("예약: 최대 일수는 366(서버 규칙과 같음)", MAX_SCHEDULE_DAYS, 366);
  eq("예약 중 판정: 출발이 미래", isScheduled(now + 1, now), true);
  eq("예약 중 판정: 출발이 지났으면 아님", isScheduled(now - 1, now), false);
  const v = toInputValue(new Date(2026, 11, 25, 9, 5).getTime());
  eq("입력칸 값 만들기", v, "2026-12-25T09:05");
  eq("입력칸 값 읽기(되돌리기)", fromInputValue(v), new Date(2026, 11, 25, 9, 5).getTime());
  eq("입력칸 값이 이상하면 null", fromInputValue("내일"), null);
  eq("날짜 표시(오전)", dateTimeText(new Date(2026, 11, 25, 9, 5).getTime()), "12월 25일 오전 9:05");
  eq("날짜 표시(낮 12시는 오후 12)", dateTimeText(new Date(2026, 0, 2, 12, 0).getTime()), "1월 2일 오후 12:00");
  eq("날짜 표시(자정은 오전 12)", dateTimeText(new Date(2026, 0, 2, 0, 7).getTime()), "1월 2일 오전 12:07");
}
eq("사진은 최대 3장", MAX_PHOTOS, 3);
eq("사진 한 장은 450000자까지(서버 규칙과 같음)", MAX_PHOTO_CHARS, 450000);
eq("초성 뽑기", choseong("송파구"), "ㅅㅍㄱ");
eq("검색: 송 → 송파구가 맨 앞", searchPlaces(PLACES, "송")[0]?.id, "songpa");
eq("검색: ㅅㅍ → 송파구", searchPlaces(PLACES, "ㅅㅍ")[0]?.id, "songpa");
eq("검색: 강남 → 강남구", searchPlaces(PLACES, "강남")[0]?.id, "gangnam");
eq("검색: 경복 → 종로구(경복궁)", searchPlaces(PLACES, "경복")[0]?.id, "jongno");
eq("검색: 서울 → 서울 25곳 모두", searchPlaces(PLACES, "서울", 99).filter((p) => p.region === "서울").length, 25);
eq("검색: 부 → 부산이 앞쪽", searchPlaces(PLACES, "부").slice(0, 4).some((p) => p.id === "busan"), true);
eq("검색: 빈 검색어는 빈 목록", searchPlaces(PLACES, "  ").length, 0);
eq("검색: 없는 이름", searchPlaces(PLACES, "뷁뷁").length, 0);
eq("서울 25개 구", PLACES.filter((p) => p.region === "서울").length, 25);
eq("서울 구마다 랜드마크가 다름", new Set(PLACES.filter((p) => p.region === "서울").map((p) => p.landmark.name)).size, 25);
eq("랜드마크 이름 중복 없음", new Set(PLACES.map((p) => p.landmark.name)).size, PLACES.length);
eq("코엑스 근처 → 서울 강남구", nearestPlace(37.5126, 127.0590).id, "gangnam");
eq("서울 안 노선(강남→종로)은 가까워서 경유지 후보가 있음", getRoute("gangnam-jongno").km < 20, true);
eq("먼 노선 경유지에 서울 구 랜드마크 없음", getRoute("busan-sokcho").points.every((q) => !PLACES.some((p) => p.minor && p.landmark.name === q.name && q.name !== "") ), true);

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
  eq("푸시 예약: 홈(/)으로 열리는 시험 알림 통과", bad((g) => (g.payload.url = "/")), true);
  eq("푸시 예약: //외부주소 거절", bad((g) => (g.payload.url = "//evil.example")), false);
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
import { MISHAP_SINCE, SPEED_VARY_SINCE, speedFactor, elapsedAtFraction, planFor, progressAt, rollMishap, totalMinutes } from "../core/flight.ts";
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

// 속도 변동 ±15%
{
  const t = SPEED_VARY_SINCE + 3600_000;
  let lo = 9, hi = 0, sum = 0; const N = 20000;
  for (let i = 0; i < N; i++) { const f = speedFactor(`sv${i}`, "pigeon", t); lo = Math.min(lo, f); hi = Math.max(hi, f); sum += f; }
  eq("속도 변동은 0.85~1.15 안", lo >= 0.85 && hi <= 1.15, true);
  eq("속도 변동이 실제로 퍼져 있음", lo < 0.87 && hi > 1.13, true);
  near("속도 변동 평균은 1", sum / N, 1, 0.01);
  eq("같은 ID는 같은 컨디션", speedFactor("zz", "hawk", t), speedFactor("zz", "hawk", t));
  eq("기준일 전 편지는 변동 없음", speedFactor("zz", "hawk", SPEED_VARY_SINCE - 1), 1);
  let id = ""; for (let i = 0; i < 1000 && !id; i++) if (!rollMishap(`q${i}`, "hawk", t)) id = `q${i}`;
  const f = speedFactor(id, "hawk", t);
  near("변동이 도착 시간에 반영", totalMinutes(id, "hawk", 325, t), ((325 / (90 * f)) * 60), 0.001);
  const pl = planFor(id, "hawk", t, t + totalMinutes(id, "hawk", 325, t) * 60000);
  eq("변동 있어도 중간 진행률 50%", progressAt(pl, pl.totalMs / 2).p, 0.5);
}

// 사람별 대화방 묶기(core/threads.ts)
import { buildThreads, keyForName, keyForUid, keyFromParams, initialOf, avatarTone, avatarBirdFor, AVATAR_BIRDS } from "../core/threads.ts";
{
  const friends = [{ uid: "f1", name: "지민" }, { uid: "f2", name: "가온" }, { uid: "f3", name: "현우" }];
  const sent = [
    { id: "s1", to: "지민", toUid: "f1", sentAt: 100 },
    { id: "s2", to: "엄마", sentAt: 300 },
    { id: "s3", to: "지민", toUid: "f1", sentAt: 500 },
  ];
  const recv = [{ id: "r1", fromUid: "f1", fromName: "지민이", sentAt: 400 }, { id: "r2", fromUid: "x9", fromName: "낯선이", sentAt: 50 }];
  const t = buildThreads(sent, recv, friends);
  eq("지민 편지 3통이 한 방에 모임", t.find((x) => x.key === keyForUid("f1"))!.entries.length, 3);
  eq("지민 방의 최신 편지가 맨 앞", t.find((x) => x.key === keyForUid("f1"))!.entries[0].item.id, "s3");
  eq("친구 이름이 있으면 그 이름", t.find((x) => x.key === keyForUid("f1"))!.name, "지민");
  eq("이름만 아는 받는 사람은 이름으로 묶임", t.some((x) => x.key === keyForName("엄마")), true);
  eq("친구 아닌 보낸 사람도 방이 생김", t.find((x) => x.key === keyForUid("x9"))!.name, "낯선이");
  eq("편지 없는 친구도 빈 방으로 나옴", t.find((x) => x.key === keyForUid("f3"))!.entries.length, 0);
  eq("최근 편지가 있는 방이 앞", t[0].key, keyForUid("f1"));
  eq("편지 없는 친구는 이름순으로 맨 뒤", t.slice(-2).map((x) => x.name).join(","), "가온,현우");
  const t2 = buildThreads([{ id: "n1", to: "가온", sentAt: 10 }, { id: "n2", to: "가온", toUid: "f2", sentAt: 20 }], [], friends);
  eq("이름만 적은 편지도 같은 이름의 친구와 한 방", t2.filter((x) => x.name === "가온").length, 1);
  eq("합쳐진 방에 편지 2통", t2.find((x) => x.key === keyForUid("f2"))!.entries.length, 2);
  eq("주소 값에서 구분값", keyFromParams("abc", null), "u:abc");
  eq("주소 값(이름)", keyFromParams(null, "엄마"), "n:엄마");
  eq("주소 값 없음", keyFromParams(null, null), null);
  eq("첫 글자", initialOf("지민"), "지");
  eq("같은 이름은 같은 색", avatarTone("지민"), avatarTone("지민"));
  eq("같은 이름은 같은 새 얼굴", avatarBirdFor("지민"), avatarBirdFor("지민"));
  eq("고른 새가 있으면 그 새", avatarBirdFor("지민", "crane"), "crane");
  eq("엉뚱한 값이면 이름으로 정함", (AVATAR_BIRDS as readonly string[]).includes(avatarBirdFor("지민", "dragon")), true);
  const kinds = new Set(["엄마", "지민", "현우", "할머니", "서연", "민수", "아빠", "수진", "하늘", "도윤"].map((n) => avatarBirdFor(n)));
  eq("이름마다 새 얼굴이 고르게 흩어짐(10명 중 4종 이상)", kinds.size >= 4, true);
}

// 구 단위 위치(core/districts.ts)
import { locate, DISTRICT_MAX_KM } from "../core/districts.ts";
{
  eq("해운대 근처는 부산 해운대구", locate(35.163, 129.165).label, "부산 해운대구");
  eq("강남 근처는 서울 강남구", locate(37.517, 127.047).label, "서울 강남구");
  eq("대전 유성은 대전 유성구", locate(36.362, 127.356).label, "대전 유성구");
  eq("구를 알 수 없는 곳(제주 바다)은 가까운 지역 이름", locate(33.4, 126.5).label.includes("구"), false);
  eq("출발 지역도 함께 돌려줌", typeof locate(35.163, 129.165).place.id, "string");
  eq("구 판정 거리 기준", DISTRICT_MAX_KM, 12);
}
// 랭킹 계산(core/rank.ts)
import { myStats, rankOf, myPlace } from "../core/rank.ts";
{
  eq("내 기록: 합과 가장 먼 한 통", JSON.stringify(myStats([325, 452, 0, 120])), JSON.stringify({ km: 897, maxKm: 452, count: 3 }));
  eq("편지가 없으면 0", JSON.stringify(myStats([])), JSON.stringify({ km: 0, maxKm: 0, count: 0 }));
  const es = [
    { uid: "a", name: "나", me: true, stats: { km: 1980, maxKm: 430, count: 5 } },
    { uid: "b", name: "지민", me: false, stats: { km: 2350, maxKm: 325, count: 7 } },
    { uid: "c", name: "새친구", me: false, stats: null },
    { uid: "d", name: "현우", me: false, stats: { km: 1200, maxKm: 452, count: 3 } },
  ];
  eq("누적 거리 1위는 지민", rankOf(es, "total")[0].name, "지민");
  eq("기록 없는 친구는 맨 뒤", rankOf(es, "total").slice(-1)[0].name, "새친구");
  eq("가장 먼 한 통 1위는 현우", rankOf(es, "longest")[0].name, "현우");
  const mp = myPlace(rankOf(es, "total"), "total")!;
  eq("내 순위 2위", mp.rank, 2);
  eq("1위까지 370km", mp.gapKm, 370);
}

// ---- 서버 로그인 부품(키는 시험용으로 즉석에서 만든 것) ----
const kp = generateKeyPairSync("rsa", { modulusLength: 2048 });
const privPem = kp.privateKey.export({ type: "pkcs8", format: "pem" }).toString();
const sa = { project_id: "demo-bl", client_email: "svc@demo-bl.iam.gserviceaccount.com", private_key: privPem };
const NOW = 1_800_000_000;
const jwtParts = (t: string) => t.split(".").map((x, i) => (i < 2 ? JSON.parse(Buffer.from(x, "base64url").toString()) : x));
{
  const tok = createCustomToken(sa, "uid123", { kakao: true }, NOW);
  const [h, b, sig] = jwtParts(tok) as [any, any, string];
  eq("커스텀 토큰 alg", h.alg, "RS256");
  eq("커스텀 토큰 uid", b.uid, "uid123");
  eq("커스텀 토큰 iss", b.iss, sa.client_email);
  eq("커스텀 토큰 유효 1시간", b.exp - b.iat, 3600);
  eq("커스텀 토큰 claims", b.claims.kakao, true);
  const [hh, pp] = tok.split(".");
  eq("커스텀 토큰 서명이 맞음", createVerify("RSA-SHA256").update(`${hh}.${pp}`).verify(kp.publicKey, Buffer.from(sig, "base64url")), true);
  const as = jwtParts(createAccessAssertion(sa, "scope-x", NOW))[1] as any;
  eq("접근 요청서 scope", as.scope, "scope-x");
  eq("서비스 계정 JSON 읽기", parseServiceAccount(JSON.stringify(sa))?.project_id, "demo-bl");
  eq("서비스 계정 base64 읽기", parseServiceAccount(Buffer.from(JSON.stringify(sa)).toString("base64"))?.client_email, sa.client_email);
  eq("서비스 계정 잘못된 값은 null", parseServiceAccount("{}"), null);
  eq("서비스 계정 없음은 null", parseServiceAccount(undefined), null);
}
{
  // 폰의 ID 토큰을 흉내: 같은 키로 서명한 토큰을 같은 공개 키로 확인
  const idTok = (over: Record<string, unknown> = {}, kid = "k1") => {
    const head = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString("base64url");
    const body = Buffer.from(JSON.stringify({ aud: "demo-bl", iss: "https://securetoken.google.com/demo-bl", sub: "anon1", iat: NOW - 10, exp: NOW + 3000, ...over })).toString("base64url");
    const sig = createSign("RSA-SHA256").update(`${head}.${body}`).sign(kp.privateKey).toString("base64url");
    return `${head}.${body}.${sig}`;
  };
  const keyFor = (kid: string) => (kid === "k1" ? kp.publicKey : undefined);
  eq("ID 토큰 정상", verifyFirebaseIdToken(idTok(), "demo-bl", keyFor, NOW)?.uid, "anon1");
  eq("ID 토큰 만료", verifyFirebaseIdToken(idTok({ exp: NOW - 1 }), "demo-bl", keyFor, NOW), null);
  eq("ID 토큰 다른 프로젝트", verifyFirebaseIdToken(idTok({ aud: "other" }), "demo-bl", keyFor, NOW), null);
  eq("ID 토큰 다른 발급처", verifyFirebaseIdToken(idTok({ iss: "https://evil.example/demo-bl" }), "demo-bl", keyFor, NOW), null);
  eq("ID 토큰 모르는 키(kid)", verifyFirebaseIdToken(idTok({}, "zz"), "demo-bl", keyFor, NOW), null);
  const forged = idTok().split(".").slice(0, 2).join(".") + "." + Buffer.from("x".repeat(256)).toString("base64url");
  eq("ID 토큰 서명 위조", verifyFirebaseIdToken(forged, "demo-bl", keyFor, NOW), null);
  eq("ID 토큰 쓰레기", verifyFirebaseIdToken("a.b", "demo-bl", keyFor, NOW), null);
}
{
  // 카카오 흐름: 저장소와 카카오를 가짜로
  const store = new Map<string, string>();
  const mk = (uid: string, claims: Record<string, unknown> = {}, kakao = "12345"): KakaoDeps => ({
    kakaoUserId: async (c) => { if (c === "badcode") throw new Error("x"); return kakao; },
    verifyIdToken: async (t) => (t === "good" ? { uid, claims } : null),
    claimAccount: async (k, u) => { if (store.has(k)) return false; store.set(k, u); return true; },
    accountUid: async (k) => store.get(k) ?? null,
    mintToken: (u, c) => `T:${u}:${JSON.stringify(c)}`,
  });
  const r1 = await loginWithKakao({ code: "code-1", idToken: "good" }, mk("anonA"));
  eq("첫 연결은 지금 쓰던 계정 uid를 유지", r1.ok && r1.uid, "anonA");
  eq("첫 연결은 계정 바뀜 없음", r1.ok && r1.switched, false);
  eq("카카오번호가 기록됨", store.get("12345"), "anonA");
  const r2 = await loginWithKakao({ code: "code-2", idToken: "good" }, mk("anonB"));
  eq("새 폰에서 같은 카카오로 들어오면 기존 계정으로", r2.ok && r2.uid, "anonA");
  eq("새 폰은 계정 바뀜 표시", r2.ok && r2.switched, true);
  const r3 = await loginWithKakao({ code: "badcode", idToken: "good" }, mk("anonC"));
  eq("카카오 확인 실패는 401", !r3.ok && r3.status, 401);
  const r4 = await loginWithKakao({ code: "code-4", idToken: "bad" }, mk("anonC"));
  eq("가짜 Firebase 토큰은 401", !r4.ok && r4.status, 401);
  const r5 = await loginWithKakao({ code: 5, idToken: "good" }, mk("anonC"));
  eq("잘못된 요청은 400", !r5.ok && r5.status, 400);
  const r6 = await loginWithKakao({ code: "code-6", idToken: "good" }, mk("anonD", { kakaoId: "999" }, "777"));
  eq("이미 다른 카카오가 연결된 계정은 409", !r6.ok && r6.status, 409);
  const r7 = await loginWithKakao({ code: "code-7", idToken: "good" }, mk("anonE", {}, "12abc"));
  eq("카카오 번호 형식이 이상하면 거절", !r7.ok, true);
}


// ── 스탬프·이야기·랭킹 한도·이동 제한 ──
{
  const { allStamps, stampsFromPasses, badgesFor } = await import("../core/stamps");
  const { storiesFor, collectItems, STORY_POOL } = await import("../core/stories");
  const { canMoveHome } = await import("../core/placeMove");
  const { myStatsCapped, PER_DAY, PER_FRIEND_PER_DAY } = await import("../core/rank");
  const { getPlace } = await import("../core/places");
  const all = allStamps();
  eq("도감에 명소가 40곳 넘게 있음", all.length > 40, true);
  eq("도감 이름이 겹치지 않음", new Set(all.map((s) => s.name)).size, all.length);
  eq("출발만 해도 출발지 스탬프 1개 이상", stampsFromPasses([{ routeId: "seoul-busan", p: 0.001 }]).size >= 1, true);
  const half = stampsFromPasses([{ routeId: "seoul-busan", p: 0.5 }]).size, full = stampsFromPasses([{ routeId: "seoul-busan", p: 1 }]).size;
  eq("멀리 갈수록 스탬프가 늘어남", half < full, true);
  eq("진행률 0이면 스탬프 없음", stampsFromPasses([{ routeId: "seoul-busan", p: 0 }]).size, 0);
  eq("첫 스탬프 배지", badgesFor(stampsFromPasses([{ routeId: "seoul-busan", p: 1 }])).find((b) => b.id === "first")!.got, true);
  eq("스탬프가 없으면 배지도 없음", badgesFor(new Set()).every((b) => !b.got), true);
  eq("이야기는 같은 편지면 늘 같음", JSON.stringify(storiesFor("abc", 325)), JSON.stringify(storiesFor("abc", 325)));
  eq("멀면 이야기 3개", storiesFor("abc", 325).length, 3);
  eq("가까우면 이야기 1개", storiesFor("abc", 50).length, 1);
  eq("너무 가까우면 이야기 없음", storiesFor("abc", 10).length, 0);
  eq("이야기 진행률 범위", storiesFor("q1", 325).every((s) => s.f >= 0.15 && s.f <= 0.85), true);
  eq("한 편지 안에서 이야기가 겹치지 않음", new Set(storiesFor("q2", 325).map((s) => s.story.id)).size, 3);
  eq("이야기 종류가 10가지 이상", STORY_POOL.length >= 10, true);
  let diff = 0; for (let i = 0; i < 20; i++) if (storiesFor(`id${i}`, 325)[0].story.id !== storiesFor(`id${i + 1}`, 325)[0].story.id) diff++;
  eq("편지마다 이야기가 다양함", diff >= 10, true);
  eq("진행 전엔 주운 물건 없음", collectItems([{ id: "x", km: 325, p: 0 }]).size, 0);
  eq("도착하면 물건을 주울 수 있음", [...collectItems(Array.from({ length: 30 }, (_, i) => ({ id: `z${i}`, km: 325, p: 1 }))).values()].reduce((a, b) => a + b, 0) > 0, true);
  const seoul = getPlace("seoul")!, busan = getPlace("busan")!, gangnam = getPlace("gangnam")!;
  eq("같은 동네 근처는 언제든 이동", canMoveHome(seoul, gangnam, 0).ok, true);
  eq("서울→부산을 10분 만에는 이동 불가", canMoveHome(seoul, busan, 10 / 60).ok, false);
  eq("서울→부산 1시간 뒤엔 이동 가능(비행기·KTX)", canMoveHome(seoul, busan, 1).ok, true);
  eq("기다려야 하는 분이 계산됨", canMoveHome(seoul, busan, 0).waitMinutes > 20, true);
  const T = Date.parse("2026-10-16T10:00:00+09:00");
  const mk = (n: number, key: string, at = T) => Array.from({ length: n }, (_, i) => ({ km: 300, toKey: key, at: at + i * 1000 }));
  eq("한 사람에게는 하루 2통만 반영", myStatsCapped(mk(5, "a")).count, PER_FRIEND_PER_DAY);
  eq("여러 사람에게 보내도 하루 8통까지만", myStatsCapped([...mk(5, "a"), ...mk(5, "b"), ...mk(5, "c"), ...mk(5, "d"), ...mk(5, "e")]).count, PER_DAY);
  eq("다음 날엔 다시 반영", myStatsCapped([...mk(3, "a"), ...mk(3, "a", T + 86400000)]).count, PER_FRIEND_PER_DAY * 2);
  eq("한도 안의 거리 합", myStatsCapped(mk(2, "a")).km, 600);
  const { buildThreads: bt } = await import("../core/threads");
  const fr = [{ uid: "U1", name: "새 친구" }];
  const sentA = [{ id: "a", to: "석영이", sentAt: 1 }, { id: "b", to: "새 친구", toUid: "U1", sentAt: 2 }];
  eq("정리 전에는 둘로 나뉨", bt(sentA, [], fr).length, 2);
  const merged = bt(sentA, [], fr, { alias: { "석영이": "U1" }, nick: { U1: "석영이" } });
  eq("합치면 한 사람(uid 기준)", merged.length, 1);
  eq("합친 방 이름은 내가 정한 이름", merged[0].name, "석영이");
  eq("합친 방에 편지 2통", merged[0].entries.length, 2);
  eq("받은 편지도 내가 정한 이름으로", bt([], [{ id: "r", fromUid: "U1", fromName: "새 친구", sentAt: 3 }], fr, { nick: { U1: "석영이" } })[0].name, "석영이");
  eq("내가 정한 이름으로 적어 보낸 새 편지도 같은 방", bt([{ id: "c", to: "석영이", sentAt: 4 }], [], fr, { nick: { U1: "석영이" } }).length, 1);
  // 같은 사람의 다른 계정
  const two = [{ uid: "A1", name: "창재" }, { uid: "A2", name: "창재" }];
  eq("이름이 같은 친구 계정 둘은 한 사람", bt([], [], two).length, 1);
  eq("기본 이름(새 친구) 둘은 저절로 합치지 않음", bt([], [], [{ uid: "B1", name: "새 친구" }, { uid: "B2", name: "새 친구" }]).length, 2);
  const sameB = bt([{ id: "s1", to: "새 친구", toUid: "B1", sentAt: 5 }], [], [{ uid: "B1", name: "새 친구" }, { uid: "B2", name: "새 친구" }], { same: { B2: "B1" }, nick: { B1: "석영이" } });
  eq("직접 합친 두 계정은 한 방", sameB.length, 1);
  eq("합친 방 이름은 내가 부르는 이름", sameB[0].name, "석영이");
  eq("합친 방에 두 계정이 모두 들어 있음", (sameB[0].uids ?? []).sort().join(), "B1,B2");
  const pick = bt([{ id: "s2", to: "x", toUid: "C1", sentAt: 1 }], [{ id: "r2", fromUid: "C2", fromName: "민지", sentAt: 9 }], [{ uid: "C1", name: "민지" }, { uid: "C2", name: "민지" }]);
  eq("보낼 계정은 최근에 편지를 보내 온 계정", pick[0].uid, "C2");
  eq("합친 방 이름은 진짜 이름(기본 이름보다 우선)", bt([], [{ id: "r3", fromUid: "D1", fromName: "석영", sentAt: 1 }], [{ uid: "D1", name: "새 친구" }])[0].name, "석영");
  const { uidTag, isUnnamed } = await import("../core/threads");
  const unn = bt([], [], [{ uid: "B1", name: "새 친구" }, { uid: "B2", name: "새 친구" }]);
  eq("이름 없는 친구는 '새 친구' 대신 번호로", unn.every((t) => t.name.startsWith("이름 없는 친구 ")), true);
  eq("이름 없는 두 친구의 이름이 서로 다름", unn[0].name !== unn[1].name, true);
  eq("표는 4글자", uidTag("abc").length, 4);
  eq("같은 계정은 늘 같은 표", uidTag("kakao:123"), uidTag("kakao:123"));
  let clash = 0; const seenT = new Set<string>(); for (let i = 0; i < 300; i++) { const t = uidTag(`u${i}`); if (seenT.has(t)) clash++; seenT.add(t); }
  eq("300명 중 표 겹침이 거의 없음", clash <= 1, true);
  eq("기본 이름은 이름 없음으로 봄", isUnnamed("새 친구") && isUnnamed("이름 없는 친구 2") && !isUnnamed("석영"), true);
  eq("이름 없는 친구 번호는 늘 같음", JSON.stringify(unn.map((t) => t.name).sort()), JSON.stringify(["이름 없는 친구 1", "이름 없는 친구 2"]));
  const { journeyOf, lapsText, MILESTONES } = await import("../core/journey");
  eq("0km는 첫 목적지 0%", journeyOf(0).pct, 0);
  eq("0km 다음 목적지는 한반도", journeyOf(0).next!.id, "korea");
  eq("1,000km는 아직 한반도 못 감", journeyOf(1000).reached.length, 0);
  eq("2,000km는 한반도 끝에서 끝 달성", journeyOf(2000).reached.map((m) => m.id).join(), "korea");
  eq("지구 한 바퀴 달성", journeyOf(40075).reached.some((m) => m.id === "earth"), true);
  eq("달 다음은 화성", journeyOf(400000).next!.id, "mars");
  eq("모두 넘으면 다음 없음", journeyOf(2e8).next, null);
  eq("모두 넘으면 100%", journeyOf(2e8).pct, 100);
  eq("이정표는 거리 순서", MILESTONES.every((m, i) => i === 0 || m.km > MILESTONES[i - 1].km), true);
  eq("지구 0.5바퀴", lapsText(20037.5), "0.5바퀴");
  eq("지구 1.5바퀴", lapsText(60112), "1.5바퀴");
  eq("0바퀴", lapsText(0), "0바퀴");
}


// GitHub 자동 작업 신분증(OIDC) 확인: 우리 저장소 main만 통과
{
  const { generateKeyPairSync, createSign: cs } = await import("node:crypto");
  const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
  const now = 1_800_000_000;
  const mk = (over: Record<string, unknown> = {}, kid = "k1") => {
    const h = Buffer.from(JSON.stringify({ alg: "RS256", kid })).toString("base64url");
    const b = Buffer.from(JSON.stringify({ iss: "https://token.actions.githubusercontent.com", aud: "bird-letter-rules", repository: "kianupark1/Bird-Letter", ref: "refs/heads/main", exp: now + 300, nbf: now - 10, ...over })).toString("base64url");
    return `${h}.${b}.${cs("RSA-SHA256").update(`${h}.${b}`).sign(privateKey).toString("base64url")}`;
  };
  const key = (kid: string) => (kid === "k1" ? publicKey : undefined);
  eq("OIDC: 우리 저장소 main 통과", verifyGithubOidc(mk(), key, now), true);
  eq("OIDC: 다른 저장소 거부", verifyGithubOidc(mk({ repository: "evil/Bird-Letter" }), key, now), false);
  eq("OIDC: 다른 브랜치 거부", verifyGithubOidc(mk({ ref: "refs/heads/claude/x" }), key, now), false);
  eq("OIDC: 다른 대상 거부", verifyGithubOidc(mk({ aud: "other" }), key, now), false);
  eq("OIDC: 다른 발급처 거부", verifyGithubOidc(mk({ iss: "https://evil.example" }), key, now), false);
  eq("OIDC: 만료 거부", verifyGithubOidc(mk({ exp: now - 1 }), key, now), false);
  eq("OIDC: 모르는 열쇠 거부", verifyGithubOidc(mk({}, "zz"), key, now), false);
  const [h, b, sg] = mk().split(".");
  const forged = Buffer.from(JSON.stringify({ ...JSON.parse(Buffer.from(b, "base64url").toString()), repository: "evil/x" })).toString("base64url");
  eq("OIDC: 내용 바꾼 위조 거부", verifyGithubOidc(`${h}.${forged}.${sg}`, key, now), false);
  eq("OIDC: 엉터리 글자 거부", verifyGithubOidc("abc", key, now), false);
}


// 같은 사람 찾기: 이름 없는 계정에 내가 "석영이"라고 적어 보낸 적이 있으면 "석영" 친구와 한 사람
{
  const { buildThreads: bt, nameKey: nk, visibleThreads: vt } = await import("../core/threads.ts");
  eq("이름 비교: 석영이=석영", nk("석영이"), nk("석영"));
  eq("이름 비교: 지민님=지민", nk("지민님"), "지민");
  eq("이름 비교: 두 글자는 그대로(민이)", nk("민이"), "민이");
  const fr = [{ uid: "kakao:1", name: "석영" }, { uid: "anonA", name: "" }, { uid: "anonB", name: "" }];
  const sent = [
    { id: "s1", to: "석영이", toUid: "anonA", sentAt: 100 },
    { id: "s2", to: "이름 없는 친구 2", toUid: "anonB", sentAt: 200 },
    { id: "s3", to: "석영이", sentAt: 300 },
  ];
  const th = bt(sent, [], fr, {});
  const sy = th.find((x) => x.uids?.includes("kakao:1"))!;
  eq("이름 단서로 합침: 석영 방에 anonA 포함", sy.uids?.includes("anonA"), true);
  eq("이름만 적은 '석영이' 편지도 석영 방으로", sy.entries.some((e) => e.item.id === "s3"), true);
  eq("단서 없는 anonB는 따로(이름 없는 친구)", th.some((x) => x.uids?.includes("anonB") && x.name.startsWith("이름 없는 친구")), true);
  eq("석영 방 이름은 진짜 이름", sy.name, "석영");
  const vis = vt([{ key: "a", lastAt: 100 }, { key: "b", lastAt: 300 }], { a: "150", b: "150" });
  eq("나간 방은 숨김, 그 뒤 새 편지가 오면 다시 보임", vis.map((x) => x.key).join(), "b");
}


// 펜팔: 이름·연락처 가리기·상대 고르기
{
  const { penpalName: pn, maskContacts: mk, pickPenpal: pick, cityOf: co, cityLabel: cl } = await import("../core/penpal.ts");
  eq("펜팔 이름", pn("부산", "crane"), "부산 사는 두루미");
  eq("서울의 구는 서울로", co("gangnam"), "seoul");
  eq("도시는 그대로", co("suwon"), "suwon");
  eq("도시 이름", cl("seoul") + "," + cl("busan"), "서울,부산");
  const m1 = mk("제 번호는 010-1234-5678 이에요");
  eq("전화번호 가림", m1.text.includes("5678"), false); eq("가린 개수", m1.masked, 1);
  eq("붙여 쓴 번호도", mk("01012345678로 연락").text.includes("1234"), false);
  eq("이메일", mk("메일 abc@naver.com").text.includes("naver"), false);
  eq("링크", mk("https://instagram.com/xx 봐").text.includes("instagram"), false);
  eq("@아이디", mk("인스타 @bird_letter 팔로우").text.includes("bird_letter"), false);
  eq("카톡 아이디", mk("카톡 아이디: sky123").text.includes("sky123"), false);
  eq("평범한 글은 그대로", mk("오늘 날씨가 좋아서 2시에 산책했어요").text, "오늘 날씨가 좋아서 2시에 산책했어요");
  eq("평범한 글은 가린 것 없음", mk("책을 3권 읽었어요").masked, 0);
  const pool = [{ uid: "me", tags: ["book"], region: "서울" }, { uid: "a", tags: ["music"], region: "부산" }, { uid: "b", tags: ["book"], region: "대구" }, { uid: "c", tags: [], region: "제주" }];
  eq("관심사 겹치는 사람 우선", pick(pool, "me", new Set(), ["book"], () => 0)?.uid, "b");
  eq("나·넘긴 사람 제외", pick(pool, "me", new Set(["b"]), ["book"], () => 0)?.uid, "a");
  const { penpalRoute: pr } = await import("../core/penpal.ts");
  eq("펜팔 노선: 서울→부산", pr("seoul", "busan"), "seoul-busan");
  eq("펜팔 노선: 같은 도시면 다른 지역", pr("seoul", "seoul").split("-")[0] !== pr("seoul", "seoul").split("-")[1], true);
  eq("아무도 없으면 null", pick([{ uid: "me", tags: [], region: "서울" }], "me", new Set(), [], () => 0), null);
}


// 같은 이름 방 마지막 합치기: 친구 목록에 없는 계정(예: 끊은 계정)이라도 이름이 같으면 한 줄
{
  const { buildThreads: bt } = await import("../core/threads.ts");
  const th = bt([
    { id: "x1", to: "창재", toUid: "old1", sentAt: 100 },
    { id: "x2", to: "창재", toUid: "kakao:9", sentAt: 200 },
    { id: "x3", to: "창재", sentAt: 300 },
  ], [], [{ uid: "kakao:9", name: "창재" }], {});
  eq("같은 이름 창재는 한 줄", th.filter((x) => x.name === "창재").length, 1);
  eq("편지 3통 모두 한 방", th.find((x) => x.name === "창재")!.entries.length, 3);
  eq("대표는 친구 계정", th.find((x) => x.name === "창재")!.key, "u:kakao:9");
}


// 보낼 계정은 지금 친구인 계정(예전 계정에 더 최근에 보냈어도)
{
  const { buildThreads: bt } = await import("../core/threads.ts");
  const th = bt([
    { id: "y1", to: "석영이", toUid: "kakao:5", sentAt: 100 },
    { id: "y2", to: "석영이", toUid: "anonOld", sentAt: 900 },
  ], [], [{ uid: "kakao:5", name: "석영" }], {});
  const one = th.filter((x) => x.entries.length);
  eq("석영 한 줄", one.length, 1);
  eq("보낼 계정은 친구 계정", one[0].uid, "kakao:5");
}


// 쉬어 가며 날기: SLOW_SINCE 뒤 편지는 3배·최소 1시간, 그 전 편지는 그대로
{
  const { totalMinutes: tm, SLOW_SINCE: S, speedFactor: sf, rollMishap: rm } = await import("../core/flight.ts");
  const id = "slowtest01", t = S + 1000, f = sf(id, "pigeon", t), mi = rm(id, "pigeon", t);
  near("새 편지는 3배", tm(id, "pigeon", 325, t), ((325 / (65 * f)) * 60 * 3) * (1 + (mi ? mi.delayFrac : 0)), 0.001);
  eq("가까운 곳도 최소 1시간(새 성격 전)", tm("near01", "hawk", 4, t) >= 60, true);
  const { TIER_SINCE: T } = await import("../core/flight.ts");
  const nm = tm("near01", "hawk", 4, T + 1000);
  eq("새 성격 뒤: 가까운 매는 10분쯤(사고 없을 때)", nm >= 10 && nm < 20, true);
  eq("새 성격 뒤: 가까운 까치는 하루 이상", tm("near02", "magpie", 4, T + 1000) >= 1440, true);
  const old = S - 86400e3, f0 = sf(id, "pigeon", old), m0 = rm(id, "pigeon", old);
  near("예전 편지는 그대로", tm(id, "pigeon", 325, old), ((325 / (65 * f0)) * 60) * (1 + (m0 ? m0.delayFrac : 0)), 0.001);
}

// 새가 보내는 엽서: 편지 ID로 정해지고, 명소에서만, 먼 곳은 2장
{
  const { postcardsFor, collectPostcards } = await import("../core/postcards.ts");
  const a = postcardsFor("pc1", "seoul-busan");
  eq("엽서는 같은 편지면 늘 같음", JSON.stringify(a), JSON.stringify(postcardsFor("pc1", "seoul-busan")));
  eq("먼 곳(325km)은 엽서 2장", a.length, 2);
  const r = getRoute("seoul-busan");
  eq("엽서는 출발·도착이 아닌 명소에서", a.every((c) => c.place !== r.points[0].name && c.place !== r.points[r.points.length - 1].name && c.f > 0 && c.f < 1), true);
  eq("엽서 문구에 명소 이름", a.every((c) => c.text.includes(c.place) && !c.text.includes("{")), true);
  eq("진행률 순서", a[0].f <= a[1].f, true);
  eq("지나기 전에는 도감에 없음", collectPostcards([{ id: "pc1", routeId: "seoul-busan", p: 0 }]).size, 0);
  eq("도착하면 엽서 2장 모임", collectPostcards([{ id: "pc1", routeId: "seoul-busan", p: 1, birdId: "crane" }]).size, 2);
  let diff = 0; for (let i = 0; i < 20; i++) if (postcardsFor(`x${i}`, "seoul-busan")[0].text !== postcardsFor(`x${i + 1}`, "seoul-busan")[0].text) diff++;
  eq("편지마다 엽서가 달라짐", diff > 3, true);
}

console.log(`핵심 계산 시험: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
