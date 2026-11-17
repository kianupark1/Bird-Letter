/**
 * 넘겨 보는 글 9차 — 천천히 와도 괜찮은 대화(대표님 문구, 2026-11-17 저녁 6시)(2026-11-17 대표님: "수능 광고로 가자, 지금·저녁 6시·밤 10시"): npx tsx promo/build-carousel9.mts
 * 2027학년도 수능 2026-11-19(목). 편지 글은 예시(실제 후기 아님). 결과: promo/cards/c8-cheer-1~5, c8-mom-1~5 (.png·.jpg)
 * ---- 아래는 6차 머리말
 * 2026-11-16 대표님: "Carrier Pidge 케이스 따라 해 줘, 새가 잃어버리는 경우는 없으니 다른 곳에서 재미를 찾아야 함"
 * 규칙: 만든 사람 목소리("만들었어요, 네 일부러요"), 숫자 한 줄(참새 11시간 36분 vs KTX), 재미는 사라짐 대신
 * 새의 여행 일기(노을 구경·소나기·도토리, core/stories.ts의 실제 문구). 앱 화면은 promo/shots/ad-*.png.
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
const T = (id: string) => formatMinutes(BIRDS.find((b: any) => b.id === id)!.minutesSeoulBusan);
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const shot = (f: string) => "file://" + resolve(root, "promo/shots", f);
const icon = "file://" + resolve(root, "promo/store/play-icon-512.png");
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const bird = (id: string, s: number, variant = "C") => renderToStaticMarkup(React.createElement(CuteBird as any, { id, variant, size: s, letter: variant === "C" }));
const sparrow = BIRDS.find((b: any) => b.id === "sparrow")!;
const SLOW = formatMinutes(sparrow.minutesSeoulBusan); // 앱 계산식 그대로(예: 11시간 36분)

const C = { navy: "#1E3A5C", dahong: "#E2512A", ink: "#16110E", hanji: "#FBF3E4", cream: "#FFF8EC", gold: "#F0BC5C" };
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


const paper = (lines: string, from: string) => `<div style="position:absolute;left:110px;right:110px;top:430px;background:#fffdf7;border-radius:30px;padding:70px 70px 60px;box-shadow:0 30px 60px rgba(60,30,10,.16);border:2px solid #efe2c8">
  <div style="font-size:52px;font-weight:700;line-height:1.55;letter-spacing:-1.5px;color:${C.ink}">${lines}</div>
  <div style="margin-top:40px;text-align:right;font-size:38px;font-weight:700;color:${C.dahong}">${from}</div>
  <div style="position:absolute;right:60px;top:-46px;width:96px;height:96px;border-radius:50%;background:${C.dahong};color:#fff;font-size:26px;font-weight:900;display:flex;align-items:center;justify-content:center;line-height:1.1;text-align:center;transform:rotate(-8deg)">새<br>편지</div></div>`;
const end = (line: string) => `<body style="background:${C.dahong};color:#fff;text-align:center">
     <img src="${icon}" style="position:absolute;left:390px;top:200px;width:300px;height:300px;border-radius:70px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
     <div style="position:absolute;left:0;right:0;top:560px;font-size:120px;font-weight:900;letter-spacing:-5px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:730px;font-size:46px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:80px;right:80px;top:850px;font-size:36px;font-weight:600;letter-spacing:-1px;opacity:.92">${line}</div>
     <div style="position:absolute;left:290px;right:290px;top:990px;padding:28px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:38px;font-weight:800;letter-spacing:-1px">App Store · 무료</div>
     <div style="position:absolute;left:0;right:0;top:1130px;font-size:30px;font-weight:700;letter-spacing:-.5px">안드로이드는 지금 웹으로 · bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1190px;font-size:28px;font-weight:600;opacity:.85;letter-spacing:-.5px">링크는 프로필에 @saepyeonji</div></body>`;


const N = 5;
const endCard = `<body style="background:${C.navy};color:#fff;text-align:center">
     <div style="position:absolute;left:80px;right:80px;top:150px;font-size:76px;font-weight:900;line-height:1.25;letter-spacing:-3px">여러분은 누구에게<br>편지를 보내고 싶나요?</div>
     <img src="${icon}" style="position:absolute;left:420px;top:470px;width:240px;height:240px;border-radius:56px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
     <div style="position:absolute;left:0;right:0;top:750px;font-size:100px;font-weight:900;letter-spacing:-4px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:890px;font-size:44px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:290px;right:290px;top:1010px;padding:26px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:38px;font-weight:800;letter-spacing:-1px">App Store · 무료</div>
     <div style="position:absolute;left:0;right:0;top:1140px;font-size:30px;font-weight:700;letter-spacing:-.5px">안드로이드는 지금 웹으로 · bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1196px;font-size:28px;font-weight:600;opacity:.85;letter-spacing:-.5px">링크는 프로필에 @saepyeonji</div></body>`;
const slides = [
  `<body style="background:${C.navy};color:#fff">
     <div style="position:absolute;left:80px;top:150px" class="big">답장,<br>천천히 와도<br>괜찮은 대화.</div>
     <div style="position:absolute;left:84px;top:560px;font-size:46px;font-weight:700;letter-spacing:-1.2px;opacity:.95">그런 메신저가 있었으면 했어요.</div>
     <div style="position:absolute;right:20px;top:720px;transform:rotate(-6deg)">${bird("pigeon", 580)}</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.ink};color:#fff">
     <div style="position:absolute;left:80px;top:160px" class="big" ><span style="opacity:.55">빨리 답해야<br>한다는 부담</span><br>대신,</div>
     <div style="position:absolute;left:80px;top:660px" class="big"><span style="color:${C.dahong}">편지가 오는<br>설렘을.</span></div>
     <div style="position:absolute;right:40px;top:1000px;font-size:120px">💌</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:120px" class="big">마음을 적고,<br><span style="color:${C.dahong}">새에게 맡기는<br>시간. 🕊</span></div>
     ${phone("ad-room.png", { left: 260, top: 560, h: 880, shift: 0, rot: 3 })}
     ${tag(false)}</body>`,
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:110px;font-size:80px;font-weight:900;line-height:1.15;letter-spacing:-3.5px">실제 거리 ×<br><span style="color:${C.dahong}">새의 비행 속도</span></div>
     <div style="position:absolute;left:84px;top:330px" class="mid">서울 → 부산, 이만큼 천천히 와요</div>
     <div style="position:absolute;left:80px;right:80px;top:420px">
       ${[["hawk","매"],["pigeon","비둘기"],["magpie","까치"],["sparrow","참새"]].map(([id, n]) => `<div class="diary" style="justify-content:space-between"><span style="display:flex;align-items:center;gap:18px">${renderToStaticMarkup(React.createElement(CuteBird as any, { id, variant: "A", size: 92 }))}${n}</span><b style="font-size:46px;color:${C.dahong}">${T(id)}</b></div>`).join("")}
     </div>
     <div style="position:absolute;left:84px;top:1150px;font-size:28px;font-weight:600;opacity:.6;letter-spacing:-.5px">실제 새의 비행 속도를 바탕으로 한 대략값이에요</div>
     ${tag(false)}</body>`,
  endCard,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c9");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `slow-${i + 1}.html`);
  const dark = /^\s*<body style="background:(#E2512A|#16110E|#1E3A5C)/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${i > 0 && i < N - 1 ? `<div class="cnt" style="color:${dark ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c9-slow-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c9", i + 1);
}
await browser.close();
