/**
 * 13차 시안: 내 새 옷 입히기(2026-11-11 대표님: "유료 하기 전에 새 옷 입히는 거, 귀여움 강조, 수익 모델에 넣어").
 * 실행: npx tsx docs/시안/build-v13.mts → docs/시안/images/v13-*.png
 * 옷 그림은 src/components/BirdOutfit.tsx(앱에 그대로 쓸 것). 이름·가격은 「가정」.
 */
import { renderToStaticMarkup } from "react-dom/server";
import * as ReactNS from "react";
const React: any = (ReactNS as any).default ?? ReactNS;
(globalThis as any).React = React;
const h = React.createElement;
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const CB: any = await import("../../src/components/CuteBird");
const CuteArt: any = CB.CuteArt ?? CB.default?.CuteArt;
const BO: any = await import("../../src/components/BirdOutfit");
const { OutfitArt, OutfitHeadC, OUTFITS, wonText } = BO.OUTFITS ? BO : BO.default;

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "images");
mkdirSync(OUT, { recursive: true });
const FONT = resolve(here, "../../node_modules/pretendard/dist/web/static/woff2");

const bird = (id: string, items: string[] = [], variant = "A", letter = false) =>
  `<svg viewBox="0 0 200 160" width="100%" height="100%">${renderToStaticMarkup(h(CuteArt, { id, variant, letter }))}${renderToStaticMarkup(
    h("g", null, variant === "C" ? h(OutfitHeadC, { items }) : h(OutfitArt, { items })),
  )}</svg>`;

const CSS = `
@font-face{font-family:P;font-weight:400;src:url(file://${FONT}/Pretendard-Regular.woff2)}
@font-face{font-family:P;font-weight:700;src:url(file://${FONT}/Pretendard-Bold.woff2)}
@font-face{font-family:P;font-weight:800;src:url(file://${FONT}/Pretendard-ExtraBold.woff2)}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:P,sans-serif;background:#d9d2c4;color:#2A2118;padding:24px}
.ph{width:390px;height:844px;background:#FBF3E4;border-radius:36px;overflow:hidden;position:relative;display:flex;flex-direction:column;box-shadow:0 10px 30px rgba(0,0,0,.15)}
.sb{height:46px;display:flex;justify-content:space-between;padding:14px 28px 0;font-size:15px;font-weight:700}
.saek{height:6px;background:linear-gradient(90deg,#C1481F 0 25%,#E0A83C 25% 50%,#1B6E5C 50% 75%,#1E3A5C 75%)}
h2{font-size:24px;font-weight:800;padding:12px 20px 2px}.sub{font-size:14px;opacity:.65;padding:0 20px 10px;line-height:1.45}
.note{font-size:12.5px;line-height:1.5;opacity:.75;background:rgba(224,168,60,.16);border-radius:12px;padding:8px 12px}
.btn{border-radius:18px;padding:14px;font-weight:800;font-size:17px;text-align:center}
`;
const page = (body: string, w: number) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head><body style="width:${w}px">${body}</body></html>`;

/* 1. 옷장(꾸미기 화면) */
const wearing = ["postman", "satchel"];
const grid = OUTFITS.slice(0, 9).map((o: any, i: number) => {
  const on = wearing.includes(o.id);
  const b = ["magpie", "pigeon", "hawk"][i % 3];
  return `<div style="background:#fff;border-radius:16px;padding:6px 6px 8px;text-align:center;position:relative;${on ? "outline:3px solid #C1481F" : "box-shadow:0 2px 0 rgba(42,33,24,.1)"}">
    ${o.tag || o.season ? `<span style="position:absolute;left:6px;top:6px;font-size:10px;font-weight:800;color:#fff;background:${o.season ? "#1E3A5C" : "#1B6E5C"};border-radius:8px;padding:1px 6px">${o.season ?? o.tag}</span>` : ""}
    <div style="height:64px">${bird("magpie", [o.id])}</div>
    <div style="font-size:13px;font-weight:700">${o.name}</div>
    <div style="font-size:12px;font-weight:800;color:${o.price ? "#C1481F" : "#1B6E5C"}">${on ? "입는 중" : wonText(o.price)}</div></div>`;
}).join("");
const closet = `<div class="ph"><div class="sb"><span>9:41</span><span>●●● ▮</span></div><div class="saek"></div>
  <div style="display:flex;align-items:center;padding:10px 16px 0;font-size:16px;font-weight:700"><span style="font-size:22px">‹</span><span style="margin:0 auto">내 새 꾸미기</span><span style="opacity:.0">‹</span></div>
  <div style="margin:10px 16px 0;height:210px;border-radius:24px;background:radial-gradient(circle at 50% 60%,#FFF1D6,#F5E6C8);position:relative">
    <div style="position:absolute;inset:6px 40px">${bird("magpie", wearing)}</div>
    <span style="position:absolute;right:14px;top:12px;font-size:12px;font-weight:800;background:#fff;border-radius:10px;padding:3px 8px">✨ 친구에게도 보여요</span>
  </div>
  <div style="display:flex;gap:6px;padding:12px 16px 8px;font-size:14px;font-weight:700">
    ${["전체", "모자", "얼굴", "목", "가방"].map((t, i) => `<span style="padding:6px 12px;border-radius:14px;${i === 0 ? "background:#2A2118;color:#fff" : "background:#fff"}">${t}</span>`).join("")}</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px">${grid}</div>
  <div style="padding:10px 16px 0"><div class="note">👗 모습만 바뀌어요 · 도착 시간은 그대로 · 뽑기 없이 고른 걸 그대로 · 사기 전에 입어 보기 무료</div></div>
  <div style="display:flex;gap:8px;padding:10px 16px 0"><div class="btn" style="flex:1;background:#fff">입어 보기</div><div class="btn" style="flex:1.4;background:#C1481F;color:#fff">우체부 세트 1,500원</div></div>
</div>`;

/* 2. 귀여움 한눈에(3종 × 옷) */
const looks: [string, string[], string][] = [
  ["magpie", ["postman", "satchel"], "우체부 까치"], ["pigeon", ["beanie", "scarf"], "겨울 비둘기"], ["hawk", ["gat"], "선비 매"],
  ["pigeon", ["ribbon", "bowtie"], "리본 비둘기"], ["magpie", ["santa", "scarf"], "산타 까치 · 12월"], ["hawk", ["crown", "glasses"], "왕관 매"],
  ["magpie", ["flower"], "꽃핀 까치 · 가입 선물"], ["hawk", ["postman", "bowtie"], "신사 매"], ["pigeon", ["glasses", "satchel"], "책벌레 비둘기"],
];
const lookbook = `<div style="width:1080px;background:#FBF3E4;border-radius:28px;padding:36px 40px">
  <div style="font-size:15px;font-weight:800;color:#C1481F">13차 시안 · 내 새 옷 입히기</div>
  <div style="font-size:40px;font-weight:800;margin-top:6px">내 새에게 옷을 입혀 주세요 🎀</div>
  <div style="font-size:18px;opacity:.7;margin-top:6px">편지를 물고 가는 새가 내가 고른 옷을 입고 날아가요. 받는 친구 화면에도 그대로 보여요.</div>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-top:22px">
  ${looks.map(([b, it, n]) => `<div style="background:#fff;border-radius:22px;padding:10px 10px 14px;text-align:center"><div style="height:200px">${bird(b, it)}</div><div style="font-size:19px;font-weight:800">${n}</div></div>`).join("")}
  </div></div>`;

/* 3. 어디에 보이나: 지도 위 나는 새·친구 목록·도착 */
const where = `<div class="ph"><div class="sb"><span>9:41</span><span>●●● ▮</span></div><div class="saek"></div>
  <h2>입힌 옷은 여기서 보여요</h2><div class="sub">보내는 사람·받는 사람 모두 같은 모습을 봐요</div>
  <div style="margin:4px 16px;border-radius:20px;height:190px;background:linear-gradient(#DCEBF2,#EAF3EC);position:relative;overflow:hidden">
    <svg viewBox="0 0 358 190" style="position:absolute;inset:0"><path d="M40 160 Q170 40 320 50" stroke="#C1481F" stroke-width="3" stroke-dasharray="7 6" fill="none"/><circle cx="40" cy="160" r="7" fill="#1E3A5C"/><circle cx="320" cy="50" r="7" fill="#C1481F"/></svg>
    <div style="position:absolute;left:120px;top:42px;width:120px;height:96px">${bird("magpie", ["postman"], "C", true)}</div>
    <span style="position:absolute;left:12px;top:10px;font-size:12px;font-weight:800;background:#fff;border-radius:10px;padding:3px 8px">① 지도 위를 나는 새</span>
  </div>
  <div style="margin:10px 16px;background:#fff;border-radius:18px;padding:10px 12px;display:flex;align-items:center;gap:10px">
    <div style="width:58px;height:58px;border-radius:16px;background:#F5E6C8;padding:2px">${bird("pigeon", ["beanie", "scarf"])}</div>
    <div><b style="font-size:17px">엄마</b><div style="font-size:13px;opacity:.65">🕊 내 편지가 날아가는 중 · 2시간 남음</div></div>
    <span style="margin-left:auto;font-size:11px;font-weight:800;opacity:.6">② 친구 목록 얼굴</span></div>
  <div style="margin:4px 16px;background:#fff;border-radius:22px;padding:14px;text-align:center;box-shadow:0 2px 0 rgba(42,33,24,.1)">
    <div style="font-size:11px;font-weight:800;opacity:.6;text-align:left">③ 도착 알림</div>
    <div style="height:120px">${bird("hawk", ["crown", "bowtie"], "A", true)}</div>
    <div style="font-size:19px;font-weight:800">짹짹! 편지가 도착했어요 💌</div>
    <div style="font-size:14px;opacity:.65;margin-top:4px">왕관 쓴 매가 민지님 편지를 가져왔어요</div></div>
</div>`;

const files: Record<string, [string, number]> = { "v13-1-closet": [closet, 438], "v13-2-lookbook": [lookbook, 1128], "v13-3-where": [where, 438] };
for (const [n, [b, w]] of Object.entries(files)) writeFileSync(resolve(OUT, n + ".html"), page(b, w));
const { chromium } = createRequire(import.meta.url)("playwright");
const br = await chromium.launch();
for (const [n, [, w]] of Object.entries(files)) {
  const p = await br.newPage({ viewport: { width: w + 48, height: 900 }, deviceScaleFactor: 2 });
  await p.goto("file://" + resolve(OUT, n + ".html"));
  await p.evaluate(async () => { await (document as any).fonts.ready; });
  await p.screenshot({ path: resolve(OUT, n + ".png"), fullPage: true });
  await p.close();
  console.log(n);
}
await br.close();
