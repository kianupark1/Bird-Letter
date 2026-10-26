/**
 * 업그레이드 영상(v2) 만들기: npx tsx promo/build-video-v2.mts [이야기 이름, 없으면 모두]
 * 사람이 나오는 AI 장면(promo/video/ai/*.mp4, 일레븐랩스로 만듦)을 첫 3.2초에 넣고 그 위에 첫 줄(hook) 자막,
 * 그 뒤는 원래 영상(promo/video/<이름>.mp4)의 2.8초부터(원래 첫 줄이 다 사라진 뒤) 그대로 이어 붙여요. 소리는 원래 영상 소리 그대로.
 * 결과는 promo/video/v2/<원래 이름>.mp4 → 자동 게시가 그날부터 새 영상을 올려요(scripts/auto-post.mjs upgraded).
 * 원래 영상은 먼저 promo/build-video.mts로 만들어 둬야 해요. 필요한 것: Playwright(+Chromium), ffmpeg
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();
const root = resolve(import.meta.dirname, "..");
const W = 1080, H = 1920, AI = 3.2, CUT = 2.8;
const FONT = resolve(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2");

// 이야기 → AI 장면 파일(ss = 장면에서 쓰기 시작할 초, cx = 가로 장면에서 자를 위치 0~1, fit = 자르지 않고 흐린 배경 위에 통째로)과 첫 줄(build-video.mts VARIANTS의 hook과 같게)
const STORIES = {
  mom: { file: "saepyeonji-15s", clip: "mom-kitchen", ss: 1.0, cx: 0.6, hook: ["답장, 너무 빨라서", "설레지 않죠?"] },
  love: { file: "saepyeonji-15s-love", clip: "love-subway", ss: 1.6, hook: ["읽씹될까 봐", "조마조마할 때"] },
  grandma: { file: "saepyeonji-15s-grandma", clip: "grandma-reading", ss: 1.8, cx: 0.55, hook: ["전화는 쑥스럽고", "문자는 너무 짧을 때"] },
  friend: { file: "saepyeonji-15s-friend", clip: "magpie-hanok", fit: true, hook: ["바로 안 가서", "더 설레는 편지"] },
  penpal: { file: "saepyeonji-15s-penpal", clip: "penpal-harbor", ss: 2.6, hook: ["펜팔,", "아세요?"] },
} as const;
type Key = keyof typeof STORIES;
const pick = process.argv[2] as Key | undefined;

const captionHtml = (lines: readonly string[]) => `<!doctype html><meta charset="utf-8"><style>
@font-face{font-family:P;src:url("file://${FONT}") format("woff2");font-weight:100 900}
html,body{margin:0;width:${W}px;height:${H}px;background:transparent}
.sh{position:absolute;left:0;right:0;top:0;height:560px;background:linear-gradient(rgba(0,0,0,.5),rgba(0,0,0,0))}
.c{position:absolute;left:0;right:0;top:110px;text-align:center;font-family:P;font-weight:800;font-size:88px;line-height:1.25;color:#fff;
  letter-spacing:-1px;text-shadow:0 4px 18px rgba(0,0,0,.55),0 2px 4px rgba(0,0,0,.6)}
</style><div class="sh"></div><div class="c">${lines.map((l) => `<div>${l}</div>`).join("")}</div>`;

const out = resolve(root, "promo/video/v2"), tmp = resolve(root, "promo/video/.v2tmp");
mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const key of (pick ? [pick] : Object.keys(STORIES)) as Key[]) {
  const s = STORIES[key];
  const o = s as { ss?: number; cx?: number; fit?: boolean };
  const ss = o.ss ?? 0, cx = o.cx ?? 0.5;
  const clip = resolve(root, `promo/video/ai/${s.clip}.mp4`), orig = resolve(root, `promo/video/${s.file}.mp4`);
  if (!existsSync(clip) || !existsSync(orig)) { console.log(`${key}: 건너뜀(장면 또는 원래 영상 없음)`); continue; }
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  writeFileSync(resolve(tmp, "cap.html"), captionHtml(s.hook), "utf8");
  const page = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  await page.goto("file://" + resolve(tmp, "cap.html"));
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: resolve(tmp, "cap.png"), omitBackground: true });
  await page.close();
  const total = AI + (15 - CUT);
  // AI 장면: 세로로 꽉 채워 자르고, 살짝 어둡게 해서 자막이 잘 보이게, 끝 0.3초는 하얗게 넘어감(원래 영상 한지 배경과 이어짐)
  const filter = [
    o.fit
      ? `[0:v]split[s0][s1];[s0]scale=${W}:${H}:force_original_aspect_ratio=increase,crop=${W}:${H},boxblur=30:2,eq=brightness=-0.08[bg];[s1]scale=${W}:-2[fg];[bg][fg]overlay=0:(H-h)/2,fps=30,trim=0:${AI},setpts=PTS-STARTPTS,fade=t=out:st=${AI - 0.3}:d=0.3:color=0xFBF3E4[a]`
      : `[0:v]scale=-2:${H},crop=${W}:${H}:(iw-${W})*${cx}:0,fps=30,trim=0:${AI},setpts=PTS-STARTPTS,eq=brightness=-0.04,fade=t=out:st=${AI - 0.3}:d=0.3:color=0xFBF3E4[a]`,
    `[2:v]format=rgba,fade=t=in:st=0:d=0.25:alpha=1[cap]`,
    `[a][cap]overlay=0:0:shortest=1,setsar=1[av]`,
    `[1:v]trim=${CUT}:15,setpts=PTS-STARTPTS,fps=30,setsar=1[bv]`,
    `[av][bv]concat=n=2:v=1:a=0[v]`,
    `[1:a]apad,atrim=0:${total},afade=t=out:st=${total - 0.6}:d=0.6[aud]`,
  ].join(";");
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", String(ss), "-i", clip, "-i", orig, "-loop", "1", "-t", String(AI), "-i", resolve(tmp, "cap.png"),
    "-filter_complex", filter, "-map", "[v]", "-map", "[aud]", "-t", String(total),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart",
    resolve(out, `${s.file}.mp4`)]);
  // 표지: 사람 얼굴+첫 줄이 보이는 1초 장면(X·유튜브 미리보기)
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-ss", "1", "-i", resolve(out, `${s.file}.mp4`), "-frames:v", "1", resolve(out, `${s.file}-cover.png`)]);
  console.log(`promo/video/v2/${s.file}.mp4 (${total.toFixed(1)}초)`);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
