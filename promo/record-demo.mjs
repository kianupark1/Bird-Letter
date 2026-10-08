// 앱 화면을 직접 녹화해서 홍보 영상(세로 1080x1920 mp4)을 만들어요: node promo/record-demo.mjs [주소]
// 기본 주소는 내 컴퓨터에서 켜 둔 앱(http://localhost:3000). AI 영상 크레딧 없이 쓰는 방법이에요.
// 필요한 것: Playwright(+Chromium), ffmpeg. 결과: promo/video/saepyeonji-demo.mp4
// 장면: 내 위치로 대구 선택 → 제주로 까치 편지 → 지도에서 날아가는 새 → 알림 팝업 → 도착
// 시간이 오래 걸리지 않게 보내기 화면은 ?test=1(600배 빠르게), 시각은 저장값을 앞당겨서 녹화합니다.
import { mkdirSync, readdirSync, renameSync, rmSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const { chromium } = (() => {
  try { return require("playwright"); } catch { return require("/opt/node-tools/node_modules/playwright"); }
})();

const BASE = (process.argv[2] ?? "http://localhost:3000").replace(/\/$/, "");
const OUT = "promo/video";
const TMP = `${OUT}/.raw`;
rmSync(TMP, { recursive: true, force: true });
mkdirSync(TMP, { recursive: true });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const ctx = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
  geolocation: { latitude: 35.8714, longitude: 128.6014 }, // 대구
  permissions: ["geolocation"],
  recordVideo: { dir: TMP, size: { width: 390, height: 844 } },
});
await ctx.addInitScript(() => {
  try {
    localStorage.setItem("saepyeonji.onboarded.v1", "1");
    localStorage.setItem("saepyeonji.profile.v1", JSON.stringify({ nickname: "지민", notify: { arrival: true, passing: true, reply: true }, homePlace: "seoul" }));
  } catch {}
});
const page = await ctx.newPage();
page.on("dialog", (d) => d.accept());

const click = async (label, sel = "button, a") => {
  await page.locator(sel, { hasText: label }).first().click();
  await sleep(900);
};
const setTimes = (sentMinAgo, arriveInMs) =>
  page.evaluate(([a, b]) => {
    const k = "saepyeonji.letters.v1";
    const list = JSON.parse(localStorage.getItem(k) || "[]");
    localStorage.setItem(k, JSON.stringify(list.map((l) => ({ ...l, sentAt: Date.now() - a * 60000, arriveAt: Date.now() + b }))));
  }, [sentMinAgo, arriveInMs]);

// 1. 누구에게, 어디서 어디로
await page.goto(`${BASE}/send?test=1`, { waitUntil: "networkidle" });
await sleep(1500);
await page.locator("input.field").first().pressSequentially("엄마", { delay: 180 });
await sleep(500);
await click("내 위치로");
await sleep(1200);
await page.selectOption("#to-place", "jeju");
await sleep(2200);
await click("다음: 새 고르기");
await sleep(1500);
// 2. 새 고르기
await click("까치", "button.card");
await sleep(1000);
await click("다음: 편지 쓰기");
// 3. 편지 쓰기
await page.locator("textarea").pressSequentially("엄마, 오늘 까치가 울더니 정말 좋은 소식이 왔어요. 사랑해요.", { delay: 60 });
await sleep(900);
await click("보내기");
await page.waitForURL(/\/letter\//, { timeout: 30000 });
await sleep(3500);
// 4. 날아가는 중: 절반쯤 왔다고 맞추고 다시 열어요(지금 지나는 곳과 다음 곳이 보여요)
await setTimes(45, 55 * 60000);
await page.reload({ waitUntil: "networkidle" });
await sleep(4500);
// 5. 홈에서 기다리다 알림 팝업
await setTimes(100, 1500);
await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
await page.waitForSelector(".popcard", { timeout: 40000 }).catch(() => {});
await sleep(3000);
// 6. 열어보기 → 도착 연출
await page.locator(".popopen").click().catch(() => {});
await sleep(5500);
await ctx.close();
await browser.close();

const raw = readdirSync(TMP).find((f) => f.endsWith(".webm"));
renameSync(`${TMP}/${raw}`, `${OUT}/raw.webm`);
// 1080x1920(세로 숏폼)로 키우고 좌우 여백은 한지색으로 채워요.
execFileSync("ffmpeg", [
  "-y", "-i", `${OUT}/raw.webm`,
  "-vf", "scale=-2:1920:flags=lanczos,pad=1080:1920:(ow-iw)/2:0:color=0xFBF3E4,fps=30",
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "18", "-movflags", "+faststart",
  `${OUT}/saepyeonji-demo.mp4`,
], { stdio: "inherit" });
rmSync(TMP, { recursive: true, force: true });
rmSync(`${OUT}/raw.webm`, { force: true });
console.log(`완성: ${OUT}/saepyeonji-demo.mp4`);
