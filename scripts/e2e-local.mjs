// 사진(폴라로이드)·두루마리·예약 발송 화면 시험: 서버 없이 "내 폰 저장" 방식으로 돌려요.
// 실행: npm run build && npx next start -p 3120 & 그다음  node scripts/e2e-local.mjs http://localhost:3120
// (환경 변수에 Firebase 설정이 없을 때만 이 방식으로 동작해요. 서버 연결 시험은 scripts/e2e.mjs)
import { createRequire } from "node:module";
import { deflateSync, crc32 } from "node:zlib";
const { chromium } = createRequire(import.meta.url)("playwright");
const BASE = process.argv[2] || "http://localhost:3000";

/** 작은 PNG 사진을 직접 만들어요(그라데이션) */
function png(w, h, f) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = f(x / w, y / h); const i = y * (w * 3 + 1) + 1 + x * 3; raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const photos = [
  { name: "봄.png", mimeType: "image/png", buffer: png(1600, 1200, (u, v) => [Math.round(255 * u), Math.round(180 * v) + 40, 160]) },
  { name: "바다.png", mimeType: "image/png", buffer: png(900, 1400, (u, v) => [60, Math.round(120 + 100 * v), Math.round(200 - 60 * u)]) },
];

let pass = 0, fail = 0;
const ok = (label, cond, extra = "") => { if (cond) { pass++; console.log("  ✓", label); } else { fail++; console.log("  ✗", label, extra); } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 390, height: 820 }, acceptDownloads: true });
const p = await ctx.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await p.addInitScript(() => localStorage.setItem("saepyeonji.onboarded.v1", "1"));

async function writeLetter({ to, bird, text, files = [], later = false }) {
  await p.goto(`${BASE}/send?test=1`);
  await p.fill("input[placeholder='받는 사람 이름']", to);
  await p.click("text=다음: 새 고르기");
  await p.click(`text=${bird} >> nth=0`);
  await p.click("text=이 새로 보낼게요");
  await p.fill("textarea", text);
  if (files.length) { await p.setInputFiles("#photo-input", files); await p.waitForSelector(".thumb", { timeout: 15000 }); }
  if (later) await p.click("text=정한 때에 출발");
}

console.log("[1] 사진 두 장과 함께 보내기 → 두루마리로 펼치기");
await writeLetter({ to: "민지", bird: "매", text: "봄 사진을 폴라로이드로 보내요.", files: photos });
ok("사진 두 장이 폴라로이드 모양으로 담김", (await p.$$(".thumb")).length === 2);
await p.click("text=로 보내기");
await p.waitForURL(/\/room/);
await p.waitForSelector(".ch-feed");
ok("보낸 뒤 대화방에 내 말풍선이 '비행 중'으로 보임", (await p.$eval(".ch-letter.me", (e) => e.innerText)).includes("비행 중"));
ok("도착 전에는 두루마리가 보이지 않음", (await p.$(".scroll-open")) === null);
await p.waitForFunction(() => document.querySelector(".ch-letter.me")?.textContent?.includes("도착 ✓"), null, { timeout: 120000 });
ok("도착하면 말풍선이 '도착 ✓'로 바뀜", true);
await p.click(".ch-letter.me .ch-tap");
await p.waitForSelector(".scroll-open", { timeout: 20000 });
ok("눌러서 그 자리에서 말린 두루마리와 '편지 펼치기'가 보임", true);
ok("펼치면 비행 기록(출발·도착)이 보임", (await p.$eval(".ch-log", (e) => e.innerText)).includes("출발했어요") && (await p.$eval(".ch-log", (e) => e.innerText)).includes("도착했어요"));
ok("펼치기 전에는 편지 글이 보이지 않음", !(await p.$eval(".reveal", (e) => e.innerText)).includes("봄 사진을"));
await p.click(".scroll-open");
await p.waitForTimeout(8000);
const txt = await p.$eval(".reveal", (e) => e.innerText);
ok("펼친 뒤 편지 글이 보임", txt.includes("봄 사진을 폴라로이드로 보내요"));
ok("사진 두 장이 폴라로이드로 보임", (await p.$$(".polaroid")).length === 2);
const dl = p.waitForEvent("download", { timeout: 10000 }).catch(() => null);
await p.click(".pol-save >> nth=0");
const d = await dl;
ok("폴라로이드를 폰에 저장(파일 내려받기)", !!d);

console.log("[1-2] 스탬프 도감과 내 동네");
await p.goto(BASE + "/stamps");
await p.waitForSelector(".stamps");
ok("스탬프 도감에 명소가 보임", (await p.$$(".stp")).length > 40);
ok("편지를 보낸 뒤 스탬프가 1개 이상 찍힘", (await p.$$(".stp.got")).length >= 1);
ok("배지 칸이 보임", (await p.$$(".badge")).length >= 5);
await p.goto(BASE + "/settings");
await p.waitForSelector("#home-place");
ok("내 동네 카드와 친구에게 알리기 스위치", (await p.$eval("main", (e) => e.innerText)).includes("친구에게 내 동네 알리기"));
await p.selectOption("#home-place", "busan");
await p.waitForTimeout(300);
ok("처음 정하는 동네 이동은 제한 없음", (await p.$eval("#home-place", (e) => e.value)) === "busan");
await p.selectOption("#home-place", "seoul");
await p.waitForTimeout(300);
ok("부산에서 서울로 바로 옮기면 안내가 나옴", (await p.$eval("main", (e) => e.innerText)).includes("뒤에 바꿀 수 있어요"));
ok("막힌 이동은 동네가 그대로", (await p.$eval("#home-place", (e) => e.value)) === "busan");

await p.goto(BASE + "/rank");
await p.waitForSelector(".goalcard");
ok("랭킹에 지구 몇 바퀴·다음 목적지(우주 여행)가 보임", (await p.$eval(".goalcard", (e) => e.innerText)).includes("지구") && (await p.$eval(".goalcard", (e) => e.innerText)).includes("한반도"));

console.log("[2] 예약 발송: 입력 확인, 목록 표시, 취소");
await writeLetter({ to: "엄마", bird: "두루미", text: "생일 축하해요", later: true });
await p.waitForSelector("#depart-at");
await p.fill("#depart-at", "2020-01-01T09:00");
ok("과거 시각이면 안내가 나오고 버튼이 꺼짐", (await p.$eval(".schedule .hint", (e) => e.textContent)).includes("1분 이상") && (await p.$eval(".dock .cta", (e) => e.disabled)));
const future = await p.evaluate(() => { const d = new Date(Date.now() + 2 * 86400000); const z = (n) => String(n).padStart(2, "0"); return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}T09:00`; });
await p.fill("#depart-at", future);
ok("올바른 시각이면 '예약하고 보내기'", (await p.$eval(".dock .cta", (e) => e.textContent)).includes("예약하고 보내기"));
await p.click(".dock .cta");
await p.waitForURL(/\/room/);
await p.waitForSelector(".ch-feed");
ok("대화방에 예약 편지가 '출발 예정'으로 보임", (await p.$eval(".ch-feed", (e) => e.innerText)).includes("출발 예정"));
await p.goto(BASE + "/");
await p.waitForTimeout(1000);
ok("홈에 '출발 예정'가 보임", (await p.$eval("main", (e) => e.innerText)).includes("출발 예정"));
await p.click(".krow >> nth=0");
await p.waitForURL(/\/room/);
await p.click(".ch-letter >> nth=0");
await p.waitForURL(/\/letter/);
await p.click("text=예약 취소하기");
await p.click("text=취소할게요");
await p.waitForURL(`${BASE}/`);
await p.waitForTimeout(800);
ok("취소하면 홈에서 사라짐", !(await p.$eval("main", (e) => e.innerText)).includes("출발 예정"));

ok("화면에 스크립트 오류가 없음", errors.length === 0, errors.join(" | "));
console.log(`\n결과: 통과 ${pass} / 실패 ${fail}`);
await browser.close();
process.exit(fail ? 1 : 0);
