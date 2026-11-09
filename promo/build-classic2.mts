/**
 * 클래식 카드 2차(글만 있던 글에 붙일 그림 24장): npx tsx promo/build-classic2.mts [이름 일부]
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

const cards: { file: string; w: number; h: number; html: string }[] = [];

// ── 2차(2026-11-09 대표님: "글만 올라가는 거 안 좋아, 임팩트 있는 사진 넣어 줘") ──
const head = (h1: string, sub = "", eyebrow = "", center = false) => `<div style="position:absolute;left:80px;right:80px;top:96px;${center ? "text-align:center" : ""}">
  ${eyebrow ? `<div class="batang" style="font-size:34px;color:${RED};letter-spacing:6px;font-weight:700;margin-bottom:20px">${eyebrow}</div>` : ""}
  <h1 style="font-size:76px;word-break:keep-all">${h1}</h1>
  ${sub ? `<p class="batang" style="font-size:33px;line-height:1.7;margin-top:24px;opacity:.85">${sub}</p>` : ""}</div>`;
const R = (t: string) => `<span style="color:${RED}">${t}</span>`;
const shot = (f: string) => "file://" + resolve(root, "promo/store", f);
// 실제 앱 화면을 폰 틀에 넣어요(윗부분만 보이게 자름)
const phone = (f: string, x: number, y: number, w: number, h: number, rot = 0, pos = "top") => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;border-radius:48px;background:#1C1714;padding:16px;transform:rotate(${rot}deg);box-shadow:0 30px 60px rgba(60,40,20,.35)">
  <div style="width:100%;height:100%;border-radius:34px;overflow:hidden;background:#FBF3E4"><img src="${shot(f)}" style="width:100%;height:100%;object-fit:cover;object-position:${pos}"></div></div>`;
const lined = (x: number, y: number, w: number, h: number, inner: string, rot = -1.5) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;background:#FFFBF0;box-shadow:0 16px 34px rgba(60,40,20,.2);transform:rotate(${rot}deg);
  background-image:linear-gradient(transparent 76px,${NAVY}33 76px,${NAVY}33 78px);background-size:100% 78px;padding:20px 60px;border-left:4px solid ${RED}66">${inner}</div>`;
const pen = (t: string, size = 60, color = NAVY) => `<div class="pen" style="font-size:${size}px;line-height:78px;color:${color};padding-top:8px">${t}</div>`;
const envelope = (x: number, y: number, w: number, h: number, inner: string, rot = -3) => `<div style="position:absolute;left:${x}px;top:${y}px;width:${w}px;height:${h}px;padding:22px;background:${airmail};transform:rotate(${rot}deg);box-shadow:0 20px 40px rgba(60,40,20,.25)"><div style="width:100%;height:100%;background:#FFF8E8;position:relative">${inner}</div></div>`;
const birdAt = (id: string, x: number, y: number, size: number, rot = 0) => `<div style="position:absolute;left:${x}px;top:${y}px;transform:rotate(${rot}deg)">${bird(id, size, true)}</div>`;
const NIGHT = `<style>body{background:${NOISE},radial-gradient(ellipse at 70% 30%,#2A3D5C 0%,#16243A 70%,#0F1A2B 100%);color:#F6EAD0}.foot b{color:#F6EAD0}.foot span{color:#F0BC5C;border-color:#F0BC5C}</style>`;
const stars = (pts: number[][]) => `<svg width="1080" height="1350" style="position:absolute;inset:0">${pts.map(([x, y]) => `<text x="${x}" y="${y}" font-size="38" fill="#F0BC5C">✦</text>`).join("")}</svg>`;
const bubble = (t: string, x: number, y: number, me: boolean, size = 40) => `<div style="position:absolute;left:${x}px;top:${y}px;padding:18px 28px;border-radius:30px;${me ? "border-bottom-right-radius:6px;background:#F4D35E" : "border-bottom-left-radius:6px;background:#FFFFFF"};font-family:'Gowun Batang';font-size:${size}px;box-shadow:0 6px 14px rgba(60,40,20,.15);color:${INK}">${t}</div>`;

const cards2: { file: string; w: number; h: number; html: string }[] = [
  { file: "more-01-lastletter", w: 1080, h: 1350, html: `${head(`마지막으로<br>${R("손편지 받아 본 게")}<br>언제예요?`, "", "", false)}
    ${lined(120, 640, 840, 520, pen("잘 지내지?<br>네 편지 받고 한참 웃었어.<br>답장 기다릴게!<br><span style='padding-left:380px'>— 2009년 겨울</span>", 58, INK))}
    ${birdAt("magpie", 790, 1010, 170, 6)}${FOOT}` },
  { file: "more-03-mailbox", w: 1080, h: 1350, html: `${head(`학교 끝나면<br>${R("우편함부터")} 열어 보던<br>사람, 손! 🙋`, "그 두근거림, 새 편지에서 다시 느껴 보세요.")}
    <div style="position:absolute;left:150px;top:640px;width:780px;height:500px;background:#8A6A4A;padding:24px;display:grid;grid-template-columns:repeat(3,1fr);gap:18px;box-shadow:0 20px 40px rgba(60,40,20,.3)">
      ${["101", "102", "103", "201", "202", "203"].map((n) => `<div style="background:#B89070;border:4px solid #6E5034;position:relative"><div style="position:absolute;left:18px;right:18px;top:40px;height:16px;background:#3B2A1E;border-radius:8px"></div><div class="batang" style="position:absolute;left:0;right:0;bottom:14px;text-align:center;font-size:30px;color:#FFF3D8;font-weight:700">${n}호</div>${n === "202" ? `<div style="position:absolute;left:30px;top:-6px;width:150px;height:96px;background:#FFF8E8;transform:rotate(-8deg);box-shadow:0 6px 12px rgba(0,0,0,.25);border-top:10px solid ${RED}"></div>` : ""}</div>`).join("")}
    </div>${birdAt("pigeon", 760, 540, 170, -6)}${FOOT}` },
  { file: "more-04-fastslow", w: 1080, h: 1350, html: `${head(`답장이 빨리 오면 편하고,<br>${R("천천히 오면 설레요")}`, "오늘은 설레는 쪽으로 한 통 어때요?", "", true)}
    <div style="position:absolute;left:90px;top:620px;width:420px;height:520px;background:#EDE6DA;border-radius:28px;padding:30px">
      <div class="batang" style="font-size:28px;opacity:.6;text-align:center">1초 만에</div>
      ${["ㅇㅇ", "ㅋㅋ", "ㄱㄱ"].map((t, i) => `<div style="margin-top:26px;${i % 2 ? "margin-left:auto;background:#F4D35E" : "background:#fff"};width:max-content;padding:14px 26px;border-radius:24px;font-size:40px">${t}</div>`).join("")}
    </div>
    ${envelope(560, 660, 430, 300, `<div class="pen" style="position:absolute;left:40px;top:90px;font-size:54px;color:${NAVY};line-height:1.25">보고 싶은<br>너에게</div>`, 4)}
    ${birdAt("magpie", 760, 900, 190, -4)}
    <div class="batang" style="position:absolute;left:560px;top:1100px;width:430px;text-align:center;font-size:28px;color:${RED};font-weight:700">까치로 9시간 17분</div>${FOOT}` },
  { file: "more-05-stationery", w: 1080, h: 1350, html: `${head(`편지지 고르느라<br>${R("문구점에서 한참")}<br>서 있던 기억`, "그때 고른 편지지, 아직 서랍에 있나요?")}
    ${[["#F7D6D0", -16, 150], ["#D9E8D2", -6, 290], ["#FFF1C9", 4, 430], ["#D6E2F2", 14, 570]].map(([bg, r, x]) => `<div style="position:absolute;left:${x}px;top:660px;width:360px;height:480px;background:${bg};transform:rotate(${r}deg);transform-origin:bottom center;box-shadow:0 10px 24px rgba(60,40,20,.2);background-image:linear-gradient(transparent 58px,rgba(30,58,92,.18) 58px,rgba(30,58,92,.18) 60px);background-size:100% 60px"><div style="position:absolute;right:24px;top:20px;font-size:54px">${["🌸", "🍀", "⭐", "💌"][[150, 290, 430, 570].indexOf(x as number)]}</div></div>`).join("")}
    ${FOOT}` },
  { file: "more-06-rewrite", w: 1080, h: 1350, html: `${NIGHT}${head(`쓰다가 틀려서<br><span style="color:#F0BC5C">몇 장이고 다시 쓰던</span> 편지`, "그 정성이 그리운 밤이에요.")}${stars([[160, 520], [900, 460], [960, 640], [120, 740]])}
    ${[[-14, 140, 980], [10, 760, 1000], [-4, 840, 820]].map(([r, x, y]) => `<div style="position:absolute;left:${x}px;top:${y}px;width:170px;height:130px;background:#EDE0C2;border-radius:30% 40% 35% 45%;transform:rotate(${r}deg);box-shadow:inset -10px -12px 20px rgba(80,60,30,.35)"></div>`).join("")}
    <div style="position:absolute;left:240px;top:640px;width:600px;height:440px;background:#FFF8E8;transform:rotate(-3deg);box-shadow:0 14px 30px rgba(0,0,0,.4);padding:44px 50px">
      <div class="pen" style="font-size:56px;line-height:1.35;color:${NAVY}"><s style="opacity:.55">네가 보고 십어서</s><br><s style="opacity:.55">네가 보고싶어</s><br>네가 보고 싶어서 써.</div></div>${FOOT}` },
  { file: "more-07-readmark", w: 1080, h: 1350, html: `${head(`‘읽음’ 표시 대신<br>${R("‘지금 대전을 지나는 중’")}`, "새 편지는 기다리는 과정까지 같이 봐요.")}
    ${phone("ios-4-map.png", 300, 560, 480, 680, -2, "center 30%")}${FOOT}` },
  { file: "more-08-army", w: 1080, h: 1350, html: `${head(`멀리 간 친구에게<br>${R("쓰던 편지")}, 기억나요?`, "보고 싶은 사람에게 오늘 한 통.")}
    ${envelope(100, 680, 880, 460, `<div class="batang" style="position:absolute;left:60px;top:60px;font-size:26px;letter-spacing:4px;opacity:.6">BY AIR MAIL · 새로 보냄</div><div class="pen" style="position:absolute;left:60px;top:190px;font-size:66px;line-height:1.25;color:${NAVY}">보고 싶은 내 친구에게<br><span style="font-size:48px">— 몸 건강히, 꼭 답장해!</span></div>`, 3)}
    ${stamp(760, 610, 200, 250, "hawk", -6)}${postmark(520, 980, "새편지 우체국", "서울", "2026 · 11")}${FOOT}` },
  { file: "more-09-ranking", w: 1080, h: 1350, html: `${head(`누가누가<br>${R("멀리 보냈나")} 🏆`, "편지가 날아간 거리로 겨루는 랭킹.<br>친구끼리, 그리고 새 편지를 쓰는 모두와.", "", true)}
    <svg width="1080" height="1350" style="position:absolute;inset:0">
      <rect x="400" y="860" width="280" height="300" fill="${RED}"/><rect x="130" y="940" width="270" height="220" fill="${NAVY}"/><rect x="680" y="1000" width="270" height="160" fill="#B07A1A"/>
      <text x="540" y="1000" text-anchor="middle" font-family="Gowun Batang" font-weight="700" font-size="110" fill="#FFF3D8">1</text>
      <text x="265" y="1070" text-anchor="middle" font-family="Gowun Batang" font-weight="700" font-size="90" fill="#FFF3D8">2</text>
      <text x="815" y="1110" text-anchor="middle" font-family="Gowun Batang" font-weight="700" font-size="80" fill="#FFF3D8">3</text></svg>
    ${birdAt("hawk", 445, 670, 190)}${birdAt("pigeon", 180, 760, 170)}${birdAt("magpie", 730, 830, 160)}${FOOT}` },
  { file: "more-10-waitforreply", w: 1080, h: 1350, html: `${head(`편지 끝에 꼭 쓰던 말`, "그 말이 다시 설레는 앱이에요.", "", true)}
    ${lined(140, 470, 800, 640, pen("…그럼 이만 줄일게.<br>늘 건강하고.<br><br><span style='font-size:96px;color:#B33A1F'>답장 기다릴게.</span>", 62, INK), 1.5)}
    ${postmark(560, 1000, "새편지 우체국", "부산", "2026 · 11")}${FOOT}` },
  { file: "more-11-lunchnote", w: 1080, h: 1350, html: `${head(`엄마가 도시락에<br>넣어 주던 ${R("쪽지")} 💌`, "이번엔 내가 먼저 써 볼까요?")}
    <div style="position:absolute;left:150px;top:680px;width:780px;height:440px;border-radius:40px;background:#E8C9A0;border:10px solid #B5865A;box-shadow:0 20px 40px rgba(60,40,20,.3)"></div>
    <div style="position:absolute;left:300px;top:610px;width:480px;height:330px;background:#FFF8E8;transform:rotate(-5deg);box-shadow:0 12px 26px rgba(60,40,20,.3);padding:44px 50px">
      <div class="pen" style="font-size:64px;line-height:1.3;color:${RED}">오늘도 힘내!<br>사랑해 ♥<br><span style="font-size:48px;color:${NAVY}">— 엄마가</span></div></div>
    ${birdAt("pigeon", 780, 960, 170, 6)}${FOOT}` },
  { file: "more-12-xmascard", w: 1080, h: 1350, html: `${NIGHT}${head(`크리스마스 카드 쓰던<br><span style="color:#F0BC5C">12월이 그리워요</span> 🎄`, "올해는 새에게 카드를 맡겨 보세요.")}${stars([[150, 560], [920, 520], [980, 760], [100, 860], [860, 1130]])}
    <div style="position:absolute;left:220px;top:660px;width:640px;height:460px;background:#7E2412;transform:rotate(-3deg);box-shadow:0 20px 40px rgba(0,0,0,.45);padding:26px"><div style="width:100%;height:100%;border:4px solid #F0BC5C;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px">
      <div style="font-size:110px">🎄</div><div class="pen" style="font-size:70px;color:#FFF3D8">Merry Christmas</div><div class="batang" style="font-size:30px;color:#F0BC5C">보고 싶은 너에게</div></div></div>
    ${birdAt("magpie", 760, 560, 180, -8)}${FOOT}` },
  { file: "more-13-slowtalk", w: 1080, h: 1350, html: `${head(`빨리 답하지 않아도<br>${R("괜찮은 대화")}`, "")}
    <div style="position:absolute;left:80px;right:80px;top:500px;display:flex;flex-direction:column;gap:30px">
      ${[["천천히 생각하고,", 0], ["천천히 쓰고,", 120], ["천천히 기다려요.", 240]].map(([t, x]) => `<div class="pen" style="font-size:96px;color:${NAVY};padding-left:${x}px">${t}</div>`).join("")}</div>
    <svg width="1080" height="1350" style="position:absolute;inset:0"><path d="M120 1120 C 360 1000, 620 1160, 860 1020" fill="none" stroke="${NAVY}" stroke-width="4" stroke-dasharray="3 14" stroke-linecap="round" opacity=".6"/></svg>
    ${birdAt("magpie", 800, 900, 180, -6)}${FOOT}` },
  { file: "more-14-when", w: 1080, h: 1350, html: `${head(`오늘 보낸 편지,<br>${R("언제 도착할까요?")}`, "매는 가까우면 30분, 까치는 반나절도 걸려요.<br>날아가는 새를 같이 지켜봐요 🕊")}
    ${phone("ios-1-list.png", 300, 600, 480, 620, 2)}${FOOT}` },
  { file: "more-15-chirp", w: 1080, h: 1350, html: `${head(`우체부 오토바이 소리에<br>${R("뛰어나가던 날")} 🛵`, "그 소리 대신, 짹짹! 새가 도착했어요.")}
    <svg width="1080" height="1350" style="position:absolute;inset:0"><path d="M60 1150 C 300 980, 560 1100, 760 860" fill="none" stroke="${NAVY}" stroke-width="5" stroke-dasharray="3 16" stroke-linecap="round" opacity=".55"/></svg>
    ${birdAt("magpie", 640, 640, 300, -10)}
    ${bubble("짹짹! 편지 왔어요!", 140, 720, false, 56)}${FOOT}` },
  { file: "more-16-hesitate", w: 1080, h: 1350, html: `${head(`좋아하는 사람에게 쓴 편지,<br>${R("부칠까 말까")}<br>며칠을 고민했던 적 💭`, "")}
    ${envelope(220, 760, 640, 380, `<div class="pen" style="position:absolute;left:50px;top:110px;font-size:60px;color:${NAVY}">너에게</div><div style="position:absolute;left:270px;top:200px;width:90px;height:90px;border-radius:50%;background:${RED};display:grid;place-items:center;font-size:44px;color:#FFE7C7">♥</div>`, -4)}
    ${bubble("부칠까?", 140, 560, false, 46)}${bubble("말까…?", 640, 600, true, 46)}${FOOT}` },
  { file: "more-17-scroll", w: 1080, h: 1350, html: `${head(`편지는 ${R("두루마리처럼")}<br>펼쳐져요 📜`, "사진은 폴라로이드처럼 서서히 선명해지고요.")}
    <div style="position:absolute;left:110px;top:650px;width:520px;height:480px;background:#FFF8E8;box-shadow:0 14px 30px rgba(60,40,20,.25);transform:rotate(-3deg);padding:60px 46px">
      <div style="position:absolute;left:-14px;right:-14px;top:-20px;height:44px;border-radius:22px;background:#D9BE8C;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)"></div>
      <div style="position:absolute;left:-14px;right:-14px;bottom:-20px;height:44px;border-radius:22px;background:#D9BE8C;box-shadow:inset 0 -6px 0 rgba(0,0,0,.12)"></div>
      <div class="pen" style="font-size:52px;line-height:1.35;color:${NAVY}">할머니,<br>귤 잘 받았어요.<br>보고 싶어요.</div></div>
    <div style="position:absolute;left:600px;top:700px;width:380px;height:450px;background:#fff;padding:22px 22px 90px;transform:rotate(6deg);box-shadow:0 16px 34px rgba(60,40,20,.3)">
      <div style="width:100%;height:100%;background:linear-gradient(#F6C9A0,#E9A27A 50%,#7FA6CF);filter:blur(2px)"></div>
      <div class="pen" style="position:absolute;left:0;right:0;bottom:22px;text-align:center;font-size:40px;color:${INK}">제주에서 🍊</div></div>${FOOT}` },
  { file: "more-18-hourglass", w: 1080, h: 1350, html: `${head(`마음을 담는 시간,<br>도착하는 시간.<br>${R("둘 다 소중해요")}`, "")}
    <svg width="1080" height="1350" style="position:absolute;inset:0"><g transform="translate(360 640)">
      <rect x="0" y="0" width="360" height="30" rx="10" fill="#7E5634"/><rect x="0" y="500" width="360" height="30" rx="10" fill="#7E5634"/>
      <path d="M40 30 C 40 200, 170 230, 170 265 C 170 300, 40 330, 40 500 H320 C 320 330, 190 300, 190 265 C 190 230, 320 200, 320 30 Z" fill="#FFF8E8" fill-opacity=".7" stroke="#7E5634" stroke-width="6"/>
      <path d="M80 110 C 120 190, 165 220, 175 255 H185 C 195 220, 240 190, 280 110 Z" fill="#E0A83C"/><path d="M60 500 C 100 420, 150 400, 180 400 C 210 400, 260 420, 300 500 Z" fill="#E0A83C"/><path d="M180 265 V400" stroke="#E0A83C" stroke-width="4"/></g></svg>
    ${birdAt("pigeon", 730, 980, 170, -4)}${FOOT}` },
  { file: "more-19-rolling", w: 1080, h: 1350, html: `${head(`졸업식 날 ${R("롤링페이퍼")},<br>아직 갖고 있어요? 📜`, "그 마음 그대로, 편지로.")}
    <div style="position:absolute;left:110px;top:620px;width:860px;height:540px;background:#FFFBF0;box-shadow:0 16px 34px rgba(60,40,20,.2);transform:rotate(-1deg)">
      ${[["졸업 축하해!! 🎉", 40, 40, RED, -6], ["우리 꼭 연락하자", 470, 60, NAVY, 4], ["너 덕분에 3년이<br>즐거웠어 ♥", 60, 200, "#1B6E5C", 3], ["대학 가서도 잊지 마~", 450, 230, "#B07A1A", -4], ["10년 뒤에 보자!", 120, 400, NAVY, -2], ["항상 응원해 ✌", 520, 400, RED, 5]].map(([t, x, y, c, r]) => `<div class="pen" style="position:absolute;left:${x}px;top:${y}px;font-size:52px;line-height:1.2;color:${c};transform:rotate(${r}deg)">${t}</div>`).join("")}</div>${FOOT}` },
  { file: "more-20-tooquick", w: 1080, h: 1350, html: `${head(`너무 빨리 대답하느라<br>${R("진짜 하고 싶은 말")}을<br>못 하는 건 아닐까요?`, "")}
    ${bubble("ㅇㅋ", 110, 720, false, 44)}${bubble("ㅋㅋㅋ", 300, 820, true, 44)}${bubble("ㄱㄱ", 130, 920, false, 44)}${bubble("👍", 330, 1010, true, 44)}
    ${lined(560, 720, 420, 400, pen("사실은<br>그동안 고마웠다고<br>말하고 싶었어.", 50, INK), 3)}${FOOT}` },
  { file: "more-21-map", w: 1080, h: 1350, html: `${head(`보낸 편지가 지금<br>${R("어디쯤 날고 있는지")} 🗺`, "기다림이 이렇게 재밌을 줄이야.")}
    ${phone("ios-4-map.png", 300, 560, 480, 680, 3, "center 60%")}${FOOT}` },
  { file: "more-22-sharemap", w: 1080, h: 1350, html: `${head(`지도 사진으로<br>${R("공유해 보세요")} 📸`, "내 편지가 어디를 날고 있는지 한 장으로.<br>편지 내용은 들어가지 않아요.")}
    ${phone("ios-2-room.png", 300, 620, 480, 600, -3)}${FOOT}` },
  { file: "more-23-someone", w: 1080, h: 1350, html: `${NIGHT}${head(`생각나는 사람이 있다면,<br><span style="color:#F0BC5C">그게 편지를 쓸<br>이유예요</span>`, "")}${stars([[150, 520], [900, 480], [970, 700], [110, 760]])}
    <div style="position:absolute;left:640px;top:560px;width:220px;height:220px;border-radius:50%;background:#F6E2A8;box-shadow:0 0 80px rgba(246,226,168,.6)"></div>
    <div style="position:absolute;left:180px;top:800px;width:600px;height:330px;background:#FFF8E8;transform:rotate(-4deg);box-shadow:0 14px 30px rgba(0,0,0,.45);padding:44px 50px">
      <div class="pen" style="font-size:58px;line-height:1.35;color:${NAVY}">그냥,<br>네 생각이 나서 써.</div></div>
    ${birdAt("hawk", 760, 900, 180, -8)}${FOOT}` },
  { file: "more-24-thanks", w: 1080, h: 1350, html: `${head(`한 달 동안 함께<br>${R("기다려 주셔서 고마워요")} 🕊`, "다음 편지는 누구에게 보낼까요?", "", true)}
    ${[["#FFF3D8", -9, 0], ["#F5E6C4", 5, 40], ["#FFF8E8", -2, 80]].map(([bg, r, dy]) => `<div style="position:absolute;left:190px;top:${660 + (dy as number)}px;width:700px;height:380px;background:${bg};transform:rotate(${r}deg);box-shadow:0 10px 24px rgba(60,40,20,.2)"></div>`).join("")}
    <div class="pen" style="position:absolute;left:0;right:0;top:840px;text-align:center;font-size:80px;color:${RED}">고마워요 ♥</div>
    ${birdAt("magpie", 150, 1000, 160, -6)}${birdAt("pigeon", 460, 1030, 150, 4)}${birdAt("hawk", 760, 1000, 160, -4)}${FOOT}` },
  // 가입·초대가 쉽다(2026-11-09 대표님: "메신저인 만큼 초대가 아주 간단하고, 카카오랑 연동되고, 어디로 로그인되는지 설명")
  { file: "more-25-login", w: 1080, h: 1350, html: `${head(`가입은 ${R("버튼 한 번")}`, "아이디·비밀번호 만들 필요 없어요.<br>쓰던 계정으로 누르면 바로 시작이에요.", "", true)}
    <div style="position:absolute;left:190px;right:190px;top:600px;display:flex;flex-direction:column;gap:28px">
      ${[["#FEE500", "#191600", "💬 카카오로 가입하기"], ["#FFFFFF", "#1F1F1F", "G  구글로 가입하기"], ["#111111", "#FFFFFF", "  애플로 가입하기"]].map(([bg, fg, t]) => `<div style="height:116px;border-radius:30px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font-family:'Gowun Batang';font-weight:700;font-size:44px;box-shadow:0 10px 22px rgba(60,40,20,.2);border:2px solid rgba(0,0,0,.08)">${t}</div>`).join("")}
      <div class="batang" style="text-align:center;font-size:28px;opacity:.75;margin-top:6px">카카오 이름과 사진이 그대로 · 애플은 아이폰에서</div></div>
    ${birdAt("magpie", 830, 1060, 150, -6)}${FOOT}` },
  { file: "more-26-invite", w: 1080, h: 1350, html: `${head(`초대는 ${R("카톡 한 번")}이면 끝`, "링크를 누른 친구가 가입하면 저절로 친구가 돼요.<br>앱이 없어도 날아오는 편지를 볼 수 있어요.")}
    <div style="position:absolute;left:120px;top:640px;width:560px;height:520px;background:#BACEE0;border-radius:36px;padding:40px 34px;box-shadow:0 20px 40px rgba(60,40,20,.25)">
      <div class="batang" style="font-size:28px;color:#2B3A4A;margin-bottom:18px">엄마 ♥</div>
      <div style="background:#fff;border-radius:22px;overflow:hidden;width:420px">
        <div style="height:150px;background:#FBF3E4;display:grid;place-items:center">${bird("magpie", 120, true)}</div>
        <div style="padding:20px 24px"><div class="batang" style="font-size:32px;font-weight:700;color:${INK}">새 편지로 초대했어요 🕊</div>
        <div class="batang" style="font-size:24px;color:#6B5E52;margin-top:8px">누르면 바로 친구가 돼요</div></div>
        <div style="border-top:1px solid #eee;padding:18px;text-align:center;font-family:'Gowun Batang';font-size:30px;font-weight:700;color:${RED}">친구 되기</div></div></div>
    <div style="position:absolute;left:720px;top:720px;display:flex;flex-direction:column;gap:22px">
      ${["💬 카카오톡", "✉ 문자", "🔗 링크 복사"].map((t) => `<div style="padding:22px 30px;border-radius:24px;background:#FFF8E8;font-family:'Gowun Batang';font-size:36px;font-weight:700;box-shadow:0 8px 18px rgba(60,40,20,.18)">${t}</div>`).join("")}</div>${FOOT}` },
];
const only = process.argv[2];
cards.length = 0; // 2차 카드만 다시 만들 때: npx tsx promo/build-classic2.mts
cards.push(...cards2.filter((c) => !only || c.file.includes(only)));

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
