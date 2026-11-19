/**
 * 넘겨 보는 글 6차 — "만든 사람의 글"(Carrier Pidge가 터진 방식): npx tsx promo/build-carousel6.mts
 * 2026-11-16 대표님: "Carrier Pidge 케이스 따라 해 줘, 새가 잃어버리는 경우는 없으니 다른 곳에서 재미를 찾아야 함"
 * 규칙: 만든 사람 목소리("만들었어요, 네 일부러요"), 숫자 한 줄(참새 11시간 36분 vs KTX), 재미는 사라짐 대신
 * 새의 여행 일기(노을 구경·소나기·도토리, core/stories.ts의 실제 문구). 앱 화면은 promo/shots/ad-*.png.
 * 결과: promo/cards/c6-maker-1~5.png·.jpg
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
const { BIRDS } = await import("../core/birds.ts");
const { formatMinutes } = await import("../core/geo.ts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const shot = (f: string) => "file://" + resolve(root, "promo/shots", f);
const icon = "file://" + resolve(root, "promo/store/play-icon-512.png");
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const bird = (id: string, s: number, variant = "C") => renderToStaticMarkup(React.createElement(CuteBird as any, { id, variant, size: s, letter: variant === "C" }));
const sparrow = BIRDS.find((b: any) => b.id === "sparrow")!;
const SLOW = formatMinutes(sparrow.minutesSeoulBusan); // 앱 계산식 그대로(예: 11시간 36분)

const C = { dahong: "#E2512A", ink: "#16110E", hanji: "#FBF3E4", cream: "#FFF8EC", gold: "#F0BC5C" };
const CSS = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 1080px; height: 1350px; }
body { font-family: P, sans-serif; position: relative; overflow: hidden; letter-spacing: -2px; word-break: keep-all; }
.big { font-size: 108px; font-weight: 900; line-height: 1.1; letter-spacing: -5px; }
.mid { font-size: 42px; font-weight: 600; letter-spacing: -1px; opacity: .85; }
.tag { position: absolute; left: 80px; bottom: 70px; font-size: 30px; font-weight: 800; letter-spacing: -.5px; display: flex; align-items: center; gap: 14px; }
.tag img { width: 52px; height: 52px; border-radius: 13px; }
.phone { position: absolute; width: 560px; border-radius: 56px; overflow: hidden; border: 12px solid #16110E; background: #FBF3E4; box-shadow: 0 40px 80px rgba(0,0,0,.28); }
.phone img { width: 100%; display: block; }
.cnt { position: absolute; right: 70px; top: 64px; font-size: 26px; font-weight: 800; opacity: .55; letter-spacing: 0; }
.row { display: flex; justify-content: space-between; align-items: baseline; padding: 34px 0; border-bottom: 3px solid rgba(255,255,255,.18); }
.row b { font-size: 50px; font-weight: 700; letter-spacing: -1.5px; }
.row span { font-size: 64px; font-weight: 900; letter-spacing: -2px; font-variant-numeric: tabular-nums; }
.diary { background: #fff; border-radius: 34px; padding: 30px 36px; font-size: 40px; font-weight: 700; letter-spacing: -1.2px; box-shadow: 0 14px 30px rgba(60,30,10,.10); margin-bottom: 26px; display: flex; gap: 22px; align-items: center; }
.diary i { font-style: normal; font-size: 54px; }
`;
const tag = (light: boolean) => `<div class="tag" style="color:${light ? "#fff" : C.ink}"><img src="${icon}">새 편지</div>`;
const phone = (f: string, o: { left: number; top: number; h: number; shift: number; rot?: number }) =>
  `<div class="phone" style="left:${o.left}px;top:${o.top}px;height:${o.h}px;transform:rotate(${o.rot ?? 0}deg)"><img src="${shot(f)}" style="margin-top:-${o.shift}px"></div>`;

const N = 5;
const slides = [
  // 1. 만든 사람의 한마디
  `<body style="background:${C.dahong};color:#fff">
     <div style="position:absolute;left:80px;top:140px" class="big">카톡보다 느린<br>메신저를<br>만들었어요.</div>
     <div style="position:absolute;left:84px;top:540px;font-size:54px;font-weight:800;letter-spacing:-1.5px">네, 일부러요. 🐤</div>
     <div style="position:absolute;right:30px;top:690px;transform:rotate(-6deg)">${bird("sparrow", 600)}</div>
     ${tag(true)}</body>`,
  // 2. 숫자 비교
  `<body style="background:${C.ink};color:#fff">
     <div style="position:absolute;left:80px;top:120px" class="mid">서울 → 부산</div>
     <div style="position:absolute;left:80px;right:80px;top:210px">
       <div class="row"><b>카톡</b><span>1초</span></div>
       <div class="row"><b>KTX</b><span>약 2시간 30분</span></div>
       <div class="row" style="border:0"><b style="color:${C.gold}">참새 편지 🐤</b><span style="color:${C.dahong};font-size:96px">${SLOW}</span></div>
     </div>
     <div style="position:absolute;left:80px;top:860px" class="big">기차보다<br><span style="color:${C.dahong}">4배 넘게 느려요.</span></div>
     ${tag(true)}</body>`,
  // 3. 재미: 새의 여행 일기(사라지지 않음)
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:110px" class="big">늦는 데는<br><span style="color:${C.dahong}">이유가 있어요.</span></div>
     <div style="position:absolute;left:80px;right:80px;top:430px">
       <div class="diary"><i>🌇</i>노을이 예뻐서 잠깐 구경했어요</div>
       <div class="diary"><i>🌦</i>소나기가 지나가요! 처마 밑에서 쉬었다 갔어요</div>
       <div class="diary"><i>🌰</i>도토리를 하나 주웠어요</div>
       <div class="diary"><i>🌲</i>나무에 걸려서 잠깐 쉬는 중이에요</div>
     </div>
     <div style="position:absolute;left:84px;top:1080px" class="mid">그래도 편지는 꼭 도착해요 💌</div>
     ${tag(false)}</body>`,
  // 4. 같이 기다림
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:120px" class="big">받는 사람은<br>도착 전엔<br><span style="color:${C.dahong}">못 열어요.</span></div>
     <div style="position:absolute;left:84px;top:500px" class="mid">그래서 둘 다 지도만 봐요 🫣</div>
     ${phone("ad-home.png", { left: 420, top: 620, h: 820, shift: 150, rot: -4 })}
     ${tag(false)}</body>`,
  // 5. 엔드 카드
  `<body style="background:${C.dahong};color:#fff;text-align:center">
     <img src="${icon}" style="position:absolute;left:390px;top:240px;width:300px;height:300px;border-radius:70px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
     <div style="position:absolute;left:0;right:0;top:600px;font-size:120px;font-weight:900;letter-spacing:-5px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:770px;font-size:46px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:170px;right:170px;top:960px;padding:28px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:36px;font-weight:800;letter-spacing:-1px">아이폰은 앱스토어에서 바로 받기 · 무료</div>
     <div style="position:absolute;left:0;right:0;top:1110px;font-size:30px;font-weight:700;letter-spacing:-.5px">안드로이드는 지금 웹으로 · bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1170px;font-size:28px;font-weight:600;opacity:.85;letter-spacing:-.5px">링크는 프로필에 @saepyeonji</div></body>`,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c6");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `maker-${i + 1}.html`);
  const light = /background:(#E2512A|#16110E)/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${i > 0 && i < N - 1 ? `<div class="cnt" style="color:${light ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c6-maker-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c6 maker", i + 1);
}
await browser.close();
