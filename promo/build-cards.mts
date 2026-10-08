/**
 * 홍보 이미지 생성기: npx tsx promo/build-cards.mts
 * 앱의 새 그림(BirdIcon)·새 속도(core/birds)·소요 시간 계산식을 그대로 써서, 앱과 숫자가 항상 같아요.
 * 필요한 것: Playwright(+Chromium). 결과: promo/cards/*.png, public/og.png (원본 HTML은 promo/cards-src)
 * 문구 규칙: "실제 새 속도와 같다"고 쓰지 않고 "실제 새의 비행 속도를 바탕으로"라고 써요. 앱스토어 출시 전이라 "다운로드" 문구는 쓰지 않아요.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");
const { BIRDS_SLOW_TO_FAST, getBird } = await import("../core/birds.ts");
const { travelMinutes, formatMinutes } = await import("../core/geo.ts");
const { getRoute } = await import("../core/routes.ts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const FONT = resolve(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const mins = (id: string, km: number) => formatMinutes(Math.max(1, travelMinutes(getBird(id), km)));
const BUSAN = getRoute("seoul-busan").km, JEJU = getRoute("seoul-jeju").km;

const BASE = `${css}
@font-face { font-family: P; src: url("file://${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: P, sans-serif; color: #2A2118; background: #FBF3E4; position: relative; overflow: hidden; }
svg { overflow: visible; display: block; }
.band { position: absolute; left: 0; right: 0; top: 0; height: 22px; display: flex; }
.band i { flex: 1; } .band i:nth-child(1){background:#C1481F} .band i:nth-child(2){background:#E0A83C} .band i:nth-child(3){background:#1B6E5C} .band i:nth-child(4){background:#1E3A5C} .band i:nth-child(5){background:#FBF3E4;border-bottom:2px solid #C1481F}
.wrap { position: absolute; inset: 22px 0 0 0; padding: 84px 84px 64px; display: flex; flex-direction: column; }
.brand { margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 32px; font-weight: 800; }
.brand small { font-size: 22px; font-weight: 600; color: #C1481F; border: 2px solid #E0A83C; border-radius: 999px; padding: 6px 18px; }
h1 { font-size: 90px; line-height: 1.14; letter-spacing: -2px; font-weight: 800; text-wrap: balance; }
.hl { color: #C1481F; }
.sub { font-size: 36px; line-height: 1.5; opacity: .78; margin-top: 22px; }
.proverb { color: #C1481F; font-weight: 700; font-size: 38px; margin-top: 26px; }
.tile { background: #fff; border-radius: 32px; padding: 26px 30px; display: flex; align-items: center; gap: 22px; box-shadow: 0 6px 0 rgba(42,33,24,.06); }
`;
const FOOT = `<div class="brand"><span>새 편지</span><small>웹 체험판 공개 · 앱스토어 준비 중</small></div>`;
const BAND = `<div class="band"><i></i><i></i><i></i><i></i><i></i></div>`;

const cards: { file: string; w: number; h: number; html: string; copyTo?: string }[] = [
  { file: "01-concept", w: 1080, h: 1350, html: `${BAND}<div class="wrap">
    <div style="margin:10px auto 0">${bird("magpie", 520, true)}</div>
    <h1 style="text-align:center;margin-top:28px">소식은<br>날아서 와요</h1>
    <p class="proverb" style="text-align:center">“아침 까치가 울면 반가운 손님이 온다”</p>
    <p class="sub" style="text-align:center">실제 거리만큼 걸려 도착하는<br>느린 편지, 새 편지</p>${FOOT}</div>` },

  { file: "02-birds", w: 1080, h: 1350, html: `${BAND}<div class="wrap">
    <h1 style="font-size:76px">어떤 새에게<br>편지를 맡길까요?</h1>
    <p class="sub" style="margin-top:14px;font-size:30px">실제 새의 비행 속도를 바탕으로 · 서울 → 부산 ${BUSAN}km</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:22px;margin:36px 0 34px;flex:1">
    ${BIRDS_SLOW_TO_FAST.map((b) => `<div class="tile" style="padding:20px 24px">${bird(b.id, 130)}
      <div><div style="font-size:44px;font-weight:800">${b.name}</div>
      <div style="font-size:30px;font-weight:800;color:#C1481F">${mins(b.id, BUSAN)}</div>
      <div style="font-size:23px;opacity:.7;margin-top:2px">시속 약 ${b.kmh}km</div></div></div>`).join("")}
    </div>${FOOT}</div>` },

  { file: "03-magpie", w: 1080, h: 1350, html: `<style>body{background:#16243A;color:#FBF3E4}.brand small{color:#F0BC5C;border-color:#F0BC5C}.sp{position:absolute;font-size:50px;color:#F0BC5C}</style>${BAND}
    ${[[110, 170, "✦"], [900, 230, "✧"], [200, 540, "✧"], [860, 600, "✦"], [120, 900, "✦"], [930, 960, "✧"], [540, 150, "✧"], [770, 420, "✦"]].map(([x, y, s]) => `<span class="sp" style="left:${x}px;top:${y}px">${s}</span>`).join("")}
    <div class="wrap">
    <div style="margin:40px auto 0;width:560px;height:560px;border-radius:50%;background:#FBF3E4;display:grid;place-items:center;box-shadow:0 0 0 14px rgba(240,188,92,.35)">${bird("magpie", 440, true)}</div>
    <h1 style="text-align:center;margin-top:44px;font-size:82px">까치로 보낸 편지는<br>도착이 특별해요</h1>
    <p class="sub" style="text-align:center;opacity:.9">금빛 테두리와 반짝이가 내려와요<br>시속 약 ${getBird("magpie").kmh}km, 느긋하게 날아와요</p>${FOOT}</div>` },

  { file: "04-jeju", w: 1080, h: 1350, html: `${BAND}<div class="wrap">
    <h1 style="font-size:80px">서울 → 제주<br><span class="hl">${JEJU}km</span>, 새로 보내면?</h1>
    <p class="sub" style="margin-top:14px;font-size:30px">새마다 걸리는 시간이 달라요</p>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;grid-auto-rows:1fr;gap:18px;margin:38px 0 34px;flex:1">
    ${BIRDS_SLOW_TO_FAST.map((b) => `<div class="tile" style="flex-direction:column;gap:6px;padding:22px 10px;text-align:center">${bird(b.id, 190)}
      <div style="font-size:34px;font-weight:800">${b.name}</div><div style="font-size:30px;font-weight:800;color:#C1481F">${mins(b.id, JEJU)}</div></div>`).join("")}
    </div>${FOOT}</div>` },

  { file: "05-mishap", w: 1080, h: 1350, html: `${BAND}<div class="wrap">
    <h1 style="font-size:84px">가끔은<br>길을 잃기도 해요</h1>
    <p class="sub" style="margin-top:20px">나무에 걸리기도 하고요.<br>조금 늦어질 뿐, 편지는 <b>꼭 도착해요</b>.</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:1fr;gap:22px;margin:40px 0 34px;flex:1">
    ${BIRDS_SLOW_TO_FAST.map((b) => `<div class="tile" style="padding:18px 24px">${bird(b.id, 120)}
      <div><div style="font-size:40px;font-weight:800">${b.name}</div><div style="font-size:26px;font-weight:700;color:#C1481F">약 ${b.mishapOneIn}통에 1번</div></div></div>`).join("")}
    </div>${FOOT}</div>` },

  { file: "og", w: 1200, h: 630, copyTo: resolve(root, "public/og.png"), html: `<style>.wrap{padding:56px 76px 44px;flex-direction:row;align-items:center;gap:30px} h1{font-size:76px} .proverb{font-size:28px;margin-top:18px} .sub{font-size:27px;margin-top:14px}
    .brand{position:absolute;left:76px;bottom:38px;font-size:26px}</style>${BAND}<div class="wrap">
    <div style="flex:1"><h1>소식은<br>날아서 와요</h1><p class="proverb">“아침 까치가 울면 반가운 손님이 온다”</p><p class="sub">실제 거리만큼 걸려 도착하는 느린 편지</p></div>
    <div style="width:440px">${bird("magpie", 440, true)}</div></div><div class="brand">새 편지</div>` },
];

mkdirSync(resolve(root, "promo/cards-src"), { recursive: true });
mkdirSync(resolve(root, "promo/cards"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const c of cards) {
  const htmlPath = resolve(root, `promo/cards-src/${c.file}.html`);
  writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${c.html}</body></html>`, "utf8");
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("file://" + htmlPath);
  await p.evaluate(() => document.fonts.ready);
  const png = resolve(root, `promo/cards/${c.file}.png`);
  await p.screenshot({ path: png });
  await ctx.close();
  if (c.copyTo) copyFileSync(png, c.copyTo);
  console.log(c.file);
}
await browser.close();
