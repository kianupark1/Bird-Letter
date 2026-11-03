/**
 * 12차 시안: 연말 한정 새(첫 유료 상품) + 펜팔 우표(하루 5통 무료).
 * 2026-11-03 대표님: "유료 상품은 연말 타겟팅, 펜팔 우표 5통 공짜, 광고 없음, 꾸미기는 나중에".
 * 실행: npx tsx docs/시안/build-v12.mts → docs/시안/images/v12-*.png
 * 새 그림은 앱의 귀여운 새(CuteArt A)를 그대로 쓰고, 한정 새 표시(모자·목도리·복주머니)만 덧그려요.
 * 한정 새의 속도·사고 확률은 바탕 새(까치·비둘기·매)와 똑같아요(시간을 돈으로 사는 것처럼 보이지 않게).
 */
import { renderToStaticMarkup } from "react-dom/server";
import * as ReactNS from "react";
const React: any = (ReactNS as any).default ?? ReactNS;
(globalThis as any).React = React;
const h = React.createElement;
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const CB: any = await import("../../src/components/CuteBird");
const CuteArt: any = CB.CuteArt ?? CB.default?.CuteArt;

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "images");
mkdirSync(OUT, { recursive: true });
const FONT = resolve(here, "../../node_modules/pretendard/dist/web/static/woff2");

/* 한정 새 표시(viewBox 200x160, 머리 중심 140,60 반지름 26) */
const SANTA = `<path d="M114 48 Q118 22 146 14 Q166 10 176 24 Q160 18 152 30 Q166 34 166 46 Z" fill="#C1481F" stroke="rgba(42,33,24,.25)" stroke-width="2.4" stroke-linejoin="round"/>
<rect x="110" y="42" width="60" height="12" rx="6" fill="#FFF9EC" stroke="rgba(42,33,24,.2)" stroke-width="2"/><circle cx="178" cy="26" r="7" fill="#FFF9EC" stroke="rgba(42,33,24,.2)" stroke-width="2"/>`;
const SCARF = `<path d="M116 80 Q140 92 164 80 L166 90 Q140 102 114 90 Z" fill="#C1481F" stroke="rgba(42,33,24,.25)" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M124 92 L118 120 L130 120 L134 94 Z" fill="#C1481F" stroke="rgba(42,33,24,.25)" stroke-width="2.2" stroke-linejoin="round"/>
<path d="M120 84 l4 2 M132 88 l4 1 M146 88 l4 -1 M156 84 l4 -2 M120 106 h10 M119 113 h10" stroke="#FFF9EC" stroke-width="2.4" stroke-linecap="round"/>
<g fill="#fff" opacity=".95"><circle cx="34" cy="30" r="4"/><circle cx="66" cy="18" r="3"/><circle cx="186" cy="110" r="3.5"/><circle cx="20" cy="76" r="2.6"/><circle cx="84" cy="50" r="2.4"/></g>`;
const BOK = `<g transform="translate(160 68) scale(1.35)"><path d="M6 4 Q-2 22 10 30 Q22 34 30 26 Q38 14 26 4 Z" fill="#C1481F" stroke="rgba(42,33,24,.25)" stroke-width="2.2"/>
<path d="M4 4 Q16 -2 28 4" stroke="#E0A83C" stroke-width="4" stroke-linecap="round" fill="none"/><text x="17" y="24" font-size="12" font-weight="800" fill="#F0BC5C" text-anchor="middle" font-family="sans-serif">福</text></g>
<path d="M112 40 Q140 22 168 40" stroke="#E0A83C" stroke-width="5" stroke-linecap="round" fill="none"/><circle cx="140" cy="30" r="5" fill="#1B6E5C"/>`;

const LIMITED = [
  { id: "snow-magpie", base: "magpie", name: "눈꽃 까치", extra: SCARF, over: true, tag: "느린 새 · 까치와 같은 속도", when: "12월 1일 ~ 12월 31일", price: "1,500원", bg: "#E8F0F6" },
  { id: "santa-pigeon", base: "pigeon", name: "산타 비둘기", extra: SANTA, over: true, tag: "중간 새 · 비둘기와 같은 속도", when: "12월 15일 ~ 12월 31일", price: "1,500원", bg: "#FBE6DF" },
  { id: "bok-hawk", base: "hawk", name: "복주머니 매", extra: BOK, over: true, tag: "빠른 새 · 매와 같은 속도", when: "12월 26일 ~ 설날 연휴", price: "1,500원", bg: "#FFF1D6" },
];
const art = (base: string, extra = "", over = true, letter = false) => {
  const b = renderToStaticMarkup(h(CuteArt, { id: base, variant: "A", letter }));
  return `<svg viewBox="0 0 200 160" width="100%" height="100%">${over ? b + extra : extra + b}</svg>`;
};

const CSS = `
@font-face{font-family:P;font-weight:400;src:url(file://${FONT}/Pretendard-Regular.woff2)}
@font-face{font-family:P;font-weight:700;src:url(file://${FONT}/Pretendard-Bold.woff2)}
@font-face{font-family:P;font-weight:800;src:url(file://${FONT}/Pretendard-ExtraBold.woff2)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:P,sans-serif;background:#d9d2c4;color:#2A2118;display:flex;gap:24px;padding:24px;align-items:flex-start}
.ph{width:390px;height:844px;background:#FBF3E4;border-radius:36px;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.15)}
.sb{height:46px;display:flex;justify-content:space-between;padding:14px 28px 0;font-size:15px;font-weight:700}
.saek{height:6px;background:linear-gradient(90deg,#C1481F 0 25%,#E0A83C 25% 50%,#1B6E5C 50% 75%,#1E3A5C 75%)}
h2{font-size:24px;font-weight:800;padding:14px 20px 4px}.sub{font-size:15px;opacity:.65;padding:0 20px 12px;line-height:1.45}
.card{margin:8px 16px;border-radius:22px;padding:12px 14px;display:flex;gap:12px;align-items:center;background:#fff;box-shadow:0 2px 0 rgba(42,33,24,.12)}
.card .art{width:112px;height:90px;border-radius:16px;flex:none;padding:4px}
.card b{font-size:19px;display:block}.card small{display:block;font-size:13px;opacity:.7;margin-top:3px;line-height:1.4}
.badge{display:inline-block;font-size:12px;font-weight:800;color:#fff;background:#C1481F;border-radius:10px;padding:2px 8px;margin-bottom:4px}
.price{margin-left:auto;font-weight:800;color:#C1481F;font-size:16px;white-space:nowrap}
.note{margin:10px 16px 0;font-size:13px;line-height:1.5;opacity:.7;background:rgba(224,168,60,.15);border-radius:14px;padding:10px 12px}
.room{flex:1;background:#FBF3E4}
.picker{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:8px 10px;background:#FBF3E4;border-top:1px solid rgba(42,33,24,.1)}
.pk{border-radius:14px;padding:4px 2px 6px;text-align:center;background:#fff;border:2px solid transparent;position:relative}
.pk.on{border-color:#C1481F;background:#FBE6DF}.pk .a{height:44px}.pk b{font-size:13px;display:block}.pk small{font-size:11px;opacity:.65}
.pk .lk{position:absolute;top:-6px;right:-4px;background:#C1481F;color:#fff;font-size:10px;font-weight:800;border-radius:8px;padding:1px 5px}
.input{display:flex;gap:8px;padding:8px 12px 26px}.input div{flex:1;border:1.5px solid rgba(42,33,24,.2);border-radius:22px;padding:12px 14px;font-size:15px;opacity:.6;background:#fff}
.send{width:46px;height:46px;border-radius:50%;background:#C1481F;color:#fff;display:grid;place-items:center;font-size:20px}
.dim{position:absolute;inset:0;background:rgba(0,0,0,.35)}
.sheet{position:absolute;left:0;right:0;bottom:0;background:#FBF3E4;border-radius:28px 28px 0 0;padding:18px 20px 30px;text-align:center}
.sheet .big{height:160px}.sheet h3{font-size:22px;font-weight:800;margin-top:4px}.sheet p{font-size:15px;opacity:.7;line-height:1.5;margin:6px 0 14px}
.btn{display:block;width:100%;border-radius:20px;padding:17px;font-size:18px;font-weight:800;background:#C1481F;color:#fff;box-shadow:0 4px 0 #8f3415;margin-top:8px}
.btn2{display:block;width:100%;padding:14px;font-size:15px;opacity:.7}
.msg{margin:10px 16px;align-self:flex-end;background:#F4D9C8;border-radius:18px 18px 4px 18px;padding:10px 14px;font-size:15px;max-width:75%}
.stamp{display:inline-flex;align-items:center;gap:6px;margin:8px 16px;font-size:14px;font-weight:700;background:#fff;border-radius:16px;padding:8px 12px;border:1.5px dashed #C1481F;color:#C1481F}
.stamps{display:flex;gap:10px;justify-content:center;margin:6px 0 10px}
.st{width:64px;height:76px;background:#fff;border:3px dashed #C1481F;border-radius:6px;display:grid;place-items:center;font-size:30px}
`;
const sb = `<div class="sb"><span>9:41</span><span>●●● ▮</span></div>`;

const p1 = `<div class="ph">${sb}<div class="saek"></div>
<h2>🎄 연말 한정 새</h2><div class="sub">한 해의 마지막 편지를 특별한 새에게 맡겨 보세요.<br>받는 사람 화면에도 이 모습으로 날아가요.</div>
${LIMITED.map((l) => `<div class="card"><div class="art" style="background:${l.bg}">${art(l.base, l.extra, l.over)}</div>
<div><span class="badge">한정</span><b>${l.name}</b><small>${l.tag}<br>${l.when}</small></div><div class="price">${l.price}</div></div>`).join("")}
<div class="note">💡 한정 새는 <b>모습만 특별</b>하고, 걸리는 시간·길 잃을 확률은 같은 종류의 무료 새와 똑같아요.<br>한 번 사면 기간이 끝나도 계속 쓸 수 있어요.</div>
<div class="note" style="background:rgba(30,58,92,.08)">기다림도 소통의 일부입니다.</div></div>`;

const pk = (name: string, t: string, a: string, on = false, lock = false) => `<div class="pk ${on ? "on" : ""}">${lock ? '<span class="lk">한정</span>' : ""}<div class="a">${a}</div><b>${name}</b><small>${t}</small></div>`;
const p2 = `<div class="ph">${sb}<div style="padding:8px 16px;font-size:20px;font-weight:800">‹ &nbsp;엄마 <span style="font-size:13px;font-weight:400;opacity:.6">서울 중구 → 부산</span></div>
<div class="room"><div style="display:flex;flex-direction:column"><div class="msg">엄마, 올해도 고마웠어요 🎄</div></div></div>
<div style="font-size:13px;opacity:.6;padding:0 16px 4px">🎄 연말에만 고를 수 있는 새가 있어요</div>
<div class="picker">${pk("매", "3시간 37분", art("hawk"))}${pk("비둘기", "5시간", art("pigeon"))}${pk("까치", "9시간 17분", art("magpie"))}${pk("산타 비둘기", "5시간", art("pigeon", SANTA, true), true, true)}</div>
<div class="input"><div>편지를 써 보세요</div><span class="send">➤</span></div>
<div class="dim"></div><div class="sheet"><div class="big">${art("pigeon", SANTA, true, true)}</div>
<h3>산타 비둘기 · 1,500원</h3><p>12월 31일까지만 고를 수 있어요.<br>속도는 비둘기와 같아요 · 한 번 사면 계속 써요</p>
<span class="btn">🎁 1,500원에 데려오기</span><span class="btn2">괜찮아요, 비둘기로 보낼게요</span></div></div>`;

const p3 = `<div class="ph">${sb}<div class="saek"></div><h2>🌏 펜팔 편지</h2><div class="sub">어느 도시의 누군가에게 편지를 날려 보내요</div>
<span class="stamp">✉️ 오늘 무료 5통 중 <b>&nbsp;3통&nbsp;</b> 남았어요 · 우표 0장</span>
<div style="margin:6px 16px;background:#fff;border-radius:18px;padding:14px;font-size:15px;line-height:1.5;opacity:.75;height:200px">안녕하세요! 저는 서울에 사는 까치예요. 요즘 겨울 바다가 보고 싶어서…</div>
<div class="dim"></div><div class="sheet"><h3>오늘 무료 편지를 다 썼어요</h3><p>내일 다시 5통이 생겨요.<br>지금 더 보내려면 우표를 붙여 주세요.</p>
<div class="stamps"><div class="st">🕊</div><div class="st">🕊</div><div class="st">🕊</div></div>
<span class="btn">우표 3장 · 1,100원</span>
<p style="font-size:13px;margin:10px 0 0">📮 상대가 7일 안에 답장하지 않으면 우표를 돌려드려요</p><span class="btn2">내일 보낼게요</span></div></div>`;

const html = (body: string) => `<!doctype html><meta charset="utf-8"><style>${CSS}</style>${body}`;
const files = { "v12-limited.html": html(p1), "v12-buy.html": html(p2), "v12-stamp.html": html(p3), "v12-all.html": html(p1 + p2 + p3) };
for (const [n, c] of Object.entries(files)) writeFileSync(resolve(OUT, n), c);
import { createRequire } from "node:module";
const { chromium } = createRequire(import.meta.url)("playwright");
const b = await chromium.launch();
for (const [n, w] of [["v12-limited", 438], ["v12-buy", 438], ["v12-stamp", 438], ["v12-all", 1290]] as const) {
  const p = await b.newPage({ viewport: { width: w, height: 892 }, deviceScaleFactor: 2 });
  await p.goto("file://" + resolve(OUT, n + ".html"));
  await p.waitForTimeout(400);
  await p.screenshot({ path: resolve(OUT, n + ".png") });
}
await b.close();
console.log("v12 시안 완료");
