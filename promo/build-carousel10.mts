/**
 * 넘겨 보는 글 10차 — "상상해 보세요"(2026-11-19 대표님: "임팩트 있게, 사용하면 어떨지 상상을 자극해서 여러 장으로"): npx tsx promo/build-carousel10.mts
 * 장면은 쓰임새 예시(실제 후기 아님). 알림 문구는 앱 실제 알림 형식. 결과: promo/cards/c10-imagine-1~7 (.png·.jpg)
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
     <div style="position:absolute;left:170px;right:170px;top:990px;padding:28px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:36px;font-weight:800;letter-spacing:-1px">아이폰은 앱스토어에서 바로 받기 · 무료</div>
     <div style="position:absolute;left:0;right:0;top:1130px;font-size:30px;font-weight:700;letter-spacing:-.5px">안드로이드는 지금 웹으로 · bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1190px;font-size:28px;font-weight:600;opacity:.85;letter-spacing:-.5px">링크는 프로필에 @saepyeonji</div></body>`;


const N = 7;
const bubble = (t: string, s: string) => `<div style="background:#fff;border-radius:34px;padding:34px 40px;box-shadow:0 24px 50px rgba(0,0,0,.22);display:flex;gap:26px;align-items:center;color:${C.ink}">
  <img src="${icon}" style="width:92px;height:92px;border-radius:22px">
  <div><div style="font-size:30px;font-weight:800;opacity:.55;letter-spacing:0">새 편지 · 지금</div><div style="font-size:44px;font-weight:800;line-height:1.3;letter-spacing:-1.5px;margin-top:6px">${t}</div>${s ? `<div style="font-size:34px;font-weight:600;opacity:.7;margin-top:6px">${s}</div>` : ""}</div></div>`;
const endCard = `<body style="background:${C.navy};color:#fff;text-align:center">
     <div style="position:absolute;left:80px;right:80px;top:140px;font-size:80px;font-weight:900;line-height:1.22;letter-spacing:-3px">당신은 누구에게<br>날려 보낼래요?</div>
     <img src="${icon}" style="position:absolute;left:420px;top:450px;width:240px;height:240px;border-radius:56px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
     <div style="position:absolute;left:0;right:0;top:730px;font-size:100px;font-weight:900;letter-spacing:-4px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:870px;font-size:44px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:200px;right:200px;top:990px;padding:26px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:38px;font-weight:800;letter-spacing:-1px">🍎 앱스토어 '새편지' · 무료</div>
     <div style="position:absolute;left:200px;right:200px;top:1110px;padding:24px 0;border-radius:999px;background:${C.gold};color:${C.ink};font-size:34px;font-weight:800;letter-spacing:-1px">🤖 안드로이드 bird-letter.vercel.app</div></body>`;
const slides = [
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:150px" class="big">상상해<br>보세요.</div>
     <div style="position:absolute;left:84px;top:450px;font-size:52px;font-weight:700;line-height:1.4;letter-spacing:-1.5px">지금 이 순간,<br>누군가의 편지가<br><span style="color:${C.dahong}">당신에게 날아오고 있다면?</span></div>
     <div style="position:absolute;right:30px;top:760px;transform:rotate(-8deg)">${bird("magpie", 520)}</div>
     <div style="position:absolute;right:80px;top:90px;font-size:30px;font-weight:800;color:${C.dahong};letter-spacing:0">넘겨 보기 →</div>
     ${tag(false)}</body>`,
  `<body style="background:${C.navy};color:#fff">
     <div style="position:absolute;left:80px;top:150px;font-size:44px;font-weight:700;opacity:.8">🚇 퇴근길 지하철,</div>
     <div style="position:absolute;left:80px;top:220px" class="big">폰이<br>울려요.</div>
     <div style="position:absolute;left:70px;right:70px;top:560px">${bubble("💌 엄마가 보낸 편지가<br>대전 근처를 지나요", "도착까지 약 2시간")}</div>
     <div style="position:absolute;left:80px;top:930px;font-size:46px;font-weight:700;line-height:1.45;letter-spacing:-1.2px">엄마가 무슨 말을 썼을까.<br><span style="color:${C.gold}">집에 가는 길이 괜히 설레요.</span></div>
     ${tag(true)}</body>`,
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:150px;font-size:44px;font-weight:700;opacity:.7">✏️ 시험이 끝나고</div>
     <div style="position:absolute;left:80px;top:220px" class="big">시험장 문을<br>나서는 순간.</div>
     <div style="position:absolute;left:70px;right:70px;top:600px">${bubble("✏️ 응원 편지가<br>방금 도착했어요", "아침에 아빠가 비둘기로 보낸 편지")}</div>
     <div style="position:absolute;left:80px;top:960px;font-size:46px;font-weight:700;line-height:1.45;letter-spacing:-1.2px">폰도 못 가져가는 날,<br><span style="color:${C.dahong}">끝나자마자 기다리고 있는 한마디.</span></div>
     ${tag(false)}</body>`,
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px" class="big" style="">📸 사진이<br>천천히.</div>
     <div style="position:absolute;left:250px;top:430px;width:580px;background:#fff;padding:34px 34px 120px;box-shadow:0 30px 60px rgba(60,30,10,.22);transform:rotate(-4deg)">
       <div style="height:500px;background:linear-gradient(160deg,#f7d9b8 0%,#e9a87c 45%,#8a6a8c 100%);filter:saturate(.75);position:relative">
         <div style="position:absolute;inset:0;background:rgba(255,255,255,.45)"></div></div>
       <div style="position:absolute;left:0;right:0;bottom:36px;text-align:center;font-size:40px;font-weight:700;color:#555">우리 그날, 바다 🌊</div></div>
     <div style="position:absolute;left:80px;top:1110px;font-size:44px;font-weight:700;line-height:1.4;letter-spacing:-1.2px">같이 찍은 사진은 폴라로이드로 가요.<br><span style="color:${C.dahong}">도착하면 서서히 선명해져요.</span></div>
     ${"" }</body>`,
  `<body style="background:${C.dahong};color:#fff">
     <div style="position:absolute;left:80px;top:150px" class="big">새가 노을<br>구경하느라<br>30분 늦었대요 🌇</div>
     <div style="position:absolute;right:20px;top:700px;transform:rotate(-6deg)">${bird("pigeon", 480)}</div>
     <div style="position:absolute;left:84px;top:1060px;font-size:46px;font-weight:700;letter-spacing:-1.2px">그래도 편지는 꼭 도착해요.</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.ink};color:#fff">
     <div style="position:absolute;left:80px;top:130px;font-size:84px;font-weight:900;line-height:1.15;letter-spacing:-3.5px">보낸 사람도,<br>받는 사람도<br><span style="color:${C.gold}">같은 지도를 봐요.</span></div>
     ${phone("ad-room.png", { left: 260, top: 520, h: 760, shift: 0, rot: 3 })}
     ${tag(true)}</body>`,
  endCard,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c10");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `imagine-${i + 1}.html`);
  const dark = /^\s*<body style="background:(#E2512A|#16110E|#1E3A5C)/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${i > 0 && i < N - 1 ? `<div class="cnt" style="color:${dark ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c10-imagine-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c10", i + 1);
}
await browser.close();
