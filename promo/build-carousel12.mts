/**
 * 넘겨 보는 글 12차 — 펜팔 "펜팔, 기억나요?"(2026-11-20 대표님: "맘을 전하는 편지, 펜팔 기능을 강조"): npx tsx promo/build-carousel12.mts
 * 펜팔 설명은 앱 실제 동작(core/penpal.ts, src/app/pen) 그대로. 편지·카드 내용은 예시(실제 사용자 아님). "펜팔 친구"로만, 만 14세 이상 표시.
 * 첫 장은 11/20 격자 색 먹. 결과: promo/cards/c12-penpal-1~8 (.png·.jpg)
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




const N = 8;
const tagChip = (t: string, on = false) => `<span style="display:inline-block;padding:16px 28px;margin:0 14px 18px 0;border-radius:999px;font-size:38px;font-weight:700;letter-spacing:-1px;background:${on ? C.dahong : "#fff"};color:${on ? "#fff" : C.ink};box-shadow:0 6px 14px rgba(0,0,0,.08)">${t}</span>`;
const check = (t: string) => `<div style="display:flex;gap:24px;align-items:flex-start;margin-bottom:38px"><span style="flex:none;width:58px;height:58px;border-radius:50%;background:${C.gold};color:${C.ink};font-size:36px;font-weight:900;display:flex;align-items:center;justify-content:center">✓</span><span style="font-size:46px;font-weight:700;line-height:1.35;letter-spacing:-1.3px">${t}</span></div>`;
const card = `<div style="background:#fff;border-radius:40px;padding:50px;box-shadow:0 30px 60px rgba(60,30,10,.18);color:${C.ink}">
  <div style="display:flex;gap:30px;align-items:center"><div style="width:150px;height:150px;border-radius:50%;background:#FBE3D6;display:flex;align-items:center;justify-content:center;overflow:hidden">${bird("magpie", 150, "A")}</div>
  <div><div style="font-size:54px;font-weight:900;letter-spacing:-2px">부산 사는 까치</div><div style="font-size:32px;font-weight:600;opacity:.6;margin-top:6px">📍 부산 · 진짜 이름은 안 보여요</div></div></div>
  <div style="margin-top:36px;font-size:42px;font-weight:600;line-height:1.45;letter-spacing:-1px">"고양이 두 마리랑 사는 부산 사람이에요"</div>
  <div style="margin-top:30px">${tagChip("🐶 동물")}${tagChip("🎵 음악")}${tagChip("✈️ 여행")}</div>
  <div style="margin-top:10px;padding:28px 0;border-radius:999px;background:${C.dahong};color:#fff;text-align:center;font-size:42px;font-weight:800">✉️ 이 친구에게 첫 편지 날리기</div></div>`;
const endCard = `<body style="background:${C.navy};color:#fff;text-align:center">
     <div style="position:absolute;left:60px;right:60px;top:130px;font-size:74px;font-weight:900;line-height:1.25;letter-spacing:-3px">오늘, 모르는 누군가에게<br><span style="color:${C.gold}">첫 편지를.</span></div>
     <img src="${icon}" style="position:absolute;left:430px;top:440px;width:220px;height:220px;border-radius:52px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
     <div style="position:absolute;left:0;right:0;top:690px;font-size:96px;font-weight:900;letter-spacing:-4px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:825px;font-size:42px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:130px;right:130px;top:950px;padding:28px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:38px;font-weight:800;letter-spacing:-1px">🍎 아이폰은 앱스토어에서 바로 받기 · 무료</div>
     <div style="position:absolute;left:190px;right:190px;top:1075px;padding:22px 0;border-radius:999px;background:${C.gold};color:${C.ink};font-size:32px;font-weight:800;letter-spacing:-1px">🤖 안드로이드는 웹으로 bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1190px;font-size:28px;font-weight:600;opacity:.8;letter-spacing:-.5px">펜팔은 만 14세 이상 · 링크는 프로필에 @saepyeonji</div></body>`;
const slides = [
  `<body style="background:${C.meok};color:#fff">
     <div style="position:absolute;right:80px;top:90px;font-size:30px;font-weight:800;letter-spacing:0;color:${C.gold}">넘겨 보기 →</div>
     <div style="position:absolute;left:80px;top:170px" class="big">펜팔,<br><span style="color:${C.gold}">기억나요?</span></div>
     <div style="position:absolute;left:84px;top:460px;font-size:50px;font-weight:700;line-height:1.45;letter-spacing:-1.5px">모르는 누군가에게 편지를 쓰고<br>답장을 기다리던, 그 설렘.</div>
     <div style="position:absolute;right:20px;top:720px;transform:rotate(-8deg)">${bird("pigeon", 540)}</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px" class="big">그 감성을,<br><span style="color:${C.dahong}">폰으로.</span></div>
     <div style="position:absolute;left:80px;right:80px;top:470px">${card}</div>
     <div style="position:absolute;left:84px;top:1180px;font-size:30px;font-weight:600;opacity:.5;letter-spacing:-.5px">화면 예시 · 펜팔 카드</div>
     ${""}</body>`,
  `<body style="background:${C.navy};color:#fff">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">이름도 얼굴도<br><span style="color:${C.gold}">몰라도 괜찮아요.</span></div>
     <div style="position:absolute;left:80px;right:80px;top:430px">
       ${check("펜팔 이름은 '부산 사는 까치'처럼 자동으로")}${check("사는 곳은 도시까지만 보여요")}${check("전화번호·주소처럼 보이는 글은<br>보내기 전에 가려져요")}${check("이상한 편지는 🚩 신고·차단")}</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">좋아하는 걸로<br>고르거나,</div>
     <div style="position:absolute;left:80px;right:60px;top:440px">${tagChip("📚 책", true)}${tagChip("🎵 음악")}${tagChip("✈️ 여행", true)}${tagChip("🍳 요리")}${tagChip("🐶 동물")}${tagChip("🎮 게임")}${tagChip("🌱 식물", true)}${tagChip("⚽ 운동")}</div>
     <div style="position:absolute;left:80px;top:760px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px"><span style="color:${C.dahong}">🎲 아무에게나</span><br>날려 보거나.</div>
     <div style="position:absolute;left:84px;top:1040px;font-size:44px;font-weight:700;letter-spacing:-1.2px;line-height:1.4">어디로 갈지 모르는 편지,<br>그게 펜팔의 시작이에요.</div>
     ${tag(false)}</body>`,
  `<body style="background:${C.dahong};color:#fff">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">편지는 진짜<br>거리만큼 날아가요</div>
     <div style="position:absolute;left:80px;right:80px;top:430px">
       <div class="row"><b>🦅 매</b><span>${T("hawk")}</span></div><div class="row"><b>🕊 비둘기</b><span>${T("pigeon")}</span></div>
       <div class="row"><b>🐦 까치</b><span>${T("magpie")}</span></div><div class="row" style="border:0"><b>🐤 참새</b><span>${T("sparrow")}</span></div></div>
     <div style="position:absolute;left:84px;top:1085px;font-size:32px;font-weight:600;opacity:.85">서울 → 부산 기준 · 실제 새의 비행 속도를 바탕으로</div>
     <div style="position:absolute;left:84px;top:1145px;font-size:46px;font-weight:800;letter-spacing:-1.2px">답장을 기다리는 하루가, 펜팔의 맛.</div>
     ${tag(true)}</body>`,
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px;font-size:84px;font-weight:900;line-height:1.15;letter-spacing:-3.5px">그리고 어느 날,<br><span style="color:${C.dahong}">답장이 도착해요 📜</span></div>
     <div style="position:absolute;left:100px;right:100px;top:440px;background:#fffdf7;border-radius:26px;padding:70px 64px 60px;box-shadow:0 30px 60px rgba(60,30,10,.18)">
       <div style="position:absolute;left:-14px;right:-14px;top:-18px;height:36px;background:#E9D9B8;border-radius:18px"></div>
       <div style="position:absolute;left:-14px;right:-14px;bottom:-18px;height:36px;background:#E9D9B8;border-radius:18px"></div>
       <div style="font-size:46px;font-weight:700;line-height:1.6;letter-spacing:-1.2px">처음 인사드려요!<br>여수 바다는 오늘 유난히 파래요.<br>서울은 어때요?<br>답장 기다릴게요 🙂</div>
       <div style="margin-top:30px;text-align:right;font-size:40px;font-weight:800;color:${C.dahong}">— 여수 사는 비둘기</div></div>
     <div style="position:absolute;left:84px;top:1110px;font-size:44px;font-weight:700;line-height:1.4;letter-spacing:-1.2px">빠른 대답보다,<br><span style="color:${C.dahong}">기다려 준 마음이 먼저 와요.</span></div>
     <div style="position:absolute;right:80px;top:1250px;font-size:26px;font-weight:600;opacity:.5;letter-spacing:0">편지 내용은 예시예요</div></body>`,
  `<body style="background:${C.meok};color:#fff">
     <div style="position:absolute;left:80px;top:170px;font-size:84px;font-weight:900;line-height:1.2;letter-spacing:-3.5px">카톡은<br>친구랑 하고,</div>
     <div style="position:absolute;left:80px;top:470px;font-size:84px;font-weight:900;line-height:1.2;letter-spacing:-3.5px;color:${C.gold}">편지는<br>아직 모르는<br>펜팔 친구랑.</div>
     <div style="position:absolute;right:30px;top:820px;transform:rotate(-6deg)">${bird("magpie", 420)}</div>
     ${tag(true)}</body>`,
  endCard,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c12");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `penpal-${i + 1}.html`);
  const dark = /^\s*<body style="background:(#E2512A|#16110E|#1E3A5C)/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${i > 0 && i < N - 1 ? `<div class="cnt" style="color:${dark ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c12-penpal-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c12", i + 1);
}
await browser.close();
