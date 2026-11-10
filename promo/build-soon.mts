/**
 * "안드로이드는 곧 출시" 표시를 홍보 글의 첫 장에 붙인 사본을 만들어요(2026-11-10 대표님: "안드로이드는 아직 없으니 곧 출시된다고 첫장에").
 *   npx tsx promo/build-soon.mts
 * - 그림 카드: 원래 그림을 조금 줄이고 위에 다홍 띠 "안드로이드 곧 출시 · 지금은 앱스토어에서 ‘새 편지’" → promo/cards/soon/이름.png·.jpg
 * - 영상: 처음 4초 동안 아래쪽에 같은 알약 → promo/video/soon/이름.mp4 (+표지 -cover.png)
 * 자동 게시(scripts/auto-post.mjs soonify)는 schedule.json stores.android가 비어 있는 동안만 이 사본을 써요.
 * 구글 플레이 주소를 넣는 날부터는 저절로 원래 그림으로 돌아가요(사본은 지워도 됨).
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { basename, resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();
const root = resolve(import.meta.dirname, "..");
const FONT = "data:font/woff2;base64," + readFileSync(resolve(root, "src/app/fonts/PretendardSub.woff2")).toString("base64");
const DAHONG = "#C1481F";
const LINE = "안드로이드는 곧 출시돼요 · 지금은 앱스토어에서 ‘새 편지’";

const { posts } = JSON.parse(readFileSync(resolve(root, "promo/schedule.json"), "utf8"));
const { upgraded } = await import("../scripts/auto-post.mjs");

// 첫 장에 쓰이는 그림·영상(영상은 v2로 바뀐 뒤의 것)
const images = new Set<string>(), videos = new Set<string>();
for (const p0 of posts) {
  const p = upgraded(p0);
  if (p.carousel?.length) images.add(p.carousel[0]);
  else if (p.image) images.add(p.image);
  else if (p.video) videos.add(p.video);
}
// 아래 띠에 이미 "안드로이드는 곧"이 들어간 앱 카드는 빼요
for (const f of [...images]) if (/^app-/.test(f)) images.delete(f);

mkdirSync(resolve(root, "promo/cards/soon"), { recursive: true });
mkdirSync(resolve(root, "promo/video/soon"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1350 } })).newPage();
const head = `<head><style>@font-face{font-family:P;src:url(${FONT})} html,body{margin:0;font-family:P}</style></head>`;

for (const f of images) {
  const src = "data:image/png;base64," + readFileSync(resolve(root, "promo/cards", f)).toString("base64");
  await page.setViewportSize({ width: 1080, height: 1350 });
  await page.setContent(`<html>${head}<body style="width:1080px;height:1350px;background:${DAHONG};position:relative;overflow:hidden">
    <div style="position:absolute;left:0;right:0;top:0;height:84px;display:flex;align-items:center;justify-content:center;color:#fff;font-weight:800;font-size:36px;letter-spacing:-1px">${LINE}</div>
    <img src="${src}" style="position:absolute;top:84px;left:${(1080 - 1080 * 1258 / 1350) / 2}px;height:1258px;border-radius:18px 18px 0 0"></body></html>`);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode())); });
  const out = resolve(root, "promo/cards/soon", f);
  await page.screenshot({ path: out });
  await page.screenshot({ path: out.replace(/\.png$/i, ".jpg"), type: "jpeg", quality: 90 });
  console.log("카드", f);
}

// 영상용 알약(투명 그림)
const pill = resolve(root, "promo/video/soon/pill.png");
await page.setViewportSize({ width: 1080, height: 160 });
await page.setContent(`<html>${head}<body style="background:transparent;display:flex;justify-content:center;align-items:center;height:160px">
  <div style="background:${DAHONG};color:#fff;font-weight:800;font-size:40px;padding:26px 44px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.25);letter-spacing:-1px">${LINE}</div></body></html>`);
await page.evaluate(async () => { await document.fonts.ready; });
await page.screenshot({ path: pill, omitBackground: true });
await browser.close();

const ff = (args: string[]) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...args]);
for (const v of videos) {
  const src = resolve(root, "promo", v);
  const name = basename(v);
  const out = resolve(root, "promo/video/soon", name);
  ff(["-i", src, "-i", pill, "-filter_complex", "[0:v][1:v]overlay=0:1180:enable='lt(t,4)'", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", out]);
  const cover = src.replace(/\.mp4$/, "-cover.png");
  if (existsSync(cover)) ff(["-i", cover, "-i", pill, "-filter_complex", "[0:v][1:v]overlay=0:1180", out.replace(/\.mp4$/, "-cover.png")]);
  console.log("영상", v);
}
