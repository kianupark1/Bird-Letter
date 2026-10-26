/**
 * 스토어(구글 플레이·앱스토어)용 화면 사진: node promo/build-store-shots.mjs [주소]
 * 먼저 앱을 띄워 두세요(npm run build && npx next start -p 3120). 서버 없이 내 폰 저장 방식으로 예시 편지를 넣고 실제 화면을 찍어요.
 * → promo/store/phone-*.png (1080×1920, 9:16). 예시 이름(엄마·할머니·민지·준호)은 지어낸 이름이에요.
 * 아이폰 앱스토어용(6.9인치 1320×2868): node promo/build-store-shots.mjs [주소] --ios → promo/store/ios-*.png
 */
import { createRequire } from "node:module";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const IOS = process.argv.includes("--ios");
const BASE = process.argv.slice(2).find((a) => !a.startsWith("--")) ?? "http://localhost:3120";
const PREFIX = IOS ? "ios" : "phone";
const OUT = resolve(import.meta.dirname, "store");
mkdirSync(OUT, { recursive: true });

const now = Date.now(), H = 3600_000;
// 날아가는 편지 2통, 도착한 편지 2통. 도착 시각을 정해 두어 진행률이 화면마다 같아요.
const letters = [
  { id: "shotMom01", to: "엄마", routeId: "seoul-busan", birdId: "magpie", message: "엄마, 이번 주말에 내려갈게요. 된장찌개 해 주세요 🙂", sentAt: now - 22 * H, arriveAt: now + 33 * H },
  { id: "shotGma02", to: "할머니", routeId: "seoul-jeju", birdId: "crane", message: "할머니, 귤 잘 받았어요. 보고 싶어요.", sentAt: now - 20 * H, arriveAt: now + 9 * H },
  { id: "shotMinji3", to: "민지", routeId: "seoul-gangneung", birdId: "swallow", message: "바다 사진 고마워! 다음엔 같이 가자", sentAt: now - 30 * H, arriveAt: now - 4 * H },
  { id: "shotJunho4", to: "준호", routeId: "seoul-daejeon", birdId: "pigeon", message: "생일 축하해! 늦지 않게 날려 보낸다", sentAt: now - 50 * H, arriveAt: now - 40 * H },
];
const profile = { nickname: "하늘", avatarBird: "magpie", homePlace: "seoul", homeSet: true, fontScale: "normal", chirp: false, notify: { arrival: true, passing: false, reply: true } };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: IOS ? { width: 440, height: 956 } : { width: 360, height: 640 }, deviceScaleFactor: 3,
  ...(IOS ? { userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1 SaePyeonjiApp" } : {}), locale: "ko-KR", timezoneId: "Asia/Seoul", colorScheme: "light", reducedMotion: "no-preference" });
await ctx.addInitScript(([letters, profile]) => {
  localStorage.setItem("saepyeonji.onboarded.v1", "1");
  localStorage.setItem("saepyeonji.e2e.v1", "1"); // 로그인 없이 열기(시험용 표시)
  localStorage.setItem("saepyeonji.letters.v1", JSON.stringify(letters));
  localStorage.setItem("saepyeonji.profile.v1", JSON.stringify(profile));
  localStorage.setItem("saepyeonji.lastbird.v1", "magpie");
  localStorage.setItem("saepyeonji.roomplace.v1.n:엄마", "busan");
}, [letters, profile]);
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));

const shot = async (name, path, prep) => {
  await page.goto(BASE + path, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  // 도착 알림 팝업은 닫고, "아직 앱이 없나요?" 같은 안내 카드는 사진에서 빼요
  for (let i = 0; i < 4 && (await page.locator(".popclose").count()); i++) { await page.locator(".popclose").first().click(); await page.waitForTimeout(250); }
  // 앱스토어 사진은 스토어 앱 안의 화면이라 "앱처럼 설치" 카드도 빼요
  await page.addStyleTag({ content: ".mergecard{display:none!important}" + (IOS ? ".pushcard{display:none!important}" : "") });
  if (prep) await prep();
  await page.waitForTimeout(500);
  await page.screenshot({ path: resolve(OUT, `${PREFIX}-${name}.png`) });
  console.log(PREFIX + "-" + name);
};

await shot("1-list", "/");
await shot("2-room", "/room?n=" + encodeURIComponent("엄마"));
await shot("3-birds", "/room?n=" + encodeURIComponent("할머니"), async () => {
  const box = page.locator("textarea.ch-in").first();
  if (await box.count()) await box.fill("할머니, 감기 조심하세요. 다음 달에 갈게요!");
});
await shot("4-map", "/room?n=" + encodeURIComponent("할머니"), async () => {
  const map = page.locator("button.ch-map").first();
  if (await map.count()) { await map.click(); await page.waitForTimeout(1200); }
});
await shot("5-welcome", "/onboarding");

await browser.close();
if (errors.length) { console.error("화면 오류:", errors); process.exit(1); }
