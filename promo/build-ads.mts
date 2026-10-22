/**
 * 유료 광고(인스타·페이스북 피드)용 그림 생성기: npx tsx promo/build-ads.mts
 * 세로 4:5(1080×1350) 3장 → promo/ads/ad-1-problem.png, ad-2-map.png, ad-3-scroll.png (원본 HTML은 promo/ads-src)
 * 앱의 새 그림(BirdIcon)·실제 해안선(core/koreaGeo)·소요 시간 계산식을 그대로 써서 숫자가 앱과 같아요.
 * 문구 규칙(promo/출시-홍보.md 1번): "실제 새 속도와 같다" 금지, 없는 혜택 금지, 뽑기 상품이 없으니 확률 표시 불필요.
 * 광고는 스토어 출시 뒤에 돌리므로 받는 곳 문구(promo/store.mts)를 넣어요.
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");
const { getBird } = await import("../core/birds.ts");
const { travelMinutes, formatMinutes } = await import("../core/geo.ts");
const { getRoute } = await import("../core/routes.ts");
const { koreaMapSvg } = await import("./mapArt.mts");
const { STORE_SHORT } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const FONT = resolve(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const mins = (id: string, km: number) => formatMinutes(Math.max(1, travelMinutes(getBird(id), km)));
const BUSAN = getRoute("seoul-busan").km;
const shot = (f: string) => "data:image/png;base64," + readFileSync(resolve(root, "promo/store", f)).toString("base64");

const BASE = `${css}
@font-face { font-family: P; src: url("file://${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: P, sans-serif; color: #2A2118; background: #FBF3E4; position: relative; overflow: hidden; }
svg { overflow: visible; display: block; }
.band { position: absolute; left: 0; right: 0; top: 0; height: 18px; display: flex; z-index: 5; }
.band i { flex: 1; } .band i:nth-child(1){background:#C1481F} .band i:nth-child(2){background:#E0A83C} .band i:nth-child(3){background:#1B6E5C} .band i:nth-child(4){background:#1E3A5C} .band i:nth-child(5){background:#FBF3E4;border-bottom:2px solid #C1481F}
h1 { font-size: 92px; line-height: 1.13; letter-spacing: -2.5px; font-weight: 850; }
.hl { color: #C1481F; } .gold { color: #F0BC5C; }
.sub { font-size: 38px; line-height: 1.45; opacity: .8; margin-top: 20px; font-weight: 500; }
/* 아래 "받으러 가기" 띠: 광고의 [자세히 보기] 버튼 바로 위에 오는 자리 */
.cta { position: absolute; left: 60px; right: 60px; bottom: 54px; height: 128px; border-radius: 40px; background: #C1481F; color: #fff; display: flex; align-items: center; gap: 22px; padding: 0 40px; box-shadow: 0 10px 0 #8E3214; }
.cta b { font-size: 44px; font-weight: 850; } .cta span { font-size: 28px; opacity: .92; display: block; margin-top: 4px; font-weight: 600; }
.cta .free { margin-left: auto; background: #FBF3E4; color: #C1481F; font-weight: 850; font-size: 34px; padding: 12px 24px; border-radius: 999px; }
.logo { display: flex; align-items: center; gap: 12px; font-size: 34px; font-weight: 850; }
`;
const BAND = `<div class="band"><i></i><i></i><i></i><i></i><i></i></div>`;
const CTA = (birdId = "magpie") => `<div class="cta"><div style="width:96px;flex:none">${bird(birdId, 96, true)}</div><div><b>새 편지 · 무료</b><span>${STORE_SHORT}</span></div><div class="free">받기</div></div>`;

const ads: { file: string; html: string }[] = [
  // ① 고객의 문제로 시작: 너무 빠른 답장 → 기다림이 설레는 편지
  { file: "ad-1-problem", html: `<style>body{background:#16243A;color:#FBF3E4}</style>${BAND}
    <div style="position:absolute;left:72px;right:72px;top:96px">
      <h1>답장이 너무 빨라서<br><span class="gold">설레지 않을 때</span></h1>
      <p class="sub" style="opacity:.85">새가 실제 거리만큼 날아서 전해 주는<br>느린 편지가 있어요</p>
    </div>
    <div style="position:absolute;left:72px;top:520px;display:flex;flex-direction:column;gap:18px;opacity:.55">
      ${["ㅇㅇ", "ㅋㅋㅋ", "읽음"].map((t, i) => `<div style="align-self:${i % 2 ? "flex-end" : "flex-start"};margin-left:${i % 2 ? 150 : 0}px;background:#2C3B55;border-radius:28px;padding:16px 28px;font-size:34px;font-weight:700;text-decoration:line-through;text-decoration-thickness:3px">${t}</div>`).join("")}
    </div>
    <svg width="1080" height="1350" style="position:absolute;inset:0;pointer-events:none"><path d="M90 930 C 300 960, 520 900, 700 840" fill="none" stroke="#F0BC5C" stroke-width="6" stroke-dasharray="4 18" stroke-linecap="round" opacity=".8"/></svg>
    <div style="position:absolute;right:60px;top:500px;transform:rotate(-6deg)">${bird("magpie", 470, true)}</div>
    <div style="position:absolute;left:72px;top:1030px;font-size:34px;font-weight:700;color:#F0BC5C">“아침 까치가 울면 반가운 소식이 온다”</div>
    ${CTA()}` },

  // ② 같이 기다리는 지도: 실제 앱 화면(대화방)을 폰 모양 안에
  { file: "ad-2-map", html: `${BAND}
    <div style="position:absolute;left:0;right:0;top:380px;bottom:0;overflow:hidden">${koreaMapSvg({ w: 1080, h: 970, from: "seoul", to: "busan", p: 0.45, light: true, faded: true })}</div>
    <div style="position:absolute;left:66px;right:66px;top:84px">
      <h1 style="font-size:84px">엄마에게 보낸 편지가<br><span class="hl">지금 대전을 지나는 중</span></h1>
      <p class="sub">보낸 사람도 받는 사람도 같이 지켜봐요</p>
    </div>
    <div style="position:absolute;left:50%;top:420px;transform:translateX(-50%) rotate(-2deg);width:470px;height:836px;border-radius:64px;background:#1A1613;padding:16px;box-shadow:0 30px 60px rgba(42,33,24,.35)">
      <div style="width:100%;height:100%;border-radius:50px;overflow:hidden;background:#FBF3E4"><img src="${shot("phone-2-room.png")}" style="width:100%;display:block"></div>
    </div>
    <div style="position:absolute;right:56px;top:560px;background:#fff;border-radius:28px;padding:18px 26px;font-size:30px;font-weight:800;box-shadow:0 8px 0 rgba(42,33,24,.08);transform:rotate(4deg)">🕊 까치 · 서울 → 부산<br><span class="hl">${mins("magpie", BUSAN)} 걸려요</span></div>
    ${CTA("crane")}` },

  // ③ 도착하면 두루마리처럼 펼쳐져요 + 폴라로이드
  { file: "ad-3-scroll", html: `<style>
      .scroll{position:absolute;left:150px;width:780px;top:480px;height:420px;background:#FFFDF6;border-radius:12px;box-shadow:0 14px 40px rgba(42,33,24,.18);padding:58px 70px}
      .rod{position:absolute;left:120px;width:840px;height:46px;border-radius:23px;background:linear-gradient(#B07A4A,#7A4E2A 60%,#5B3A29)}
      .line{font-size:42px;line-height:1.7;font-weight:600;color:#3A2F25}
      .pola{position:absolute;right:70px;top:860px;width:260px;background:#fff;padding:18px 18px 64px;box-shadow:0 14px 30px rgba(42,33,24,.25);transform:rotate(7deg)}
      .pola i{display:block;height:220px;background:linear-gradient(#9CC7E0,#E9D7B5 70%,#C9A27A);position:relative}
    </style>${BAND}
    <div style="position:absolute;left:72px;right:72px;top:96px;text-align:center">
      <h1>편지가 도착하면<br><span class="hl">두루마리처럼 펼쳐져요</span></h1>
      <p class="sub">사진은 폴라로이드처럼 천천히 선명해져요</p>
    </div>
    <div class="rod" style="top:450px"></div>
    <div class="scroll">
      <div class="line">엄마, 이번 주말에 내려갈게요.</div>
      <div class="line">된장찌개 해 주세요 🙂</div>
      <div class="line" style="opacity:.55">오늘 하늘이 예뻐서 생각났어요.</div>
      <div style="position:absolute;right:60px;bottom:46px;width:92px;height:92px;border:4px solid #C1481F;border-radius:14px;color:#C1481F;font-weight:900;font-size:30px;display:grid;place-items:center;transform:rotate(-8deg);line-height:1.05;text-align:center">새<br>편지</div>
    </div>
    <div class="rod" style="top:880px"></div>
    <div class="pola"><i></i></div>
    <div style="position:absolute;left:110px;top:900px;transform:rotate(-6deg)">${bird("crane", 230, true)}</div>
    ${CTA("crane")}` },
];

mkdirSync(resolve(root, "promo/ads-src"), { recursive: true });
mkdirSync(resolve(root, "promo/ads"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const a of ads) {
  const htmlPath = resolve(root, `promo/ads-src/${a.file}.html`);
  writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${a.html}</body></html>`, "utf8");
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("file://" + htmlPath);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: resolve(root, `promo/ads/${a.file}.png`) });
  await ctx.close();
  console.log(a.file);
}
await browser.close();
