/**
 * 클래식(옛날 편지 감성) 홍보 카드 시안: npx tsx promo/build-classic.mts
 * 2026-11-04 대표님: "홍보자료가 예전 감성을 갖는 거라 클래식함이 있어야 해, 예전의 감성을 되찾는다·공감한다"
 * 바랜 한지·항공우편 봉투·우표·소인·원고지·빨간 우체통 + 명조(나눔명조·고운바탕)와 손글씨(나눔손글씨 펜) — 모두 OFL 무료 글꼴.
 * 글꼴은 npm @fontsource/{nanum-myeongjo,gowun-batang,nanum-pen-script}에서 받아 promo/fonts-classic/에 둠(처음 한 번 자동).
 * 결과: promo/cards/classic-*.png (원본 HTML은 promo/cards-src)
 */
import { createRequire } from "node:module";
import { existsSync, mkdirSync, writeFileSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");
const { getBird } = await import("../core/birds.ts");
const { travelMinutes, formatMinutes } = await import("../core/geo.ts");
const { getRoute } = await import("../core/routes.ts");
const { STORE_SHORT, SLOGAN } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const FD = resolve(root, "promo/fonts-classic");
const PKGS = ["nanum-myeongjo", "gowun-batang", "nanum-pen-script"];
mkdirSync(FD, { recursive: true });
for (const p of PKGS) {
  if (existsSync(resolve(FD, p))) continue;
  execSync(`npm pack @fontsource/${p} --silent`, { cwd: FD });
  const tgz = readdirSync(FD).find((f) => f.startsWith(`fontsource-${p}-`) && f.endsWith(".tgz"))!;
  mkdirSync(resolve(FD, p));
  execSync(`tar xzf ${tgz} -C ${p} --strip-components=1 && rm ${tgz}`, { cwd: FD });
}
const fontCss = PKGS.map((p) => readFileSync(resolve(FD, p, "index.css"), "utf8").replaceAll("url(./files/", `url(file://${FD}/${p}/files/`)).join("\n")
  + readFileSync(resolve(FD, "nanum-myeongjo", "800.css"), "utf8").replaceAll("url(./files/", `url(file://${FD}/nanum-myeongjo/files/`);

const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const mins = (id: string, r: string) => formatMinutes(travelMinutes(getBird(id), getRoute(r).km));

const INK = "#3B2A1E", RED = "#B33A1F", NAVY = "#1E3A5C";
// 바랜 종이: 얼룩(방사형) + 섬유 결(SVG 노이즈)
const NOISE = `url("data:image/svg+xml;utf8,${encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 .35  0 0 0 0 .25  0 0 0 0 .15  0 0 0 .09 0'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`)}")`;
const BASE = `${fontCss}
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: "Nanum Myeongjo", serif; color: ${INK}; position: relative; overflow: hidden;
  background: ${NOISE}, radial-gradient(ellipse at 30% 20%, #FBF1DC 0%, #F1E2C2 55%, #E2CB9E 100%); }
body::after { content: ""; position: absolute; inset: 0; pointer-events: none; box-shadow: inset 0 0 160px rgba(110,72,30,.28); }
svg { overflow: visible; display: block; }
.serif { font-family: "Nanum Myeongjo", serif; }
.batang { font-family: "Gowun Batang", serif; }
.pen { font-family: "Nanum Pen Script", cursive; }
h1 { font-weight: 800; letter-spacing: -1px; line-height: 1.32; }
.foot { position: absolute; left: 80px; right: 80px; bottom: 58px; display: flex; justify-content: space-between; align-items: center; font-family: "Gowun Batang", serif; }
.foot b { font-size: 34px; letter-spacing: 2px; }
.foot span { font-size: 26px; color: ${RED}; border-top: 2px solid ${RED}; border-bottom: 2px solid ${RED}; padding: 6px 4px; }
/* 우표: 톱니 테두리 */
.stamp { position: absolute; padding: 16px; filter: drop-shadow(2px 5px 5px rgba(60,40,20,.28));
  background: radial-gradient(circle, transparent 7px, #FFF8E8 7.6px) -12px -12px / 24px 24px; }
.stamp .in { border: 3px solid ${RED}; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: space-between; padding: 10px 6px 8px; background: #F7E7C6; }
.stamp small { font-family: "Gowun Batang"; font-size: 22px; color: ${RED}; font-weight: 700; }
/* 소인 */
.post { position: absolute; color: rgba(40,50,80,.72); }
`;
const FOOT = `<div class="foot"><b>새 편지</b><span>${SLOGAN}</span></div>`;
const stamp = (x: number, y: number, w: number, h: number, id: string, rot = 4) =>
  `<div class="stamp" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg)"><div class="in"><small>대한 새편지</small>${bird(id, w - 70)}<small>${id === "magpie" ? "까치" : id === "pigeon" ? "비둘기" : "매"}</small></div></div>`;
const postmark = (x: number, y: number, top: string, mid: string, bot: string) => `<div class="post" style="left:${x}px;top:${y}px">
  <svg width="420" height="190" viewBox="0 0 420 190"><g fill="none" stroke="currentColor" stroke-width="3.5">
  <circle cx="95" cy="95" r="82"/><circle cx="95" cy="95" r="60"/>
  ${[0, 1, 2, 3, 4].map((i) => `<path d="M190 ${40 + i * 27} q 28 -14 56 0 t 56 0 t 56 0 t 56 0"/>`).join("")}</g>
  <text x="95" y="56" text-anchor="middle" font-family="Gowun Batang" font-size="19" fill="currentColor" font-weight="700">${top}</text>
  <text x="95" y="104" text-anchor="middle" font-family="Gowun Batang" font-size="26" fill="currentColor" font-weight="700">${mid}</text>
  <text x="95" y="146" text-anchor="middle" font-family="Gowun Batang" font-size="19" fill="currentColor" font-weight="700">${bot}</text></svg></div>`;
// 항공우편 봉투 테두리(빨강·남색 사선)
const airmail = `repeating-linear-gradient(135deg, ${RED} 0 26px, #FFF8E8 26px 40px, ${NAVY} 40px 66px, #FFF8E8 66px 80px)`;

const cards: { file: string; w: number; h: number; html: string }[] = [
  // ① 기억나세요? — 항공우편 봉투·우표·소인
  { file: "classic-1-remember", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <div class="batang" style="font-size:34px;color:${RED};letter-spacing:6px;font-weight:700">기억나세요?</div>
      <h1 style="font-size:84px;margin-top:22px">답장을 기다리던<br>그 설렘</h1>
      <p class="batang" style="font-size:34px;line-height:1.7;margin-top:26px;opacity:.85">우체통을 몇 번이고 열어 보던 날들.<br>새 편지가 그 기다림을 다시 데려왔어요.</p>
    </div>
    <div style="position:absolute;left:96px;top:690px;width:888px;height:500px;padding:22px;background:${airmail};transform:rotate(-3deg);box-shadow:0 20px 40px rgba(60,40,20,.25)">
      <div style="width:100%;height:100%;background:#FFF8E8;position:relative">
        <div class="pen" style="position:absolute;left:70px;top:230px;font-size:70px;line-height:1.25;color:${NAVY}">부산시 해운대구<br>사랑하는 엄마께</div>
        <div class="batang" style="position:absolute;left:70px;top:70px;font-size:26px;letter-spacing:4px;opacity:.6">BY AIR MAIL · 새로 보냄</div>
      </div>
    </div>
    ${stamp(744, 620, 220, 270, "magpie", 6)}
    ${postmark(560, 790, "새편지 우체국", "서울", "2026 · 11")}
    ${FOOT}` },

  // ② 원고지에 꾹꾹 — 빨리 가는 것보다 마음이 닿는 것
  { file: "classic-2-manuscript", w: 1080, h: 1350, html: `<style>
      .grid { position:absolute; left:110px; top:520px; width:860px; height:560px; background:#FFFBF0;
        background-image: linear-gradient(${RED}55 2px, transparent 2px), linear-gradient(90deg, ${RED}55 2px, transparent 2px);
        background-size: 86px 112px; border: 3px solid ${RED}99; box-shadow: 0 16px 34px rgba(60,40,20,.18); }
      .grid .row { position:absolute; left:0; display:flex; }
      .grid .row i { width:86px; height:112px; display:grid; place-items:center; font-style:normal; font-family:"Nanum Pen Script"; font-size:82px; color:${INK}; }
    </style>
    <div style="position:absolute;left:80px;right:80px;top:96px;text-align:center">
      <h1 style="font-size:82px">빨리 가는 것보다<br><span style="color:${RED}">마음이 닿는 것</span></h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">꾹꾹 눌러 쓴 한 줄이 반가웠던 그때처럼</p>
    </div>
    <div class="grid">
      ${["보고싶은마음은", "천천히가도", "꼭도착해요."].map((t, r) => `<div class="row" style="top:${(r + 1) * 112}px;left:${r === 0 ? 86 : 0}px">${[...t].map((c) => `<i>${c}</i>`).join("")}</div>`).join("")}
    </div>
    <div style="position:absolute;right:70px;top:1000px;transform:rotate(-8deg)">${bird("pigeon", 230, true)}</div>
    ${FOOT}` },

  // ③ 빨간 우체통 — 요즘은 너무 빨라서 설렐 틈이 없잖아요
  { file: "classic-3-mailbox", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <h1 style="font-size:80px">요즘은 다 너무 빨라서<br><span style="color:${RED}">설렐 틈이 없잖아요</span></h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">새가 실제 거리만큼 날아가 전해 주는 편지.<br>서울에서 부산까지, 까치는 ${mins("magpie", "seoul-busan")}.</p>
    </div>
    <svg width="1080" height="1350" style="position:absolute;inset:0">
      <ellipse cx="560" cy="1140" rx="240" ry="22" fill="rgba(60,40,20,.18)"/>
      <rect x="532" y="940" width="56" height="200" fill="#5B3A29"/>
      <g transform="translate(400 560)">
        <path d="M0 120 Q0 0 160 0 Q320 0 320 120 V400 H0 Z" fill="${RED}" stroke="#7E2412" stroke-width="6"/>
        <path d="M20 130 Q20 22 160 22 Q300 22 300 130" fill="none" stroke="#E2735A" stroke-width="8" opacity=".55"/>
        <rect x="50" y="150" width="220" height="34" rx="8" fill="#3B1C12"/>
        <rect x="70" y="230" width="180" height="120" rx="10" fill="#FFF3D8" stroke="#7E2412" stroke-width="4"/>
        <text x="160" y="282" text-anchor="middle" font-family="Gowun Batang" font-weight="700" font-size="34" fill="${RED}">우 편</text>
        <text x="160" y="326" text-anchor="middle" font-family="Gowun Batang" font-size="22" fill="${INK}">새 편지</text>
      </g>
      <path d="M150 560 C 260 470, 330 520, 420 470" fill="none" stroke="${NAVY}" stroke-width="4" stroke-dasharray="3 14" stroke-linecap="round" opacity=".6"/>
    </svg>
    <div style="position:absolute;left:470px;top:430px">${bird("magpie", 190, true)}</div>
    <div class="pen" style="position:absolute;left:96px;top:820px;font-size:56px;color:${NAVY};transform:rotate(-6deg);line-height:1.2">기다리는 시간도<br>편지의 일부예요</div>
    <div class="batang" style="position:absolute;left:0;right:0;bottom:122px;text-align:center;font-size:28px;opacity:.8">${STORE_SHORT}</div>
    ${FOOT}` },

  // ④ 여행지 엽서 — 여행지에서 보내던 엽서처럼
  { file: "classic-4-postcard", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <h1 style="font-size:80px">여행지에서 보내던<br><span style="color:${RED}">엽서 한 장처럼</span></h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">“여기 바다가 참 예뻐요.”<br>그 한 줄이 며칠 뒤 도착하던 설렘.</p>
    </div>
    <div style="position:absolute;left:90px;top:610px;width:900px;height:560px;background:#FFF8E8;transform:rotate(2deg);box-shadow:0 18px 36px rgba(60,40,20,.25);display:flex">
      <div style="width:430px;margin:26px;background:linear-gradient(#9CC7E0 0%,#CFE3EA 45%,#E9D7B5 62%,#C9A27A 100%);position:relative;overflow:hidden">
        <svg width="430" height="508" style="position:absolute;inset:0"><path d="M0 330 Q 80 300 160 322 T 320 315 T 430 320 V508 H0Z" fill="#3E7FA6" opacity=".7"/><path d="M0 360 Q 90 340 180 356 T 430 352" fill="none" stroke="#fff" stroke-width="4" opacity=".7"/><circle cx="330" cy="110" r="44" fill="#F6D27A"/></svg>
        <div class="batang" style="position:absolute;left:22px;bottom:18px;font-size:30px;color:#fff;font-weight:700;text-shadow:0 2px 6px rgba(0,0,0,.35)">해운대에서</div>
      </div>
      <div style="flex:1;position:relative;border-left:3px dashed ${INK}33;margin:26px 0">
        <div class="pen" style="position:absolute;left:34px;top:150px;font-size:54px;line-height:1.3;color:${NAVY}">잘 지내지?<br>바다 보니까<br>네 생각 나더라</div>
        ${[0, 1, 2].map((i) => `<div style="position:absolute;left:34px;right:34px;top:${400 + i * 44}px;border-bottom:2px solid ${INK}33"></div>`).join("")}
      </div>
    </div>
    ${stamp(800, 560, 170, 210, "pigeon", -5)}
    ${FOOT}` },

  // ⑤ 편지 묶음 — 버리지 못한 편지, 다들 하나쯤 있잖아요
  { file: "classic-5-bundle", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px;text-align:center">
      <h1 style="font-size:80px">버리지 못한 편지 묶음,<br><span style="color:${RED}">다들 하나쯤 있잖아요</span></h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">다시 꺼내 읽으면 그날로 돌아가는 편지.<br>새 편지는 받은 편지를 그대로 간직해요.</p>
    </div>
    ${[["#FFF3D8", -9, 0], ["#F5E6C4", 5, 40], ["#FFF8E8", -2, 80]].map(([bg, r, dy]) => `<div style="position:absolute;left:190px;top:${640 + (dy as number)}px;width:700px;height:400px;background:${bg};transform:rotate(${r}deg);box-shadow:0 10px 24px rgba(60,40,20,.2)"><div style="position:absolute;inset:0;background:linear-gradient(160deg,transparent 49.5%,${INK}22 50%,transparent 50.6%),linear-gradient(20deg,transparent 49.5%,${INK}22 50%,transparent 50.6%)"></div></div>`).join("")}
    <svg width="1080" height="1350" style="position:absolute;inset:0"><path d="M540 700 V1140 M190 930 H890" stroke="#9C5B32" stroke-width="12"/><path d="M540 930 c -70 -60 -120 -10 -70 30 c 40 30 70 -30 70 -30 c 0 0 30 60 70 30 c 50 -40 0 -90 -70 -30" fill="none" stroke="#9C5B32" stroke-width="10"/></svg>
    <div class="pen" style="position:absolute;left:250px;top:760px;font-size:54px;color:${NAVY};transform:rotate(-2deg)">보고 싶은 너에게</div>
    <div style="position:absolute;right:120px;top:1010px;transform:rotate(6deg)">${bird("magpie", 180, true)}</div>
    ${FOOT}` },

  // ⑥ 학창 시절 펜팔 — 펜팔 친구, 기억나요?
  { file: "classic-6-penpal", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <div class="batang" style="font-size:34px;color:${RED};letter-spacing:6px;font-weight:700">학창 시절</div>
      <h1 style="font-size:84px;margin-top:20px">펜팔 친구,<br>기억나요?</h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">얼굴도 모르는 누군가의 답장을<br>일주일 내내 기다리던 그때 그 마음.</p>
    </div>
    <div style="position:absolute;left:150px;top:720px;width:780px;height:430px;padding:20px;background:${airmail};transform:rotate(4deg);box-shadow:0 18px 36px rgba(60,40,20,.25)">
      <div style="width:100%;height:100%;background:#FFF8E8;position:relative">
        <div class="pen" style="position:absolute;left:60px;top:150px;font-size:62px;line-height:1.25;color:${NAVY}">여수 사는 비둘기에게<br><span style="font-size:46px">— 서울 사는 까치가</span></div>
      </div>
    </div>
    ${stamp(760, 660, 180, 220, "pigeon", 8)}
    <div class="batang" style="position:absolute;left:0;right:0;bottom:128px;text-align:center;font-size:25px;opacity:.7">펜팔은 만 14세 이상 · 이름 대신 펜팔 이름과 도시만 보여요</div>
    ${FOOT}` },

  // ⑦ 밤새 고쳐 쓴 편지 — 공감 유머
  { file: "classic-7-night", w: 1080, h: 1350, html: `<style>body{background:${NOISE},radial-gradient(ellipse at 70% 30%,#2A3D5C 0%,#16243A 70%,#0F1A2B 100%);color:#F6EAD0}.foot b{color:#F6EAD0}.foot span{color:#F0BC5C;border-color:#F0BC5C}</style>
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <h1 style="font-size:80px">밤새 고쳐 쓴 편지,<br><span style="color:#F0BC5C">아침엔 못 부쳤죠</span></h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.9">이번엔 새가 대신 날아가요.<br>보내고 나면, 이제 기다리기만 하면 돼요.</p>
    </div>
    <svg width="1080" height="1350" style="position:absolute;inset:0">
      <ellipse cx="540" cy="1000" rx="420" ry="230" fill="#F0BC5C" opacity=".14"/>
      ${[[180, 470], [860, 430], [930, 620], [120, 700], [760, 300]].map(([x, y]) => `<text x="${x}" y="${y}" font-size="40" fill="#F0BC5C">✦</text>`).join("")}
    </svg>
    ${[[-14, 200, 880], [10, 640, 900], [-4, 380, 940]].map(([r, x, y]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:220px;height:170px;background:#EDE0C2;border-radius:30% 40% 35% 45%;transform:rotate(${r}deg);box-shadow:inset -10px -12px 20px rgba(80,60,30,.35)"></div>`).join("")}
    <div style="position:absolute;left:310px;top:760px;width:460px;height:320px;background:#FFF8E8;transform:rotate(-3deg);box-shadow:0 14px 30px rgba(0,0,0,.4);padding:40px 44px">
      <div class="pen" style="font-size:52px;line-height:1.3;color:${NAVY}">미안했어.<br>그리고 고마워.</div>
    </div>
    <div style="position:absolute;left:720px;top:640px;transform:rotate(-10deg)">${bird("hawk", 190, true)}</div>
    ${FOOT}` },

  // ⑧ 우표 고르던 재미 — 이젠 새를 골라요(기능 소개)
  { file: "classic-8-stamps", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px;text-align:center">
      <h1 style="font-size:80px">우표 고르던 재미,<br><span style="color:${RED}">이젠 새를 골라요</span></h1>
      <p class="batang" style="font-size:31px;line-height:1.7;margin-top:22px;opacity:.85">실제 새의 비행 속도를 바탕으로 · 서울 → 부산</p>
    </div>
    <div style="position:absolute;left:90px;right:90px;top:520px;height:640px;background:#F7E7C6;border:3px solid ${INK}33;box-shadow:0 14px 30px rgba(60,40,20,.18)"></div>
    ${(["magpie", "pigeon", "hawk"] as const).map((id, i) => stamp(140 + i * 280, 580, 240, 300, id, [-3, 2, -1][i])).join("")}
    ${(["magpie", "pigeon", "hawk"] as const).map((id, i) => `<div style="position:absolute;left:${140 + i * 280}px;width:240px;top:930px;text-align:center"><div class="batang" style="font-size:26px;color:#1B6E5C;font-weight:700">${["느긋하게", "적당히", "빠르게"][i]}</div><div class="serif" style="font-size:44px;font-weight:800;color:${RED};margin-top:6px">${mins(id, "seoul-busan")}</div></div>`).join("")}
    <div class="batang" style="position:absolute;left:0;right:0;top:1080px;text-align:center;font-size:27px;opacity:.75">세 마리 모두 무료 · 가끔 길을 잃어도 편지는 꼭 도착해요</div>
    ${FOOT}` },

  // ⑨ "편지 왔어요!" — 그 한마디
  { file: "classic-9-arrived", w: 1080, h: 1350, html: `
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <h1 style="font-size:84px">“편지 왔어요!”</h1>
      <p class="serif" style="font-size:52px;font-weight:800;color:${RED};margin-top:14px;line-height:1.35">그 한마디에 뛰어나가던 날</p>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">새가 도착하면 알림이 와요.<br>편지는 두루마리처럼 천천히 펼쳐져요.</p>
    </div>
    <div style="position:absolute;left:160px;top:700px;width:760px;height:460px">
      <div style="position:absolute;left:0;right:0;bottom:0;height:330px;background:#F2DDB2;box-shadow:0 18px 36px rgba(60,40,20,.25)"></div>
      <div style="position:absolute;left:60px;right:60px;bottom:150px;height:330px;background:#FFFBF0;box-shadow:0 4px 12px rgba(60,40,20,.15);padding:40px 46px">
        <div class="pen" style="font-size:56px;line-height:1.3;color:${NAVY}">엄마, 이번 주말에<br>내려갈게요 :)</div>
      </div>
      <svg width="760" height="460" style="position:absolute;inset:0"><path d="M0 250 L380 400 L760 250 V460 H0 Z" fill="#EAD2A2"/><path d="M0 460 L380 300 L760 460" fill="none" stroke="#C9A877" stroke-width="3"/></svg>
      <div style="position:absolute;left:330px;top:340px;width:100px;height:100px;border-radius:50%;background:${RED};box-shadow:inset 0 -6px 0 rgba(0,0,0,.2);display:grid;place-items:center;color:#FFE7C7;font-family:'Gowun Batang';font-weight:700;font-size:30px">새</div>
    </div>
    <div style="position:absolute;left:70px;top:620px;transform:rotate(-8deg)">${bird("magpie", 200, true)}</div>
    ${FOOT}` },

  // ⑩ 손편지 — 할머니께
  { file: "classic-10-grandma", w: 1080, h: 1350, html: `<style>.lined{position:absolute;left:120px;top:560px;width:840px;height:600px;background:#FFFBF0;box-shadow:0 16px 34px rgba(60,40,20,.2);transform:rotate(-1.5deg);
      background-image:linear-gradient(transparent 76px,${NAVY}33 76px,${NAVY}33 78px);background-size:100% 78px;padding:20px 70px;border-left:4px solid ${RED}66}</style>
    <div style="position:absolute;left:80px;right:80px;top:96px">
      <h1 style="font-size:80px">전화는 쑥스럽고,<br><span style="color:${RED}">문자는 너무 짧을 때</span></h1>
      <p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">할머니께 손편지처럼 한 통.<br>까치가 천천히 날아가 전해 드려요.</p>
    </div>
    <div class="lined"><div class="pen" style="font-size:62px;line-height:78px;color:${INK};padding-top:8px">할머니, 날이 많이 추워요.<br>감기 조심하시고요.<br>주말에 꼭 놀러 갈게요.<br><span style="padding-left:340px">— 손녀 올림</span></div></div>
    <div style="position:absolute;right:90px;top:1040px;transform:rotate(4deg)">${bird("magpie", 190, true)}</div>
    ${FOOT}` },
];

mkdirSync(resolve(root, "promo/cards-src"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const c of cards) {
  const htmlPath = resolve(root, `promo/cards-src/${c.file}.html`);
  writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${c.html}</body></html>`, "utf8");
  const ctx = await browser.newContext({ viewport: { width: c.w, height: c.h }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("file://" + htmlPath);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); await document.fonts.ready; });
  await p.screenshot({ path: resolve(root, `promo/cards/${c.file}.png`) });
  await ctx.close();
  console.log(c.file);
}
await browser.close();
