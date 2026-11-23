/**
 * 넘겨 보는 글 13차 — 대표 광고(첫 장은 영상 promo/video/card/reel-master.mp4, 이 카드는 2~7장): npx tsx promo/build-carousel13.mts
 * 2026-11-23 대표님: "누구나 쓰는 자기 모습을 상상하게, 다운받고 싶게. 애플 링크는 프로필 안내, 플레이스토어는 11월 중 출시."
 * 기능은 앱에 실제로 있는 것만(비·눈 오는 날 천천히 = core/weather.ts). 결과: promo/cards/c13-master-2~7 (.png·.jpg)
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

const C = { meok: "#16110E", navy: "#1E3A5C", dahong: "#E2512A", ink: "#16110E", hanji: "#FBF3E4", cream: "#FFF8EC", gold: "#F0BC5C" };
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





const N = 7; // 영상 1장 + 카드 6장
const feat = (i: string, t: string, s: string) => `<div style="display:flex;gap:30px;align-items:center;margin-bottom:44px"><span style="flex:none;width:110px;height:110px;border-radius:30px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:62px;box-shadow:0 10px 24px rgba(60,30,10,.10)">${i}</span><div><div style="font-size:50px;font-weight:900;letter-spacing:-1.8px">${t}</div><div style="font-size:34px;font-weight:600;opacity:.65;margin-top:6px;letter-spacing:-.8px">${s}</div></div></div>`;
const slides = [
  `<body style="background:#E0A83C;color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px;font-size:94px;font-weight:900;line-height:1.12;letter-spacing:-4px">카톡 말고,<br><span style="color:#fff">새가 물어다<br>주는 편지</span></div>
     ${phone("ad-room.png", { left: 470, top: 520, h: 790, shift: 0, rot: 4 })}
     <div style="position:absolute;left:84px;top:620px;width:380px;font-size:42px;font-weight:700;line-height:1.45;letter-spacing:-1.2px">보낸 편지가<br>지도 위를<br>진짜로 날아가요.<br><br>보낸 사람도,<br>받는 사람도<br>같이 지켜봐요.</div>
     ${tag(false)}</body>`,
  `<body style="background:${C.navy};color:#fff">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">서울 → 부산,<br><span style="color:${C.gold}">얼마나 걸릴까요?</span></div>
     <div style="position:absolute;left:80px;right:80px;top:470px">
       <div class="row"><b>🦅 매</b><span>${T("hawk")}</span></div><div class="row"><b>🕊 비둘기</b><span>${T("pigeon")}</span></div>
       <div class="row"><b>🐦 까치</b><span>${T("magpie")}</span></div><div class="row" style="border:0"><b>🐤 참새</b><span>${T("sparrow")}</span></div></div>
     <div style="position:absolute;left:84px;top:1080px;font-size:32px;font-weight:600;opacity:.8">실제 새의 비행 속도를 바탕으로 · 기다리는 시간도 편지예요</div>
     ${tag(true)}</body>`,
  `<body style="background:linear-gradient(#5D6F82,#8A9AAB);color:#fff">
     <div style="position:absolute;left:80px;top:90px;font-size:30px;font-weight:900;letter-spacing:0;background:${C.gold};color:${C.ink};padding:10px 24px;border-radius:99px">NEW</div>
     <div style="position:absolute;left:80px;top:170px;font-size:96px;font-weight:900;line-height:1.12;letter-spacing:-4px">비 오는 날엔,<br><span style="color:${C.gold}">새도 천천히 🌧</span></div>
     <div style="position:absolute;right:40px;top:520px;transform:rotate(6deg)">${bird("pigeon", 420)}</div>
     <div style="position:absolute;left:120px;top:540px;font-size:120px">☁️</div>
     <div style="position:absolute;left:84px;top:930px;font-size:44px;font-weight:700;line-height:1.5;letter-spacing:-1.2px">보내는 순간 진짜 날씨를 봐요.<br>비가 오면 30%, 눈이 오면 50% 더.<br><span style="color:${C.gold}">그래도 편지는 꼭 도착해요.</span></div>
     ${tag(true)}</body>`,
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:120px;font-size:84px;font-weight:900;line-height:1.15;letter-spacing:-3.5px">느린 만큼,<br><span style="color:${C.dahong}">더 특별하게.</span></div>
     <div style="position:absolute;left:80px;right:60px;top:420px">
       ${feat("📜", "도착하면 두루마리처럼", "도착 전엔 받는 사람도 못 열어요")}${feat("📸", "사진은 폴라로이드로", "도착하면 천천히 선명해져요")}${feat("💌", "앱 없는 사람에게도", "링크 하나로 날아오는 걸 봐요")}${feat("🌏", "모르는 펜팔 친구와도", "이름 대신 도시와 새로 · 만 14세 이상")}</div>
     ${tag(false)}</body>`,
  `<body style="background:${C.dahong};color:#fff">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">상상해 보세요.</div>
     <div style="position:absolute;left:84px;top:320px;font-size:52px;font-weight:700;line-height:1.75;letter-spacing:-1.5px">
       퇴근길, <span style="color:#FFE7A8">"엄마 편지가 대전을 지나요"</span><br>
       시험 끝, <span style="color:#FFE7A8">문 앞에 도착해 있는 응원</span><br>
       생일 아침, <span style="color:#FFE7A8">딱 맞춰 날아온 축하</span><br>
       비 오는 밤, <span style="color:#FFE7A8">천천히 오는 안부</span></div>
     <div style="position:absolute;right:30px;top:900px;transform:rotate(-8deg)">${bird("magpie", 380)}</div>
     <div style="position:absolute;left:84px;top:1100px;font-size:46px;font-weight:900;letter-spacing:-1.5px">기다리는 동안, 더 설레요.</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.navy};color:#fff;text-align:center">
     <div style="position:absolute;left:60px;right:60px;top:110px;font-size:80px;font-weight:900;line-height:1.2;letter-spacing:-3px">오늘, 첫 편지를<br><span style="color:${C.gold}">날려 보세요 🕊</span></div>
     <img src="${icon}" style="position:absolute;left:450px;top:370px;width:180px;height:180px;border-radius:44px;box-shadow:0 24px 50px rgba(0,0,0,.3)">
     <div style="position:absolute;left:100px;right:100px;top:600px;background:#fff;color:${C.ink};border-radius:36px;padding:34px 30px">
       <div style="font-size:44px;font-weight:900">🍎 아이폰</div>
       <div style="font-size:38px;font-weight:700;margin-top:10px">앱스토어에서 '새편지' 검색</div>
       <div style="display:inline-block;margin-top:18px;background:${C.gold};border-radius:99px;padding:16px 30px;font-size:36px;font-weight:900">👆 링크는 프로필에 @saepyeonji</div></div>
     <div style="position:absolute;left:100px;right:100px;top:930px;border:3px solid rgba(255,255,255,.5);border-radius:36px;padding:28px 30px">
       <div style="font-size:42px;font-weight:900">▶ 안드로이드</div>
       <div style="font-size:38px;font-weight:800;margin-top:8px;color:${C.gold}">구글 플레이 11월 중 출시 예정</div>
       <div style="font-size:30px;font-weight:600;margin-top:8px;opacity:.85">지금은 웹으로 · bird-letter.vercel.app</div></div>
     <div style="position:absolute;left:0;right:0;top:1230px;font-size:34px;font-weight:700">${SLOGAN}</div></body>`,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c13");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const n = i + 2; // 1장은 영상
  const html = resolve(tmp, `master-${n}.html`);
  const dark = /^\s*<body style="background:(#E2512A|#16110E|#1E3A5C|linear)/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${n < N ? `<div class="cnt" style="color:${dark ? "#fff" : C.ink}">${n}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c13-master-${n}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c13", n);
}
await browser.close();
