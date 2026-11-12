/**
 * 넘겨 보는 글 5차 — TV 광고처럼 한 장에 한 마디(시안): npx tsx promo/build-carousel5.mts
 * 2026-11-12 대표님: "광고 좀 더 심플하게, 너무 올디해, 더 트렌디하게 경험해 보고 싶게, TV 광고처럼 포인트를 찍어서"
 * 규칙: 한 장에 큰 글자 한 마디(10자 안팎) + 실제 앱 화면 한 조각, 색 바탕 한 가지, 설명 문단 없음.
 * 앱 화면은 promo/shots/ad-*.png(로컬 앱을 390×844 3배로 찍은 것).
 * 결과: promo/cards/c5-<편>-1~5.png·.jpg
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: CuteBird } = await import("../src/components/CuteBird.tsx");
const { SLOGAN } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const shot = (f: string) => "file://" + resolve(root, "promo/shots", f);
const icon = "file://" + resolve(root, "promo/store/play-icon-512.png");
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const fly = (id: string, s: number) => renderToStaticMarkup(React.createElement(CuteBird as any, { id, variant: "C", size: s, letter: true }));

const C = { dahong: "#E2512A", ink: "#16110E", hanji: "#FBF3E4", cream: "#FFF8EC", gold: "#F0BC5C" };
const CSS = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 1080px; height: 1350px; }
body { font-family: P, sans-serif; position: relative; overflow: hidden; letter-spacing: -2px; word-break: keep-all; }
.big { font-size: 112px; font-weight: 900; line-height: 1.08; letter-spacing: -5px; }
.mid { font-size: 40px; font-weight: 600; letter-spacing: -1px; opacity: .8; }
.tag { position: absolute; left: 80px; bottom: 70px; font-size: 30px; font-weight: 800; letter-spacing: -.5px; display: flex; align-items: center; gap: 14px; }
.tag img { width: 52px; height: 52px; border-radius: 13px; }
.phone { position: absolute; width: 560px; border-radius: 56px; overflow: hidden; border: 12px solid #16110E; background: #FBF3E4; box-shadow: 0 40px 80px rgba(0,0,0,.28); }
.phone img { width: 100%; display: block; }
.cnt { position: absolute; right: 70px; top: 64px; font-size: 26px; font-weight: 800; opacity: .55; letter-spacing: 0; }
`;
const tag = (light: boolean) => `<div class="tag" style="color:${light ? "#fff" : C.ink}"><img src="${icon}">새 편지</div>`;
const phone = (f: string, o: { left: number; top: number; h: number; shift: number; rot?: number }) =>
  `<div class="phone" style="left:${o.left}px;top:${o.top}px;height:${o.h}px;transform:rotate(${o.rot ?? 0}deg)"><img src="${shot(f)}" style="margin-top:-${o.shift}px"></div>`;

type Set = { key: string; slides: string[] };
const N = 5;
const main: Set = {
  key: "tv",
  slides: [
    // 1. 훅: 빨간 바탕, 큰 한 마디
    `<body style="background:${C.dahong};color:#fff">
       <div style="position:absolute;left:80px;top:150px" class="big">카톡은 1초.<br>마음은<br>5시간.</div>
       <div style="position:absolute;right:40px;top:700px;transform:rotate(-8deg)">${fly("pigeon", 620)}</div>
       ${tag(true)}</body>`,
    // 2. 카운트다운: 검은 바탕, 숫자가 주인공
    `<body style="background:${C.ink};color:#fff">
       <div style="position:absolute;left:80px;top:110px" class="mid">엄마에게 가는 편지</div>
       <div style="position:absolute;left:66px;top:170px;font-size:230px;font-weight:900;letter-spacing:-10px;color:${C.dahong};font-variant-numeric:tabular-nums">2:35:49</div>
       <div style="position:absolute;left:80px;top:440px" class="big" >기다림이<br>설레요.</div>
       ${phone("ad-home.png", { left: 480, top: 730, h: 760, shift: 150, rot: -4 })}
       ${tag(true)}</body>`,
    // 3. 지도: 한지 바탕
    `<body style="background:${C.hanji};color:${C.ink}">
       <div style="position:absolute;left:80px;top:120px" class="big">진짜 거리만큼<br><span style="color:${C.dahong}">날아가요.</span></div>
       <div style="position:absolute;left:84px;top:390px" class="mid">서울 → 부산 325km · 비둘기 5시간</div>
       ${phone("ad-room.png", { left: 260, top: 520, h: 900, shift: 0, rot: 3 })}
       ${tag(false)}</body>`,
    // 4. 두루마리: 크림 바탕
    `<body style="background:${C.cream};color:${C.ink}">
       <div style="position:absolute;left:80px;top:120px" class="big">도착하면,<br><span style="color:${C.dahong}">펼쳐져요.</span></div>
       ${phone("ad-open.png", { left: 260, top: 470, h: 470, shift: 440, rot: -3 })}
       ${tag(false)}</body>`,
    // 5. 엔드 카드: 빨간 바탕, 로고·슬로건·받는 곳
    `<body style="background:${C.dahong};color:#fff;text-align:center">
       <img src="${icon}" style="position:absolute;left:390px;top:260px;width:300px;height:300px;border-radius:70px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
       <div style="position:absolute;left:0;right:0;top:620px;font-size:120px;font-weight:900;letter-spacing:-5px">새 편지</div>
       <div style="position:absolute;left:0;right:0;top:790px;font-size:46px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
       <div style="position:absolute;left:290px;right:290px;top:1000px;padding:28px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:38px;font-weight:800;letter-spacing:-1px">App Store · 무료</div>
       <div style="position:absolute;left:0;right:0;top:1150px;font-size:28px;font-weight:600;opacity:.85;letter-spacing:-.5px">링크는 프로필에 @saepyeonji · 안드로이드는 곧</div></body>`,
  ],
};

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c5");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (const set of [main]) for (let i = 0; i < set.slides.length; i++) {
  const html = resolve(tmp, `${set.key}-${i + 1}.html`);
  const light = /background:(#E2512A|#16110E)/.test(set.slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${set.slides[i].replace("</body>", `${i > 0 && i < N - 1 ? `<div class="cnt" style="color:${light ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c5-${set.key}-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c5", set.key, i + 1);
}
await browser.close();
