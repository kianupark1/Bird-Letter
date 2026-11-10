/**
 * 넘겨 보는 글(캐러셀) 7장: npx tsx promo/build-carousel.mts
 * 2026-11-10 대표님: 산사·별꾹 확산 포인트 5가지(설치가 쉬움·캡처 한 장·부담 빼기·같이 있는 모습·만든 사람 사연)를
 * "기승전결 있게, 첫 장에 확 끌어당기게". 결과: promo/cards/car-01~07.png·.jpg
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");
const { getBird } = await import("../core/birds.ts");
const { travelMinutes, formatMinutes } = await import("../core/geo.ts");
const { getRoute } = await import("../core/routes.ts");
const { SLOGAN } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const mins = (id: string) => formatMinutes(travelMinutes(getBird(id), getRoute("seoul-busan").km));
const shot = (f: string) => "file://" + resolve(root, "promo/store", f);
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const DAHONG = "#C1481F", INK = "#1E1A17", GRAY = "#5E5750", BG = "#F3F1EE";
const N = 7;

const BASE = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 100%; height: 100%; }
body { font-family: P, sans-serif; color: ${INK}; background: ${BG}; position: relative; overflow: hidden; letter-spacing: -0.6px; }
svg { overflow: visible; display: block; }
.pic { position: absolute; left: 64px; right: 64px; top: 64px; height: 640px; border-radius: 36px; overflow: hidden; background: #FBF3E4; box-shadow: 0 2px 0 rgba(0,0,0,.04); }
.pic img { width: 100%; height: 100%; object-fit: cover; }
.txt { position: absolute; left: 72px; right: 72px; top: 760px; }
.eye { font-size: 34px; font-weight: 800; color: ${DAHONG}; }
h1 { font-size: 74px; font-weight: 900; line-height: 1.2; letter-spacing: -2.5px; margin-top: 18px; word-break: keep-all; }
h1 em { font-style: normal; color: ${DAHONG}; }
.body { font-size: 35px; line-height: 1.6; color: ${GRAY}; margin-top: 26px; word-break: keep-all; }
.body b { color: ${INK}; }
.count { position: absolute; right: 52px; top: 52px; padding: 10px 22px; border-radius: 999px; background: rgba(30,26,23,.55); color: #fff; font-size: 28px; font-weight: 700; z-index: 2; }
.brand { position: absolute; right: 64px; bottom: 50px; display: flex; align-items: center; gap: 10px; font-size: 32px; font-weight: 900; }
.swipe { position: absolute; left: 72px; bottom: 56px; font-size: 28px; font-weight: 700; color: ${GRAY}; }
.chip { position: absolute; padding: 18px 28px; border-radius: 26px; background: #fff; font-size: 36px; font-weight: 800; box-shadow: 0 14px 30px rgba(40,20,5,.2); }
.row { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 24px; padding: 28px 36px; font-size: 38px; font-weight: 800; margin-bottom: 18px; }
.row span { font-size: 30px; font-weight: 600; color: ${GRAY}; }
.row s { color: #A49B92; text-decoration-thickness: 4px; }
`;
const brand = `<div class="brand">${bird("magpie", 48, true)}새 편지</div>`;
const count = (i: number) => `<div class="count">${i}/${N}</div>`;
const swipe = (i: number) => (i < N ? `<div class="swipe">넘겨 보세요 →</div>` : "");
const pic = (f: string, pos = "top", extra = "") => `<div class="pic"><img src="${shot(f)}" style="object-position:${pos}">${extra}</div>`;
const txt = (eye: string, h1: string, body: string) => `<div class="txt"><div class="eye">${eye}</div><h1>${h1}</h1><p class="body">${body}</p></div>`;

const slides: string[] = [
  // 1 기: 첫 장에 확 — 말이 안 되는 것 같은 사실 하나
  `<div style="position:absolute;inset:0;background:linear-gradient(165deg,#D4572A,${DAHONG} 60%,#A33914)"></div>
   <div style="position:absolute;left:72px;right:72px;top:110px;color:#fff">
     <div style="font-size:36px;font-weight:800;opacity:.9">새로 나온 메신저 앱</div>
     <h1 style="font-size:104px;line-height:1.14;letter-spacing:-4px;margin-top:26px">보낸 메시지가<br><span style="color:#FFE08A">5시간 뒤</span>에<br>도착해요</h1>
     <p style="font-size:40px;line-height:1.55;margin-top:34px;opacity:.92;word-break:keep-all">비둘기가 서울에서 부산까지<br>진짜 날아가거든요 🕊</p></div>
   <div style="position:absolute;left:560px;top:820px;transform:rotate(-6deg)">${bird("pigeon", 300, true)}</div>
   <div class="chip" style="left:72px;top:1010px;transform:rotate(-4deg)">⏱ 4:59:57 남음</div>
   <div style="position:absolute;right:52px;top:52px;padding:10px 22px;border-radius:999px;background:rgba(0,0,0,.25);color:#fff;font-size:28px;font-weight:700">1/${N}</div>
   <div class="swipe" style="color:#FFE9DE">왜 이런 걸 만들었냐면 →</div>
   <div class="brand" style="color:#fff">${bird("magpie", 48, true)}새 편지</div>`,
  // 2 승: 무엇인지 — 캡처 한 장이면 설명 끝
  `${count(2)}${pic("ios-4-map.png", "center 28%", `<div class="chip" style="left:30px;top:470px">📍 지금 낙화암 근처</div>`)}
   ${txt("01 한 장이면 설명 끝", `내 편지가 지금<br><em>어디쯤</em> 날고 있는지`, "편지를 쓰고 새를 고르면, 실제 거리만큼 날아가요.<br>보내는 사람도 <b>받는 사람도 같은 지도</b>를 봐요.")}${swipe(2)}${brand}`,
  // 3 승: 설치가 쉬워요(2026-11-10 대표님: "링크만보다 설치가 쉽다는 게 오히려 좋아")
  `${count(3)}<div style="position:absolute;left:64px;right:64px;top:90px">
     <div class="row"><b>① 앱스토어에서 ‘새 편지’</b><span>받기</span></div>
     <div class="row" style="background:#FEE500;color:#191919"><b>② 카카오로 가입하기</b><span>버튼 한 번</span></div>
     <div class="row"><s>아이디 · 비밀번호 만들기</s><span>없어요</span></div>
     <div class="row" style="background:#FFF1EA;border:3px solid ${DAHONG}"><b style="color:${DAHONG}">③ 첫 편지 날리기</b><span style="color:${DAHONG}">끝!</span></div></div>
   ${txt("02 시작이 쉬워요", `받고, 버튼 <em>한 번</em>이면<br>바로 시작`, "카카오·구글·애플 중 아무거나 한 번 누르면 가입 끝.<br>친구 초대도 <b>카톡 한 번</b>이면 저절로 친구가 돼요.")}${swipe(3)}${brand}`,
  // 4 전: 부담을 뺐어요
  `${count(4)}<div style="position:absolute;left:64px;right:64px;top:90px">
     <div class="row"><s>읽음 1 · 읽씹</s><span>없어요</span></div>
     <div class="row"><s>바로 답장해야 하는 압박</s><span>없어요</span></div>
     <div class="row"><s>단톡방 · 알림 폭탄</s><span>없어요</span></div>
     <div class="row" style="background:#FFF1EA;border:3px solid ${DAHONG}"><b style="color:${DAHONG}">편지 한 통, 새 한 마리</b><span style="color:${DAHONG}">이게 전부</span></div></div>
   ${txt("03 부담은 빼고", `빨리 답 안 해도<br><em>괜찮은</em> 메신저`, "카톡으로 꺼내기 어려운 말일수록,<br>새가 천천히 전해 주면 마음이 한결 풀려요.")}${swipe(4)}${brand}`,
  // 5 전: 같이 기다리는 모습
  `${count(5)}${pic("ios-2-room.png", "center 8%", `<div class="chip" style="left:30px;top:440px">🔔 대전 근처를 지나요</div>`)}
   ${txt("04 같이 기다리는 재미", `기다리는 동안<br><em>같이</em> 설레요`, `서울 → 부산 기준 <b>매 ${mins("hawk")} · 비둘기 ${mins("pigeon")} · 까치 ${mins("magpie")}</b>.<br>지나가는 곳마다 “대전 근처를 지나요” 알림이 와요.`)}${swipe(5)}${brand}`,
  // 6 결: 만든 이유
  `${count(6)}<div class="pic" style="background:#FBF3E4;display:grid;place-items:center">
     <div style="text-align:center"><div style="display:flex;gap:40px;justify-content:center">${bird("hawk", 170, true)}${bird("pigeon", 170, true)}${bird("magpie", 170, true)}</div>
     <div style="font-size:44px;font-weight:800;margin-top:40px;color:${GRAY};font-style:italic">“기다리는 시간도 선물이 될 수 있게”</div></div></div>
   ${txt("05 만든 이유", `다 너무 빨라진 요즘,<br><em>기다리는 설렘</em>을 다시`, "주문하면 바로 오고, 메시지는 1초 만에 가는 시대.<br>답장을 기다리며 설레던 그 마음을 되살리고 싶어서<br><b>작은 1인 회사가 만들었어요.</b>")}${swipe(6)}${brand}`,
  // 7 결: 행동
  `<div style="position:absolute;inset:0;background:${INK}"></div>
   <div style="position:absolute;left:72px;right:72px;top:150px;color:#fff;text-align:center">
     <div style="display:flex;justify-content:center">${bird("magpie", 260, true)}</div>
     <h1 style="font-size:84px;margin-top:40px">오늘 생각나는 사람에게<br><span style="color:#F0BC5C">첫 편지</span>를 날려 보세요</h1>
     <div style="margin:60px auto 0;display:inline-flex;align-items:center;gap:18px;background:#fff;color:${INK};padding:28px 44px;border-radius:30px;font-size:44px;font-weight:900">앱스토어에서 ‘새 편지’ · 무료</div>
     <div style="font-size:34px;color:#F0BC5C;margin-top:70px;font-weight:700">${SLOGAN}</div></div>
   <div style="position:absolute;right:52px;top:52px;padding:10px 22px;border-radius:999px;background:rgba(255,255,255,.18);color:#fff;font-size:28px;font-weight:700">${N}/${N}</div>`,
];

mkdirSync(resolve(root, "promo/cards-src"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const [i, html] of slides.entries()) {
  const file = `car-0${i + 1}`;
  const htmlPath = resolve(root, `promo/cards-src/${file}.html`);
  writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${html}</body></html>`, "utf8");
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("file://" + htmlPath);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(root, `promo/cards/${file}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await ctx.close();
  console.log(file);
}
await browser.close();
