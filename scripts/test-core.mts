// 핵심 계산 단위 시험: npm run test:core
// 한국어 조사, 하버사인 거리, 새별 도착 시간 계산이 의도대로인지 확인합니다.
import { withIGa, withEulReul } from "../core/korean.ts";
import { haversineKm, travelMinutes, formatMinutes } from "../core/geo.ts";
import { BIRDS } from "../core/birds.ts";
import { ROUTES, getRoute, routePosition, makeRoute } from "../core/routes.ts";
import { PLACES, nearestPlace, getPlace } from "../core/places.ts";
import { searchPlaces, choseong } from "../core/placeSearch.ts";
import { validateDepart, isScheduled, toInputValue, fromInputValue, dateTimeText, MAX_SCHEDULE_DAYS } from "../core/schedule.ts";
import { MAX_PHOTOS, MAX_PHOTO_CHARS } from "../core/limits.ts";
import { MAX_LETTER_CHARS } from "../core/limits.ts";
import { validateSchedule, dedupKey, MAX_AHEAD_MS } from "../core/pushPayload.ts";
import { generateKeyPairSync, createVerify, createSign } from "node:crypto";
import { createCustomToken, createAccessAssertion, verifyFirebaseIdToken, parseServiceAccount } from "../core/serverAuth.ts";
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

console.log(`핵심 계산 시험: 통과 ${pass} / 실패 ${fail}`);
process.exit(fail ? 1 : 0);
