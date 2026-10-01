// 처음부터 끝까지 사람 두 명이 쓰는 흐름 자동 시험: node scripts/e2e.mjs [주소]
// 기본 주소는 공개 사이트. 내 컴퓨터에서 켜 둔 앱을 시험하려면: node scripts/e2e.mjs http://localhost:3000
// 보내는 사람(A)과 받는 사람(B)을 서로 저장소가 분리된 두 브라우저로 흉내 냅니다. 시험 편지는 끝에 삭제합니다.
// 화면 캡처는 qa-output/ 에 저장됩니다(Git에 올라가지 않음).
import { mkdirSync } from "node:fs";
import { existsSync } from "node:fs";
import puppeteer from "puppeteer-core";

const BASE = (process.argv[2] ?? "https://bird-letter.vercel.app").replace(/\/$/, "");
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Google/Chrome/Application/chrome.exe"].find(existsSync);
if (!EDGE) throw new Error("Edge/Chrome을 찾을 수 없어요");
mkdirSync("qa-output", { recursive: true });

const MESSAGE = "자동 시험 편지예요. 도착 전에는 보이면 안 돼요.";
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

const browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--no-sandbox"] });
const started = Date.now();
console.log(`대상: ${BASE}\n`);

try {
  const A = await newUser(browser, "지민");
  const B = await newUser(browser, "수진");

  console.log("[1] 보내는 사람(A): 편지 쓰기");
  await A.page.goto(`${BASE}/send?test=1`, { waitUntil: "networkidle2" });
  ok("편지 쓰기 첫 화면이 열림", await waitText(A.page, "누구에게, 어디로 보낼까요?"));
  await shot(A.page, "01-A-send-step1");
  await setValue(A.page, "input.field", "엄마");
  await clickText(A.page, "서울 → 제주");
  await clickText(A.page, "다음: 새 고르기");
  await clickText(A.page, "매", "button.card");
  await shot(A.page, "02-A-send-step2");
  await clickText(A.page, "다음: 편지 쓰기");
  await setValue(A.page, "textarea", MESSAGE);
  await shot(A.page, "03-A-send-step3");
  await clickText(A.page, "보내기");
  await A.page.waitForFunction(() => location.pathname.startsWith("/letter/"), { timeout: 30000 }).catch(() => {});
  const id = new URL(A.page.url()).pathname.split("/").pop();
  ok("편지가 서버에 저장됨(편지 ID 20자)", id.length === 20, `ID=${id}`);
  ok("여정 화면에 '도착까지'와 '링크 보내기'가 보임", (await waitText(A.page, "도착까지")) && (await text(A.page)).includes("받는 사람에게 링크 보내기"));
  await shot(A.page, "04-A-journey");

  console.log("\n[2] 받는 사람(B): 링크로 열기");
  await B.page.goto(`${BASE}/letter/${id}`, { waitUntil: "networkidle2" });
  ok("B에게 '지민이 보낸 편지'로 보임", await waitText(B.page, "지민이 보낸 편지", 25000));
  const beforeArrival = await text(B.page);
  ok("도착 전에는 편지 내용이 보이지 않음", !beforeArrival.includes(MESSAGE));
  ok("도착 전 안내 문구가 보임", beforeArrival.includes("도착 시각이 지나야 열려요") || beforeArrival.includes("편지가 도착했어요"));
  await shot(B.page, "05-B-before-arrival");

  console.log("\n[3] 도착 후");
  const arrived = await waitText(B.page, MESSAGE, 90000);
  ok("도착 시각이 지나면 B에게 편지 내용이 열림", arrived);
  await shot(B.page, "06-B-arrived");
  ok("도착 화면 문구가 보임", (await text(B.page)).includes("도착했어요"));

  console.log("\n[4] 받는 사람: 신고와 차단");
  await clickText(B.page, "신고하기");
  ok("신고가 접수됨", await waitText(B.page, "신고가 접수됐어요", 10000));
  await clickText(B.page, "이 사람 차단");
  ok("차단됨", await waitText(B.page, "차단했어요", 10000));
  await B.page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  ok("차단한 사람의 편지는 받은 편지함에서 사라짐", await waitText(B.page, "아직 받은 편지가 없어요", 15000));
  await shot(B.page, "07-B-home-after-block");

  console.log("\n[5] 보내는 사람: 홈과 삭제");
  await A.page.goto(`${BASE}/`, { waitUntil: "networkidle2" });
  ok("A의 홈에 보낸 편지가 보임(서버에서 다시 불러옴)", await waitText(A.page, "엄마에게", 20000));
  await shot(A.page, "08-A-home");
  await A.page.goto(`${BASE}/settings`, { waitUntil: "networkidle2" });
  ok("설정에 '보낸 편지 1'이 보임", await waitText(A.page, "보낸 편지", 15000));
  ok("서버 연결 확인 뒤 삭제 버튼 이름이 바뀜", await waitText(A.page, "내 편지와 데이터 모두 삭제", 20000));
  await clickText(A.page, "내 편지와 데이터 모두 삭제");
  await A.page.waitForFunction(() => location.pathname === "/", { timeout: 40000 }).catch(() => {});
  ok("탈퇴 삭제 후 홈으로 돌아옴", new URL(A.page.url()).pathname === "/");
  ok("삭제 후 보낸 편지가 없음", await waitText(A.page, "아직 날아가는 편지가 없어요", 20000));

  console.log("\n[6] 오류 점검");
  ok("A 화면에 서버 연결 실패·스크립트 오류 없음", A.errors.length === 0, A.errors.join(" | "));
  ok("B 화면에 서버 연결 실패·스크립트 오류 없음", B.errors.length === 0, B.errors.join(" | "));
  console.log(`\n(편지 ID ${id}는 삭제됐는지 'node scripts/dev-letter-exists.mjs ${id}'로 확인할 수 있어요)`);
} catch (e) {
  fail++;
  console.log("  ✗ 시험이 중간에 멈춤 → " + (e.message || e));
} finally {
  await browser.close();
}

console.log(`\n결과: 통과 ${pass} / 실패 ${fail}  (${Math.round((Date.now() - started) / 1000)}초)`);
process.exit(fail ? 1 : 0);
