/**
 * 홈 화면 아이콘(편지를 문 까치)을 새 그림(BirdIcon)에서 다시 만들어요: npx tsx scripts/build-icons.mts
 * 필요한 것: Playwright(+Chromium). 결과: public/icon-*.png, public/apple-icon.png, src/app/{icon,apple-icon}.png
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const css = readFileSync("src/app/globals.css", "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const bird = (size: number) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id: "magpie", size, letter: true }));

/** 아이콘 한 장의 HTML. scale은 새가 차지하는 크기(마스크 아이콘은 가장자리가 잘려서 더 작게) */
const page = (px: number, scale: number) => {
  const size = Math.round(px * scale);
  return `<!doctype html><meta charset="utf-8"><style>${css}
html,body{margin:0;padding:0;background:#FBF3E4}
.canvas{width:${px}px;height:${px}px;position:fixed;left:0;top:0;display:grid;place-items:center;overflow:hidden;
  background:radial-gradient(circle at 50% 42%,#FFF8EA 0%,#FBF3E4 55%,#F3E3C4 100%)}
.sun{position:absolute;width:${px * 0.7}px;height:${px * 0.7}px;border-radius:50%;background:#F3D58C;opacity:.55;left:50%;top:50%;transform:translate(-50%,-50%)}
.ring{position:absolute;width:${px * 0.8}px;height:${px * 0.8}px;border-radius:50%;border:${Math.max(2, px * 0.008)}px dashed rgba(193,72,31,.35);left:50%;top:50%;transform:translate(-50%,-50%)}
.bird{position:relative;transform:translate(${-px * 0.025}px,${px * 0.01}px)}
svg{overflow:visible;display:block}
</style><body><div class="canvas"><div class="sun"></div><div class="ring"></div><div class="bird">${bird(size)}</div></div></body>`;
};

const OUT = join(tmpdir(), "saepyeonji-icons");
mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
async function shot(px: number, scale: number, file: string) {
  const ctx = await browser.newContext({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.setContent(page(px, scale));
  await p.screenshot({ path: file, omitBackground: false });
  await ctx.close();
}
await shot(512, 0.78, "public/icon-512.png");
await shot(512, 0.58, "public/icon-512-maskable.png");
await shot(192, 0.78, "public/icon-192.png");
await shot(180, 0.74, "public/apple-icon.png");
await browser.close();
copyFileSync("public/icon-192.png", "src/app/icon.png");
copyFileSync("public/apple-icon.png", "src/app/apple-icon.png");
console.log("아이콘 4장을 만들었어요");
