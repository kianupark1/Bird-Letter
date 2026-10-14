/**
 * 앱 아이콘 생성기: npx tsx promo/build-icons.mts
 * 편지를 문 까치가 날아가는 모습(앱의 BirdIcon letter 그림)을 다홍 바탕 위에 놓고,
 * 뒤에 바람 선을 그려 "날아가는 느낌"을 줍니다. Playwright(Chromium)로 PNG를 만듭니다.
 * → public/icon-192.png, icon-512.png, icon-512-maskable.png, apple-icon.png, src/app/{icon,apple-icon}.png
 */
import { createRequire } from "node:module";
import { readFileSync, copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { chromium } = req("playwright");
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const bird = renderToStaticMarkup(React.createElement(BirdIcon as any, { id: "magpie", size: 200, letter: true }));

// birdPct: 그림이 차지하는 폭(%), rounded: 모서리를 둥글게(마스커블·애플 아이콘은 사각형 그대로)
const html = (size: number, birdPct: number, rounded: boolean) => `<!doctype html><meta charset="utf-8"><style>${css}
*{margin:0;box-sizing:border-box}html,body{width:${size}px;height:${size}px;background:transparent}
.bg{position:relative;width:${size}px;height:${size}px;background:#C1481F;overflow:hidden;${rounded ? `border-radius:${Math.round(size * 0.22)}px;` : ""}}
.bg::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 70% 30%,rgba(255,255,255,.16),transparent 60%)}
.fly{position:absolute;left:50%;top:52%;width:${birdPct}%;transform:translate(-50%,-50%) rotate(-9deg)}
.fly svg{width:100%;height:auto;overflow:visible;display:block}
.wind{position:absolute;left:0;top:0;width:100%;height:100%}
</style><div class="bg">
<svg class="wind" viewBox="0 0 100 100" fill="none" stroke="#FBF3E4" stroke-linecap="round">
  <path d="M8 56 H30" stroke-width="2.6" opacity=".55"/><path d="M4 66 H24" stroke-width="2.2" opacity=".4"/><path d="M12 76 H28" stroke-width="1.8" opacity=".3"/>
</svg>
<div class="fly">${bird}</div></div>`;

mkdirSync(resolve(root, "public"), { recursive: true });
const browser = await chromium.launch();
const make = async (name: string, size: number, pct: number, rounded: boolean) => {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(html(size, pct, rounded));
  await page.screenshot({ path: resolve(root, "public", `${name}.png`), omitBackground: true });
  await page.close();
  console.log(name);
};
await make("icon-192", 192, 86, true);
await make("icon-512", 512, 86, true);
await make("icon-512-maskable", 512, 66, false); // 모서리가 잘려도 되도록 그림을 작게, 배경은 꽉 채움
await make("apple-icon", 180, 86, false);
await browser.close();
copyFileSync(resolve(root, "public/apple-icon.png"), resolve(root, "src/app/apple-icon.png"));
copyFileSync(resolve(root, "public/icon-192.png"), resolve(root, "src/app/icon.png"));
