/**
 * 7차 시안: 새티콘(새 이모티콘) + 빈자리 없는 친구 탭.
 * 실행: npx tsx docs/시안/build-v7.mts  → docs/시안/images/v7-*.png
 * 새티콘 그림은 앱 컴포넌트(src/components/BirdSticker.tsx)를 그대로 써요.
 */
import { renderToStaticMarkup } from "react-dom/server";
import * as ReactNS from "react";
const React: any = (ReactNS as any).default ?? ReactNS;
(globalThis as any).React = React;
const h = React.createElement;
import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as BS from "../../src/components/BirdSticker";
import * as BI from "../../src/components/BirdIcon";
const pick = (m: any) => m.default?.default ?? m.default ?? m;
const Sticker: any = pick(BS);
const STICKERS: { id: string; label: string }[] = (BS as any).STICKERS ?? (BS as any).default?.STICKERS;
const BirdIcon: any = pick(BI);

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "images");
const FONT = resolve(here, "../../node_modules/pretendard/dist/web/static/woff2");
const st = (id: string, size = 96, label = true) => renderToStaticMarkup(h(Sticker, { id, size, label }));
const bird = (id: string, size = 44) => renderToStaticMarkup(h(BirdIcon, { id, size }));

const CSS = `
@font-face{font-family:Pretendard;font-weight:400;src:url(file://${FONT}/Pretendard-Regular.woff2)}
@font-face{font-family:Pretendard;font-weight:700;src:url(file://${FONT}/Pretendard-Bold.woff2)}
@font-face{font-family:Pretendard;font-weight:800;src:url(file://${FONT}/Pretendard-ExtraBold.woff2)}
*{box-sizing:border-box;margin:0;padding:0}
:root{--dahong:#C1481F;--namsaek:#1E3A5C;--hwangto:#E0A83C;--cheongrok:#1B6E5C;--b-cream:#FBF3E4;--b-ink:#2A2118;--b-brown:#8A5A3C;--b-brown2:#5B3A29;--b-grey:#9AA8B8;--b-grey2:#6F8094;--b-edge:rgba(42,33,24,.35)}
.dk{--dahong:#E8683F;--namsaek:#5C8AB8;--hwangto:#F0BC5C;--cheongrok:#3EA890}
body{font-family:Pretendard,sans-serif;background:#d9d2c4;color:#2A2118}
.ph{width:390px;height:844px;background:#FBF3E4;position:relative;overflow:hidden;display:flex;flex-direction:column}
.ph.dk{background:#1A1613;color:#F2E8D8}
.sb{height:44px;display:flex;justify-content:space-between;align-items:center;padding:6px 26px 0;font-size:15px;font-weight:700}
.top{display:flex;align-items:center;gap:10px;padding:4px 16px 6px}.top h1{font-size:26px;flex:1}
.ib{width:42px;height:42px;border-radius:50%;background:rgba(255,255,255,.08);display:grid;place-items:center;font-size:20px}
.ph:not(.dk) .ib{background:#fff}
.row{display:flex;align-items:center;gap:12px;padding:7px 16px}
.fc{width:48px;height:48px;border-radius:17px;background:#1f3b34;display:grid;place-items:center;overflow:hidden;flex:none}
.fc.me{width:58px;height:58px;border-radius:20px}
.nm{font-size:17px;font-weight:700}.sm{font-size:13px;opacity:.6;margin-top:2px}
.mid{flex:1;min-width:0}
.stt{font-size:13px;border:1px solid rgba(255,255,255,.2);border-radius:12px;padding:3px 9px;opacity:.85;max-width:130px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sec{font-size:13px;opacity:.6;padding:12px 16px 4px;display:flex;justify-content:space-between}
.hr{height:1px;background:rgba(255,255,255,.1);margin:6px 16px}
.tabs{margin-top:auto;display:flex;padding:10px 0 22px;border-radius:26px 26px 0 0;background:#241e1a}
.ph:not(.dk) .tabs{background:#fff}
.tabs div{flex:1;text-align:center;font-size:13px;opacity:.65}.tabs .on{color:#E8683F;opacity:1;font-weight:700}
.shelf{display:flex;gap:4px;padding:2px 12px;overflow:hidden}
.shelf div{flex:none;background:rgba(255,255,255,.06);border-radius:16px;padding:2px}
.chat{flex:1;padding:6px 14px;display:flex;flex-direction:column;gap:10px}
.b{max-width:250px;border-radius:20px;padding:10px 14px;font-size:16px;line-height:1.4}
.b.me{align-self:flex-end;background:#F8D9CC;color:#2A2118}
.b.you{align-self:flex-start;background:#fff}
.bst{align-self:flex-end;text-align:right}
.bst small,.b small{display:block;font-size:12px;opacity:.6;margin-top:4px}
.comp{display:flex;align-items:center;gap:8px;padding:8px 12px 10px;background:#fff;border-top:1px solid rgba(42,33,24,.1)}
.comp .in{flex:1;height:44px;border-radius:22px;background:#F4EEDF;display:flex;align-items:center;padding:0 14px;color:#8a7d70;font-size:15px}
.comp .k{width:42px;height:42px;border-radius:50%;background:#F4EEDF;display:grid;place-items:center;font-size:22px}
.comp .k.on{background:#F8E6BC;box-shadow:0 0 0 2px #C1481F inset}
.comp .go{width:44px;height:44px;border-radius:50%;background:#C1481F;color:#fff;display:grid;place-items:center;font-size:20px}
.sheet{background:#fff;padding:8px 8px 18px;border-top:1px solid rgba(42,33,24,.1)}
.sheet .tt{display:flex;gap:8px;padding:4px 6px 8px;font-size:14px}
.sheet .tt span{padding:5px 11px;border-radius:14px;background:#F4EEDF}.sheet .tt .on{background:#1E3A5C;color:#fff}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:2px}
.grid div{display:grid;place-items:center;border-radius:14px;padding:2px}
.grid .sel{background:#F8E6BC}
.board{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;padding:6px 14px}
.board div{background:#fff;border-radius:18px;display:grid;place-items:center;padding:2px 0}
.note{font-size:14px;line-height:1.5;padding:4px 18px;opacity:.8}
`;
const page = (body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}</body></html>`;
const shoot = (name: string, html: string, w = 390, hh = 844) => {
  const f = resolve(OUT, `${name}.html`);
  writeFileSync(f, page(html));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${w},${hh + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, name + ".png")}`, "file://" + f], { stdio: "ignore" });
  execFileSync("convert", [resolve(OUT, name + ".png"), "-crop", `${w * 2}x${hh * 2}+0+0`, "+repage", resolve(OUT, name + ".png")]);
};
const sb = `<div class="sb"><span>9:41</span><span>●●● ▮</span></div>`;
const tabs = (on: number) => `<div class="tabs">${["✉<br>편지", "👥<br>친구", "🏆<br>랭킹"].map((t, i) => `<div class="${i === on ? "on" : ""}">${t}</div>`).join("")}</div>`;

// ① 새티콘 16종 한눈에
shoot("v7-1-새티콘16종", `<div class="ph">${sb}<div class="top"><h1>새티콘 🐦</h1></div>
<p class="note">까치 한 마리가 16가지 마음을 전해요. 편지에 붙이거나, 새티콘만 날려 보낼 수도 있어요.</p>
<div class="board">${STICKERS.map((s) => `<div>${st(s.id, 82)}</div>`).join("")}</div></div>`);

// ② 대화방: 입력줄 옆 [😊] → 아래에 새티콘 판
shoot("v7-2-대화방에서고르기", `<div class="ph">${sb}
<div class="top"><span style="font-size:30px">‹</span><div class="fc">${bird("swallow", 42)}</div><h1 style="font-size:22px">석영이</h1></div>
<div class="chat">
  <div class="b you">이번 주말에 부산 놀러 와!<small>제비 · 도착 ✓ 오후 2시</small></div>
  <div class="bst">${st("love", 120)}<small>비둘기 비행 중 · 오후 9시 도착 예정</small></div>
</div>
<div class="comp"><div class="k">＋</div><div class="in">편지를 써 보세요</div><div class="k on">😊</div><div class="go">➤</div></div>
<div class="sheet"><div class="tt"><span class="on">🐦 새티콘</span><span>최근</span></div>
<div class="grid">${STICKERS.slice(0, 8).map((s, i) => `<div class="${i === 1 ? "sel" : ""}">${st(s.id, 72)}</div>`).join("")}</div></div></div>`);

// ③ 받는 사람: 도착하면 새티콘이 톡 튀어나와요
shoot("v7-3-받은새티콘", `<div class="ph">${sb}
<div class="top"><span style="font-size:30px">‹</span><div class="fc">${bird("pigeon", 42)}</div><h1 style="font-size:22px">박성하</h1></div>
<div class="chat">
  <div class="b me">주말에 갈게! 기다려 🙌<small>오전 10시 · 도착 ✓</small></div>
  <div style="align-self:flex-start">${st("joy", 130)}<div style="font-size:12px;opacity:.6">비둘기가 물고 온 새티콘 · 도착 ✓ 오후 9시</div></div>
  <div style="align-self:flex-start">${st("wait", 110)}<div style="font-size:12px;opacity:.6">글 없이 새티콘만 보낸 편지도 새가 날아서 가요</div></div>
</div>
<div class="comp"><div class="k">＋</div><div class="in">편지를 써 보세요</div><div class="k">😊</div><div class="go" style="opacity:.4">➤</div></div></div>`);

// ④ 친구 탭: 카카오톡처럼 빈자리 없이(작은 머리·촘촘한 줄·상태 한 줄), 아래는 새티콘 선반
const friend = (n: string, b: string, s = "") => `<div class="row"><div class="fc">${bird(b, 44)}</div><div class="mid"><div class="nm">${n}</div></div>${s ? `<span class="stt">${s}</span>` : ""}</div>`;
shoot("v7-4-친구탭", `<div class="ph dk">${sb}
<div class="top"><h1>친구</h1><div class="ib">👤</div><div class="ib">⚙</div></div>
<div class="row"><div class="fc me">${bird("magpie", 54)}</div><div class="mid"><div class="nm" style="font-size:19px">박성하</div><div class="sm">한 줄 소개를 적어 보세요</div></div></div>
<div class="hr"></div>
<div class="sec"><span>친구 3</span></div>
${friend("석영이", "swallow", "부산 바다 보러 감 🌊")}${friend("엄마", "crane", "밥은 먹었니")}${friend("민수", "hawk")}
<div class="hr"></div>
<div class="sec"><span>새티콘으로 마음 전하기</span><span>모두 보기 ›</span></div>
<div class="shelf">${["joy", "love", "miss", "wait", "thanks"].map((id) => `<div>${st(id, 70)}</div>`).join("")}</div>
${tabs(1)}</div>`);

// 전체 한눈에
const imgs = ["v7-1-새티콘16종", "v7-2-대화방에서고르기", "v7-3-받은새티콘", "v7-4-친구탭"];
const sheet = `<div style="padding:24px;display:grid;grid-template-columns:repeat(4,390px);gap:24px;background:#d9d2c4"><div style="grid-column:1/-1;font:700 24px Pretendard">7차 시안: 새티콘(새 이모티콘) · 빈자리 없는 친구 탭</div>${imgs.map((n) => `<img src="file://${resolve(OUT, n + ".png")}" style="width:390px;border-radius:24px">`).join("")}</div>`;
const W = 4 * 390 + 3 * 24 + 48;
writeFileSync(resolve(OUT, "v7-전체-한눈에.html"), page(sheet));
execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${W},${844 + 120 + 87}`, "--force-device-scale-factor=1", `--screenshot=${resolve(OUT, "v7-전체-한눈에.png")}`, "file://" + resolve(OUT, "v7-전체-한눈에.html")], { stdio: "ignore" });
execFileSync("convert", [resolve(OUT, "v7-전체-한눈에.png"), "-crop", `${W}x${844 + 120}+0+0`, "+repage", resolve(OUT, "v7-전체-한눈에.png")]);
console.log("7차 시안:", imgs.length + 1);
