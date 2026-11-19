/**
 * 넘겨 보는 글 11차 — 수능 "특별한 날엔, 특별한 메신저로"(2026-11-19 대표님: "뻔한 메시지 말고 특별한 메시지는 특별한 메신저로,
 * 새가 길을 잃는 설정도 귀엽게, 화제가 될 만하게"): npx tsx promo/build-carousel11.mts
 * 장면은 쓰임새 예시(실제 후기 아님). 길 잃음·나무 걸림 알림 문구는 core/flight.ts 앱 실제 문구 그대로.
 * 결과: promo/cards/c11-suneung-1~8 (.png·.jpg)
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



const N = 8;
const bubble = (t: string, s: string) => `<div style="background:#fff;border-radius:34px;padding:34px 40px;box-shadow:0 24px 50px rgba(0,0,0,.22);display:flex;gap:26px;align-items:center;color:${C.ink}">
  <img src="${icon}" style="width:92px;height:92px;border-radius:22px">
  <div><div style="font-size:30px;font-weight:800;opacity:.55;letter-spacing:0">새 편지 · 지금</div><div style="font-size:44px;font-weight:800;line-height:1.3;letter-spacing:-1.5px;margin-top:6px">${t}</div>${s ? `<div style="font-size:32px;font-weight:600;opacity:.7;margin-top:8px;line-height:1.35">${s}</div>` : ""}</div></div>`;
const chat = (t: string, me: boolean, extra = "") => `<div style="display:flex;justify-content:${me ? "flex-end" : "flex-start"};align-items:flex-end;gap:12px;margin-bottom:26px">
  ${me ? `<span style="font-size:26px;font-weight:700;color:#C9A227;letter-spacing:0">${extra}</span>` : ""}
  <div style="background:${me ? "#FEE500" : "#fff"};color:#222;border-radius:30px;padding:24px 34px;font-size:46px;font-weight:600;letter-spacing:-1px;box-shadow:0 6px 14px rgba(0,0,0,.06)">${t}</div></div>`;
// 어지러운 새: 머리 위 빙글 별 + 물음표
const dizzy = `<svg width="300" height="160" viewBox="0 0 300 160" style="position:absolute;left:0;top:0">
  <g fill="none" stroke="${C.gold}" stroke-width="7" stroke-linecap="round"><path d="M60 90 q40 -50 90 -20 q40 25 90 -15"/></g>
  <text x="40" y="70" font-size="60">⭐</text><text x="150" y="50" font-size="46">💫</text><text x="230" y="80" font-size="56">⭐</text></svg>`;
const loopPath = `<svg width="940" height="560" viewBox="0 0 940 560" style="position:absolute;left:70px;top:430px">
  <circle cx="90" cy="90" r="22" fill="${C.navy}"/><text x="60" y="160" font-size="40" font-weight="800" fill="${C.navy}">서울</text>
  <circle cx="850" cy="470" r="22" fill="${C.dahong}"/><text x="790" y="540" font-size="40" font-weight="800" fill="${C.dahong}">대전</text>
  <path d="M90 90 C 260 60, 330 160, 300 250 C 270 360, 140 300, 210 220 C 290 130, 470 180, 430 300 C 400 390, 300 380, 360 330 C 470 240, 620 260, 700 360 C 760 430, 800 450, 850 470" fill="none" stroke="${C.ink}" stroke-width="8" stroke-dasharray="4 22" stroke-linecap="round"/>
  <text x="330" y="150" font-size="70" font-weight="900" fill="${C.dahong}">?</text><text x="470" y="250" font-size="56" font-weight="900" fill="${C.dahong}">?</text><text x="160" y="380" font-size="52" font-weight="900" fill="${C.dahong}">??</text></svg>`;
const persimmon = (x: number, y: number, s = 1) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${70 * s}px;height:${62 * s}px;border-radius:50%;background:radial-gradient(circle at 35% 35%,#FFB347,#F07A1A 70%);box-shadow:inset -6px -8px 0 rgba(0,0,0,.08)"><div style="position:absolute;left:${24 * s}px;top:${-10 * s}px;width:${22 * s}px;height:${14 * s}px;background:#4E7A33;border-radius:50% 50% 30% 30%"></div></div>`;
const endCard = `<body style="background:${C.navy};color:#fff;text-align:center">
     <div style="position:absolute;left:60px;right:60px;top:130px;font-size:74px;font-weight:900;line-height:1.25;letter-spacing:-3px">특별한 메시지는,<br><span style="color:${C.gold}">특별한 메신저로.</span></div>
     <img src="${icon}" style="position:absolute;left:430px;top:440px;width:220px;height:220px;border-radius:52px;box-shadow:0 30px 60px rgba(0,0,0,.25)">
     <div style="position:absolute;left:0;right:0;top:690px;font-size:96px;font-weight:900;letter-spacing:-4px">새 편지</div>
     <div style="position:absolute;left:0;right:0;top:825px;font-size:42px;font-weight:700;letter-spacing:-1.5px">${SLOGAN}</div>
     <div style="position:absolute;left:130px;right:130px;top:950px;padding:28px 0;border-radius:999px;background:#fff;color:${C.ink};font-size:38px;font-weight:800;letter-spacing:-1px">🍎 아이폰은 앱스토어에서 바로 받기 · 무료</div>
     <div style="position:absolute;left:190px;right:190px;top:1075px;padding:22px 0;border-radius:999px;background:${C.gold};color:${C.ink};font-size:32px;font-weight:800;letter-spacing:-1px">🤖 안드로이드는 웹으로 bird-letter.vercel.app</div>
     <div style="position:absolute;left:0;right:0;top:1190px;font-size:28px;font-weight:600;opacity:.8;letter-spacing:-.5px">링크는 프로필에 @saepyeonji</div></body>`;
const slides = [
  // 1. 첫 장(격자에 보이는 장) — 11/19 격자 색 한지(promo/build-covers.mts DAY_COLORS)
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;right:80px;top:90px;font-size:30px;font-weight:800;letter-spacing:0;color:${C.dahong}">넘겨 보기 →</div>
     <div style="position:absolute;left:80px;top:150px;font-size:46px;font-weight:700;opacity:.8">✏️ 2026 수능</div>
     <div style="position:absolute;left:80px;top:220px" class="big">수능,<br><span style="color:${C.dahong}">끝났다.</span></div>
     <div style="position:absolute;left:84px;top:500px;font-size:50px;font-weight:700;line-height:1.4;letter-spacing:-1.5px">12년의 마지막 종이 울렸어요.<br>이제, 무슨 말을 건넬까요?</div>
     <div style="position:absolute;right:20px;top:740px;transform:rotate(-8deg)">${bird("magpie", 540)}</div>
     ${tag(false)}</body>`,
  // 2. 뻔한 메시지
  `<body style="background:#B9C9D9;color:${C.ink}">
     <div style="position:absolute;left:80px;top:140px;font-size:84px;font-weight:900;line-height:1.15;letter-spacing:-3.5px">그런데 우리,<br>또 이렇게 보낼 건가요?</div>
     <div style="position:absolute;left:80px;right:80px;top:470px">
       ${chat("수고했어", true, "1")}${chat("ㅇㅇ 고생ㅋ", true, "1")}${chat("👍", true, "1")}${chat("ㅇㅋ", false)}</div>
     <div style="position:absolute;left:80px;top:1040px;font-size:50px;font-weight:800;letter-spacing:-1.5px">1초 만에 가고, <span style="color:${C.dahong}">1초 만에 잊혀요.</span></div>
     ${tag(false)}</body>`,
  // 3. 핵심 문장
  `<body style="background:${C.navy};color:#fff">
     <div style="position:absolute;left:80px;top:170px;font-size:64px;font-weight:700;letter-spacing:-2px;opacity:.85">뻔한 날엔 뻔한 메시지.</div>
     <div style="position:absolute;left:80px;top:290px" class="big">특별한 날엔,<br><span style="color:${C.gold}">특별한<br>메신저로.</span></div>
     <div style="position:absolute;right:10px;top:760px;transform:rotate(-10deg)">${bird("pigeon", 520)}</div>
     <div style="position:absolute;left:84px;top:1090px;font-size:40px;font-weight:600;opacity:.85;letter-spacing:-1px">새가 실제 거리만큼 날아서 전해 줘요.</div>
     ${tag(true)}</body>`,
  // 4. 시험장 나오는 순간 알림
  `<body style="background:${C.cream};color:${C.ink}">
     <div style="position:absolute;left:80px;top:150px;font-size:44px;font-weight:700;opacity:.7">🔔 시험장 문을 나서는 순간</div>
     <div style="position:absolute;left:80px;top:220px" class="big">폰을 켜자<br>도착해 있어요.</div>
     <div style="position:absolute;left:70px;right:70px;top:600px">${bubble("✏️ 엄마가 보낸 편지가<br>도착했어요", "아침에 시험장 들어갈 때 보냈대요<br>끝날 즈음 닿게, 비둘기로")}</div>
     <div style="position:absolute;left:80px;top:1000px;font-size:46px;font-weight:700;line-height:1.45;letter-spacing:-1.2px">하루 종일 날아온 한마디.<br><span style="color:${C.dahong}">그래서 더 오래 남아요.</span></div>
     ${tag(false)}</body>`,
  // 5. 길 잃은 새(귀엽게)
  `<body style="background:${C.hanji};color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">근데 새가…<br><span style="color:${C.dahong}">길을 잃었대요 🧭</span></div>
     ${loopPath}
     <div style="position:absolute;left:330px;top:560px;transform:rotate(14deg)"><div style="position:relative">${bird("magpie", 330)}<div style="position:absolute;left:10px;top:-90px">${dizzy}</div></div></div>
     <div style="position:absolute;left:70px;right:70px;top:1010px">${bubble("까치가 길을 잃었어요!", "길을 다시 찾는 중이에요. 편지는 꼭 도착해요.")}</div>
     <div style="position:absolute;right:70px;top:64px;font-size:26px;font-weight:700;opacity:.5;letter-spacing:0">아주 가끔 생겨요</div></body>`,
  // 6. 감나무에 걸린 새
  `<body style="background:#CFE6F5;color:${C.ink}">
     <div style="position:absolute;left:80px;top:130px;font-size:90px;font-weight:900;line-height:1.15;letter-spacing:-4px">이번엔<br><span style="color:#D2601A">감나무에 걸렸대요 🍊</span></div>
     <div style="position:absolute;left:-60px;top:640px;width:1300px;height:44px;background:#6B4A2E;border-radius:30px;transform:rotate(-8deg)"></div>
     <div style="position:absolute;left:520px;top:560px;width:420px;height:30px;background:#6B4A2E;border-radius:30px;transform:rotate(-34deg)"></div>
     ${persimmon(130, 690)}${persimmon(260, 660, 1.2)}${persimmon(760, 560, 1.1)}${persimmon(880, 470)}${persimmon(620, 640, .9)}
     <div style="position:absolute;left:330px;top:430px;transform:rotate(-6deg)">${bird("magpie", 360, "A")}</div>
     <div style="position:absolute;left:470px;top:410px;font-size:70px">💦</div>
     <div style="position:absolute;left:70px;right:70px;top:960px">${bubble("까치가 나무에 걸렸어요!", "가지에서 빠져나오는 중이에요. 조금 늦어지지만 편지는 꼭 도착해요.")}</div>
     <div style="position:absolute;left:84px;top:1230px;font-size:34px;font-weight:700;letter-spacing:-1px;opacity:.7">늦어지는 것까지 둘 다 지도로 같이 봐요 😆</div></body>`,
  // 7. 도착 — 두루마리 편지 + 폴라로이드
  `<body style="background:${C.dahong};color:#fff">
     <div style="position:absolute;left:80px;top:130px;font-size:84px;font-weight:900;line-height:1.15;letter-spacing:-3.5px">그리고 마침내,<br>편지가 펼쳐져요 📜</div>
     <div style="position:absolute;left:100px;right:100px;top:440px;background:#fffdf7;border-radius:26px;padding:70px 64px 60px;box-shadow:0 30px 60px rgba(60,20,10,.25);color:${C.ink}">
       <div style="position:absolute;left:-14px;right:-14px;top:-18px;height:36px;background:#E9D9B8;border-radius:18px"></div>
       <div style="position:absolute;left:-14px;right:-14px;bottom:-18px;height:36px;background:#E9D9B8;border-radius:18px"></div>
       <div style="font-size:46px;font-weight:700;line-height:1.6;letter-spacing:-1.2px">12년 동안 정말 고생 많았어.<br>결과가 어떻든<br>오늘 네가 제일 자랑스러워.<br>저녁에 맛있는 거 먹자.</div>
       <div style="margin-top:30px;text-align:right;font-size:40px;font-weight:800;color:${C.dahong}">— 엄마가</div></div>
     <div style="position:absolute;right:70px;top:1000px;width:250px;background:#fff;padding:16px 16px 54px;box-shadow:0 20px 40px rgba(0,0,0,.25);transform:rotate(6deg)">
       <div style="height:200px;background:linear-gradient(160deg,#f7d9b8,#e9a87c 50%,#8a6a8c);opacity:.8"></div>
       <div style="position:absolute;left:0;right:0;bottom:12px;text-align:center;font-size:24px;font-weight:700;color:#555">합격 기원 🍀</div></div>
     <div style="position:absolute;left:84px;top:1080px;font-size:38px;font-weight:700;line-height:1.4;letter-spacing:-1px">사진은 폴라로이드로,<br>천천히 선명해져요.</div>
     ${tag(true)}</body>`,
  endCard,
];

const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c11");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `suneung-${i + 1}.html`);
  const dark = /^\s*<body style="background:(#E2512A|#16110E|#1E3A5C)/.test(slides[i]);
  writeFileSync(html, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head>${slides[i].replace("</body>", `${i > 0 && i < N - 1 && i !== 4 ? `<div class="cnt" style="color:${dark ? "#fff" : C.ink}">${i + 1}/${N}</div>` : ""}</body>`)}</html>`);
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c11-suneung-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c11", i + 1);
}
await browser.close();
