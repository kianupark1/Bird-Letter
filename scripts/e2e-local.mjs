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

console.log("[0] 처음 쓰는 사람: 편지 쓰기 → 누구에게? → 대화방에서 바로 쓰기");
await p.goto(BASE + "/");
await p.click("text=✉ 편지 쓰기");
await p.waitForURL(/\/write/);
ok("편지 쓰기를 누르면 '누구에게 보낼까요?' 한 화면", (await p.$eval("main", (e) => e.innerText)).includes("누구에게 보낼까요?"));
await p.fill("input[name=name]", "할머니");
await p.click("text=‘할머니’에게 쓰기");
await p.waitForURL(/\/room\?n=/);
await p.waitForSelector(".ch-in");
ok("처음 쓰는 이름도 빈 대화방이 바로 열림", (await p.$eval(".roomhead", (e) => e.innerText)).includes("할머니"));
await p.fill(".ch-in", "할머니 보고 싶어요");
await p.click(".ch-go", { force: true });
await p.waitForSelector("#to-place");
await p.click("#to-place");
await p.click(".pf-opt[data-place=busan] >> nth=0");
await p.click("text=이 길로 할게요");
await p.click(".ch-go", { force: true });
await p.waitForSelector(".ch-letter.me", { timeout: 15000 });
ok("대화방 안에서 쓰고 ➤ 누르면 바로 날아감", (await p.$eval(".ch-letter.me", (e) => e.innerText)).includes("할머니 보고 싶어요"));
await p.goto(BASE + "/write");
await p.fill("input[name=name]", "ㅎㅁ");
await p.waitForTimeout(200);
ok("다음에는 초성만 쳐도 아는 사람으로 나옴", (await p.$eval("main", (e) => e.innerText)).includes("할머니"));
await p.evaluate(() => { localStorage.removeItem("saepyeonji.letters.v1"); });

console.log("[1] 사진 두 장과 함께 보내기 → 메신저처럼 바로 보임");
await writeLetter({ to: "민지", bird: "매", text: "봄 사진을 폴라로이드로 보내요.", files: photos });
ok("사진 두 장이 폴라로이드 모양으로 담김", (await p.$$(".thumb")).length === 2);
await p.click("text=로 보내기");
await p.waitForURL(/\/room/);
await p.waitForSelector(".ch-feed");
ok("보낸 뒤 대화방에 내 말풍선이 '비행 중'으로 보임", (await p.$eval(".ch-letter.me", (e) => e.innerText)).includes("비행 중"));
ok("내 편지는 쓴 글이 말풍선에 바로 보임", (await p.$eval(".ch-letter.me", (e) => e.innerText)).includes("봄 사진을 폴라로이드로 보내요."));
ok("내 편지 사진 두 장이 말풍선에 작게 보임", (await p.$$(".ch-letter.me .ch-thumbs img")).length === 2);
ok("내 편지에는 두루마리가 없음", (await p.$(".scroll-open")) === null);
await p.waitForFunction(() => document.querySelector(".ch-letter.me")?.textContent?.includes("도착 ✓"), null, { timeout: 120000 });
ok("도착하면 말풍선이 '도착 ✓'로 바뀜", true);
await p.click(".ch-letter.me .ch-tap");
await p.waitForSelector(".ch-log", { timeout: 20000 });
ok("누르면 비행 기록(출발·도착)이 보임", (await p.$eval(".ch-log", (e) => e.innerText)).includes("출발했어요") && (await p.$eval(".ch-log", (e) => e.innerText)).includes("도착했어요"));

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
await p.waitForSelector(".rankpage");
await p.waitForTimeout(500);
ok("랭킹에 우주 여행 카드가 없고 순위만 보임", !(await p.$(".goalcard")) && (await p.$eval("main", (e) => e.innerText)).includes("누적 거리"));

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
