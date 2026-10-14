// 새 기능을 실제 서버로 시험: 사진 두 장, 답장, 예약(출발 전 받는 사람에게 안 보임)과 취소.
// 실행: node scripts/e2e-features.mjs [주소]   (기본은 공개 사이트. Firebase 규칙을 먼저 게시해야 통과해요)
// 시험 편지는 끝에 삭제합니다. 화면 캡처는 qa-output/ 에 저장됩니다(Git 제외).
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";
import { writeFileSync } from "node:fs";
import { deflateSync, crc32 } from "node:zlib";
import { tmpdir } from "node:os";
import { join } from "node:path";

const BASE = (process.argv[2] ?? "https://bird-letter.vercel.app").replace(/\/$/, "");
const EDGE = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome", // GitHub 서버(리눅스)
  "/usr/bin/chromium",
  "/usr/bin/chromium-browser",
].find(existsSync);
if (!EDGE) throw new Error("Edge/Chrome을 찾을 수 없어요");
mkdirSync("qa-output", { recursive: true });

let pass = 0, fail = 0;
const ok = (label, cond, detail = "") => { if (cond) { pass++; console.log("  ✓ " + label); } else { fail++; console.log("  ✗ " + label + (detail ? "  → " + detail : "")); } };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const text = (page) => page.evaluate(() => document.body.innerText);
async function waitText(page, needle, ms = 20000) {
  const end = Date.now() + ms;
  while (Date.now() < end) { if ((await text(page)).includes(needle)) return true; await sleep(400); }
  return false;
}
async function clickText(page, label, sel = "button, a") {
  const done = await page.evaluate((label, sel) => {
    const el = [...document.querySelectorAll(sel)].find((e) => e.textContent.trim().includes(label));
    if (el) el.click();
    return !!el;
  }, label, sel);
  if (!done) throw new Error(`"${label}" 버튼을 찾지 못함`);
}
async function setValue(page, sel, value) {
  await page.$eval(sel, (el, v) => {
    const proto = el.tagName === "TEXTAREA" ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    Object.getOwnPropertyDescriptor(proto, "value").set.call(el, v);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }, value);
}
async function newUser(browser, nickname) {
  const ctx = await browser.createBrowserContext(); // 저장소가 완전히 분리된 새 사용자
  const page = await ctx.newPage();
  await page.setViewport({ width: 375, height: 812, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.evaluateOnNewDocument((nick) => {
    try {
      if (!localStorage.getItem("saepyeonji.onboarded.v1")) {
        localStorage.setItem("saepyeonji.onboarded.v1", "1");
        localStorage.setItem("saepyeonji.profile.v1", JSON.stringify({ nickname: nick, notify: { arrival: true, passing: false, reply: true } }));
      }
    } catch {}
  }, nickname);
  page.on("dialog", (d) => d.accept()); // 확인창은 모두 "확인"
  const errors = [];
  page.on("pageerror", (e) => errors.push(String(e.message || e)));
  page.on("console", (m) => { if (m.type() === "warning" && m.text().includes("서버에 연결하지 못해")) errors.push("서버 연결 실패로 내 폰 저장으로 전환됨"); });
  return { ctx, page, errors };
}
const shot = (page, name) => page.screenshot({ path: `qa-output/${name}.png` });


/** 작은 PNG 사진을 직접 만들어 임시 파일로 저장 */
function png(path, w, h, f) {
  const raw = Buffer.alloc((w * 3 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const [r, g, b] = f(x / w, y / h); const i = y * (w * 3 + 1) + 1 + x * 3; raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; }
  const chunk = (t, d) => { const len = Buffer.alloc(4); len.writeUInt32BE(d.length); const td = Buffer.concat([Buffer.from(t), d]); const c = Buffer.alloc(4); c.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  writeFileSync(path, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]));
  return path;
}
const P1 = png(join(tmpdir(), "e2e-spring.png"), 1200, 900, (u, v) => [Math.round(255 * u), Math.round(180 * v) + 40, 160]);
const P2 = png(join(tmpdir(), "e2e-sea.png"), 800, 1200, (u, v) => [60, Math.round(120 + 100 * v), Math.round(200 - 60 * u)]);

const MESSAGE = "기능 시험 편지예요(사진 두 장).";
const REPLY = "기능 시험 답장이에요.";
const SECRET = "예약 시험 비밀 내용";

async function writeLetter(page, { to, text, files = [], later = null, bird = "매" }) {
  await setValue(page, "input.field", to);
  if (await page.$("#from-place")) {
    await page.click("#from-place"); await page.click('[role=option][data-place="seoul"]');
    await page.click("#to-place"); await page.click('[role=option][data-place="jeju"]');
  }
  await clickText(page, "다음: 새 고르기");
  await clickText(page, bird, "button.card");
  await clickText(page, "다음: 편지 쓰기");
  await setValue(page, "textarea", text);
  if (files.length) {
    const input = await page.$("#photo-input");
    await input.uploadFile(...files);
    await page.waitForFunction((n) => document.querySelectorAll(".thumb").length >= n, { timeout: 20000 }, files.length);
  }
  if (later) {
    await clickText(page, "정한 때에 출발");
    await page.waitForSelector("#depart-at");
    await setValue(page, "#depart-at", later);
  }
  await clickText(page, later ? "예약하고 보내기" : "보내기");
  await page.waitForFunction(() => location.pathname.startsWith("/letter/"), { timeout: 30000 }).catch(() => {});
  return new URL(page.url()).pathname.split("/").pop();
}
const localInput = (ms) => { const d = new Date(Date.now() + ms - new Date().getTimezoneOffset() * 60000); return d.toISOString().slice(0, 16); };

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--no-sandbox"] });
const started = Date.now();
console.log(`대상: ${BASE}\n`);
let A, B;
try {
  A = await newUser(browser, "지민");
  B = await newUser(browser, "수진");

  console.log("[1] 사진 두 장 편지 보내기(A)");
  await A.page.goto(`${BASE}/send?test=1`, { waitUntil: "networkidle2" });
  const id = await writeLetter(A.page, { to: "수진", text: MESSAGE, files: [P1, P2] });
  ok("사진 편지가 서버에 저장됨(편지 ID 20자)", id.length === 20, `ID=${id}`);
  await shot(A.page, "f1-A-photo-sent");

  console.log("\n[2] 받는 사람(B): 도착 뒤 펼치기");
  await B.page.goto(`${BASE}/letter/${id}`, { waitUntil: "networkidle2" });
  ok("B에게 편지가 보임", await waitText(B.page, "지민이 보낸 편지", 25000));
  ok("도착 전에는 편지 글이 보이지 않음", !(await text(B.page)).includes(MESSAGE));
  ok("도착하면 '편지 펼치기'가 나타남", await waitText(B.page, "편지 펼치기", 90000));
  await clickText(B.page, "편지 펼치기");
  ok("펼치면 편지 글이 보임", await waitText(B.page, MESSAGE, 15000));
  const shots = await B.page.waitForFunction(() => document.querySelectorAll(".polaroid").length >= 2, { timeout: 30000 }).then(() => true).catch(() => false);
  ok("폴라로이드 사진 두 장이 보임", shots);
  await shot(B.page, "f2-B-opened");

  console.log("\n[3] 답장(B → A)");
  ok("'답장하기'가 보임", (await text(B.page)).includes("답장하기"));
  await B.page.goto(`${BASE}/send?reply=${id}&test=1`, { waitUntil: "networkidle2" });
  ok("답장 안내(지민님이 보낸 편지에 답장)가 보임", await waitText(B.page, "지민님이 보낸 편지에 답장해요", 20000));
  const rid = await writeLetter(B.page, { to: "지민", text: REPLY });
  ok("답장이 서버에 저장됨", rid.length === 20 && rid !== id, `ID=${rid}`);
  await A.page.goto(`${BASE}/letter/${rid}`, { waitUntil: "networkidle2" });
  ok("A에게 답장이 도착함('편지 펼치기'가 나타남)", await waitText(A.page, "편지 펼치기", 90000));
  await clickText(A.page, "편지 펼치기");
  ok("A가 펼치면 답장 글이 보임", await waitText(A.page, REPLY, 15000));
  await shot(A.page, "f3-A-reply");

  console.log("\n[4] 예약 발송: 출발 전에는 받는 사람에게 안 보임");
  await A.page.goto(`${BASE}/send?test=1`, { waitUntil: "networkidle2" });
  const sid = await writeLetter(A.page, { to: "수진", text: SECRET, later: localInput(3 * 60 * 1000), bird: "제비" });
  ok("예약 편지가 서버에 저장됨", sid.length === 20, `ID=${sid}`);
  ok("A에게는 '출발해요' 안내가 보임", await waitText(A.page, "출발해요", 20000));
  await shot(A.page, "f4-A-scheduled");
  await B.page.goto(`${BASE}/letter/${sid}`, { waitUntil: "networkidle2" });
  await sleep(4000);
  const t = await text(B.page);
  ok("출발 전 B에게 내용이 보이지 않음", !t.includes(SECRET));
  ok("출발 전 B에게 보낸 사람 정보도 보이지 않음", !t.includes("지민이 보낸 편지"), t.slice(0, 80).replace(/\n/g, " "));
  await shot(B.page, "f4-B-scheduled-hidden");
  await clickText(A.page, "예약 취소하기");
  await clickText(A.page, "취소할게요");
  await A.page.waitForFunction(() => location.pathname === "/", { timeout: 20000 }).catch(() => {});
  ok("예약을 취소하면 홈으로 돌아가고 목록에서 사라짐", (await A.page.evaluate(() => location.pathname)) === "/" && !(await text(A.page)).includes("출발을 기다리는 편지"));

  console.log("\n[5] 정리(시험 데이터 삭제)와 오류 점검");
  for (const U of [A, B]) {
    await U.page.goto(`${BASE}/settings`, { waitUntil: "networkidle2" });
    await waitText(U.page, "내 편지와 데이터 모두 삭제", 20000);
    await clickText(U.page, "내 편지와 데이터 모두 삭제");
    await U.page.waitForFunction(() => location.pathname === "/", { timeout: 40000 }).catch(() => {});
  }
  ok("A 화면에 서버 연결 실패·스크립트 오류 없음", A.errors.length === 0, A.errors.join(" | "));
  ok("B 화면에 서버 연결 실패·스크립트 오류 없음", B.errors.length === 0, B.errors.join(" | "));
} catch (e) {
  fail++;
  console.log("  ✗ 시험이 중간에 멈춤 → " + (e.message || e));
  for (const [n, U] of [["A", A], ["B", B]]) { if (U) await shot(U.page, `f-error-${n}`).catch(() => {}); }
} finally {
  await browser.close();
}

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}  (${Math.round((Date.now() - started) / 1000)}초)`);
process.exit(fail ? 1 : 0);
