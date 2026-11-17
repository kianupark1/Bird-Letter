/**
 * 넘겨 보는 글 10차 — "기다림은 위로입니다"(2026-11-18 대표님: "오방색 중 다른 색으로, 우리네 인생 상대방을 통해 위로받는다,
 * 기다림이 사라진 세상, 기다림은 위로입니다 느낌으로"). 그날 격자 색(11/18 황토)을 첫 장에. 결과: promo/cards/c10-wi-1~5.png·.jpg
 * (아래는 7차 설명)
 * 넘겨 보는 글 7차 — "답장 느린 친구에게, 어디 한번 더 느려 봐라"(2026-11-16 대표님). 바탕은 6차 — "만든 사람의 글"(Carrier Pidge가 터진 방식): npx tsx promo/build-carousel6.mts
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

const C = { dahong: "#E2512A", ink: "#16110E", hanji: "#FBF3E4", cream: "#FFF8EC", gold: "#F0BC5C", hwang: "#E0A83C", nam: "#1E3A5C" };
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
  // 1. 훅 (황토)
  `<body style="background:${C.hwang};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px" class="mid">우리네 인생은</div>
     <div style="position:absolute;left:80px;top:210px" class="big">결국 누군가에게<br>위로받으며<br>살아가요.</div>
     <div style="position:absolute;right:40px;top:700px;transform:rotate(-6deg)">${bird("magpie", 560)}</div>
     ${tag(false)}</body>`,
  // 2. 기다림이 사라진 세상 (한지)
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:110px" class="big">그런데 요즘은<br><span style="color:${C.dahong}">기다림이 없어요.</span></div>
     <div style="position:absolute;left:80px;right:80px;top:470px">
       <div class="row" style="border-color:rgba(22,17,14,.12)"><b>답장</b><span>1초</span></div>
       <div class="row" style="border-color:rgba(22,17,14,.12)"><b>택배</b><span>새벽</span></div>
       <div class="row" style="border-color:rgba(22,17,14,.12)"><b>영상</b><span>바로</span></div>
     </div>
     <div style="position:absolute;left:84px;top:1010px" class="mid">다 빨라졌는데, 마음은 왜 더 허전할까요.</div>
     ${tag(false)}</body>`,
  // 3. 편지를 보내 놓고 (남색)
  `<body style="background:${C.nam};color:#fff">
     <div style="position:absolute;left:80px;top:120px" class="big">편지를 보내 놓고<br><span style="color:${C.gold}">기다리는 시간.</span></div>
     <div style="position:absolute;left:84px;top:400px" class="mid">새가 실제 거리만큼 날아가요.<br>지금 어디쯤인지 같이 보면서.</div>
     ${phone("ad-home.png", { left: 420, top: 580, h: 900, shift: 150, rot: -4 })}
     ${tag(true)}</body>`,
  // 4. 그게 위로 (크림)
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px" class="big">기다리는 동안<br>그 사람을<br><span style="color:${C.dahong}">생각하게 돼요.</span></div>
     <div style="position:absolute;left:84px;top:560px" class="mid">"잘 지내고 있을까."<br>"이 편지 읽고 웃었으면."</div>
     <div style="position:absolute;left:84px;top:800px;font-size:64px;font-weight:900;letter-spacing:-2.5px">그 마음이, 서로에게<br>위로가 돼요. 🕊</div>
     ${tag(false)}</body>`,
  // 5. 엔드 카드 (황토)
  `<body style="background:${C.hwang};color:${C.ink};text-align:center">
     <div style="position:absolute;left:0;right:0;top:150px;font-size:96px;font-weight:900;letter-spacing:-4px">기다림은<br>위로입니다.</div>
     <img src="${icon}" style="position:absolute;left:420px;top:450px;width:240px;height:240px;border-radius:56px;box-shadow:0 30px 60px rgba(0,0,0,.2)">
     <div style="position:absolute;left:0;right:0;top:730px;font-size:100px;font-weight:900;letter-spacing:-4px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:880px;font-size:44px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:290px;right:290px;top:990px;padding:26px 0;border-radius:999px;background:${C.ink};color:#fff;font-size:38px;font-weight:800;letter-spacing:-1px">App Store · 무료</div>
     <div style="position:absolute;left:0;right:0;top:1130px;font-size:30px;font-weight:700;letter-spacing:-.5px">안드로이드는 지금 웹으로 · bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1186px;font-size:28px;font-weight:600;opacity:.8;letter-spacing:-.5px">링크는 프로필에 @saepyeonji</div></body>`,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c10");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `wi-${i + 1}.html`);
  const light = /background:#1E3A5C/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${i > 0 && i < N - 1 ? `<div class="cnt" style="color:${light ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c10-wi-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c10 wi", i + 1);
}
await browser.close();
