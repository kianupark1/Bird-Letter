/**
 * 하루 3개 같은 색 표지(2026-11-17 대표님: "3개씩 같은 색이어야 인스타 페이지가 예뻐져, 오방색에 맞춰 하루 3개씩"):
 *   npx tsx promo/build-covers.mts
 * 2026-11-17부터 날마다 색이 돌아가요: 남색 → 황토 → 한지 → 먹 → 다홍 → (다시 남색).
 * 자동 글(아침·저녁·밤)마다 그날 색의 표지를 만들어 넘겨 보기 첫 장으로 끼우고(promo/cards/cv/), 영상 글은 같은 색 릴스 표지(igCover)로.
 * 표지 글 = 글의 첫 줄. 이미 표지를 넣은 글은 다시 끼우지 않고 그림만 새로 그려요.
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: CuteBird } = await import("../src/components/CuteBird.tsx");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const icon = "file://" + resolve(root, "promo/store/play-icon-512.png");
const START = "2026-11-17"; // 11/17 남색(대표님: "오늘색 남색으로") → 11/18 황토
export const DAY_COLORS = [
  { name: "남색", bg: "#1E3A5C", fg: "#FFFFFF", accent: "#F0BC5C" },
  { name: "황토", bg: "#E0A83C", fg: "#16110E", accent: "#FFFFFF" },
  { name: "한지", bg: "#FBF3E4", fg: "#16110E", accent: "#C1481F" },
  { name: "먹", bg: "#16110E", fg: "#FFFFFF", accent: "#E8683F" },
  { name: "다홍", bg: "#E2512A", fg: "#FFFFFF", accent: "#FFE7A8" },
];
const BIRDS = ["pigeon", "magpie", "hawk", "sparrow"];
const AUTO = new Set(["noon", "evening", "night", "talk1", "talk2", undefined]);

const sched = JSON.parse(readFileSync(resolve(root, "promo/schedule.json"), "utf8"));
const L = new Date(sched.launch + "T00:00:00Z");
const dateOf = (p: any) => p.date ?? (typeof p.day === "number" ? new Date(L.getTime() + p.day * 864e5).toISOString().slice(0, 10) : null);
const dayIdx = (d: string) => Math.round((Date.parse(d) - Date.parse(START)) / 864e5);

const hook = (t: string) => t.split("\n").map((s) => s.trim()).find((s) => s && !s.startsWith("#")) ?? "새 편지";
const esc = (s: string) => s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]!));
const size = (s: string) => (s.length <= 14 ? 112 : s.length <= 22 ? 96 : s.length <= 32 ? 82 : 70);

function html(text: string, c: (typeof DAY_COLORS)[number], bird: string, w: number, h: number, reel = false, single = false) {
  const top = (h - 1350) / 2; // 릴스(9:16)는 가운데 4:5 칸에 담아요(격자에서 잘리지 않게)
  const b = renderToStaticMarkup(React.createElement(CuteBird as any, { id: bird, variant: "C", size: 470, letter: true }));
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>
@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: ${w}px; height: ${h}px; }
body { font-family: P, sans-serif; background: ${c.bg}; color: ${c.fg}; position: relative; overflow: hidden; word-break: keep-all; }
.box { position: absolute; left: 0; top: ${top}px; width: 1080px; height: 1350px; }
.t { position: absolute; left: 84px; right: 84px; top: 170px; font-size: ${size(text)}px; font-weight: 900; line-height: 1.18; letter-spacing: -0.045em; }
.k { position: absolute; left: 88px; top: 92px; font-size: 32px; font-weight: 800; letter-spacing: -.5px; color: ${c.accent}; }
.b { position: absolute; right: 30px; bottom: 120px; transform: rotate(-6deg); }
.tag { position: absolute; left: 84px; bottom: 80px; font-size: 32px; font-weight: 800; display: flex; align-items: center; gap: 14px; }
.tag img { width: 56px; height: 56px; border-radius: 14px; }
.sw { position: absolute; right: 84px; bottom: 92px; font-size: 28px; font-weight: 700; opacity: .7; }
</style></head><body><div class="box">
<div class="k">기다림도 소통의 일부입니다</div>
<div class="t">${esc(text)}</div>
<div class="b">${b}</div>
<div class="tag"><img src="${icon}">새 편지</div>
${single ? "" : `<div class="sw">${reel ? "▶ 영상" : "넘겨 보기 →"}</div>`}
</div></body></html>`;
}

const outDir = resolve(root, "promo/cards/cv");
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch();
const shoot = async (file: string, markup: string, w: number, h: number) => {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  const tmp = resolve(outDir, ".tmp.html");
  writeFileSync(tmp, markup);
  await p.goto("file://" + tmp);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 200)); });
  await p.screenshot({ path: file });
  await ctx.close();
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", file, "-q:v", "3", file.replace(/\.png$/, ".jpg")]);
};

let n = 0;
for (const p of sched.posts) {
  const d = dateOf(p);
  if (!d || d < START || !(AUTO.has(p.slot) || p.cover)) continue;
  const i = dayIdx(d), c = DAY_COLORS[((i % 5) + 5) % 5];
  const slot = p.slot ?? "noon";
  const name = `cv-${d}-${slot}`;
  const text = hook(p.text);
  const pool = c.fg === "#FFFFFF" ? BIRDS.filter((b) => b !== "magpie") : BIRDS; // 어두운 바탕에선 까만 까치가 묻혀요
  const bird = pool[(i * 3 + Math.max(0, ["noon", "evening", "night", "talk1", "talk2"].indexOf(slot))) % pool.length];
  if (p.video && !p.carousel) {
    await shoot(resolve(outDir, `${name}-reel.png`), html(text, c, bird, 1080, 1920, true), 1080, 1920);
    p.igCover = `cards/cv/${name}-reel.jpg`;
  } else {
    await shoot(resolve(outDir, `${name}.png`), html(text, c, bird, 1080, 1350, false, String(p.slot).startsWith("talk")), 1080, 1350);
    const first = `cv/${name}.png`;
    const rest = (p.carousel ?? [p.image]).filter((f: string) => f && !f.startsWith("cv/"));
    p.carousel = [first, ...rest].slice(0, 10);
    p.image = first;
  }
  p.color = c.name;
  n++;
}
await browser.close();
try { execFileSync("rm", ["-f", resolve(outDir, ".tmp.html")]); } catch {}
writeFileSync(resolve(root, "promo/schedule.json"), JSON.stringify(sched, null, 2) + "\n");
console.log("표지", n, "개");
