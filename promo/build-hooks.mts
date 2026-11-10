/**
 * 첫 장면만 다른 홍보 영상 5편(2026-11-10 대표님: "탕탕특공대처럼 마케팅, 6시에 제대로"): npx tsx promo/build-hooks.mts
 * 같은 15초 영상(엄마·까치) 앞에, 가장 눈에 띄는 장면(지도 위를 나는 까치) 1.8초를 붙이고 위에 큰 한 줄(훅)을 얹어요.
 * 몸통은 같고 첫 줄만 달라서, 어떤 첫 줄이 많이 보였는지 비교할 수 있어요. 결과: promo/video/hook/hook-N.mp4·-cover.png
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();
const root = resolve(import.meta.dirname, "..");
const SRC = resolve(root, "promo/video/saepyeonji-15s.mp4");
const OUT = resolve(root, "promo/video/hook");
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
mkdirSync(OUT, { recursive: true });

export const HOOKS = [
  ["보낸 메시지가", "<em>9시간 뒤</em>에 도착해요"],
  ["엄마한테 보내면", "<em>몇 시간</em> 걸릴까요?"],
  ["카톡 말고,", "<em>새가 배달</em>해요 🕊"],
  ["읽씹 걱정 없는", "<em>느린 메신저</em>"],
  ["이 메신저는", "<em>일부러 느려요</em>"],
];

const ff = (args: string[]) => execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...args]);
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1920 } })).newPage();
for (const [i, [a, b]] of HOOKS.entries()) {
  const n = i + 1;
  const png = resolve(OUT, `overlay-${n}.png`);
  await page.setContent(`<html><head><style>@font-face{font-family:P;src:url(${FONT})}
    html,body{margin:0;width:1080px;height:1920px;background:transparent;font-family:P}
    .band{position:absolute;left:0;right:0;top:0;height:520px;background:linear-gradient(#1E1A17 70%,rgba(30,26,23,0));}
    .t{position:absolute;left:60px;right:60px;top:110px;text-align:center;color:#fff;font-weight:900;font-size:104px;line-height:1.18;letter-spacing:-4px}
    em{font-style:normal;color:#FFC94D}</style></head><body><div class="band"></div><div class="t">${a}<br>${b}</div></body></html>`);
  await page.evaluate(async () => { await document.fonts.ready; });
  await page.screenshot({ path: png, omitBackground: true });
  const intro = resolve(OUT, `intro-${n}.mp4`);
  // 지도 위를 나는 까치(6.4초부터 1.8초) + 훅 글씨
  ff(["-ss", "6.4", "-t", "1.8", "-i", SRC, "-i", png, "-filter_complex", "[0:v][1:v]overlay=0:0,format=yuv420p[v]", "-map", "[v]", "-map", "0:a?", "-c:v", "libx264", "-r", "30", "-c:a", "aac", "-ar", "44100", "-ac", "2", intro]);
  const body = resolve(OUT, "body.mp4");
  if (n === 1) ff(["-i", SRC, "-c:v", "libx264", "-r", "30", "-pix_fmt", "yuv420p", "-c:a", "aac", "-ar", "44100", "-ac", "2", body]);
  const list = resolve(OUT, `list-${n}.txt`);
  writeFileSync(list, `file '${intro}'\nfile '${body}'\n`);
  ff(["-f", "concat", "-safe", "0", "-i", list, "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-movflags", "+faststart", resolve(OUT, `hook-${n}.mp4`)]);
  ff(["-ss", "0.6", "-i", intro, "-frames:v", "1", resolve(OUT, `hook-${n}-cover.png`)]);
  console.log(`hook-${n}`);
}
await browser.close();
for (const f of ["body.mp4", ...HOOKS.flatMap((_, i) => [`intro-${i + 1}.mp4`, `list-${i + 1}.txt`, `overlay-${i + 1}.png`])]) execFileSync("rm", ["-f", resolve(OUT, f)]);
