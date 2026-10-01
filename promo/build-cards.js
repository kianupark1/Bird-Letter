// 홍보 이미지 생성기: node promo/build-cards.js
// Edge(헤드리스)로 HTML을 PNG로 뽑아요. 결과: promo/cards/*.png, public/og.png
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(__dirname, "cards-src");
const outDir = path.join(__dirname, "cards");
fs.mkdirSync(srcDir, { recursive: true });
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(path.join(root, "public"), { recursive: true });

const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
if (!EDGE) throw new Error("Edge를 찾을 수 없어요");

const FONT = "../../node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2";
const BIRDS = [
  ["🦅", "매", "프리미엄", 15],
  ["🐦", "제비", "추천", 30],
  ["🕊️", "비둘기", "기본", 40],
  ["🐦‍⬛", "까치", "특별", 55],
  ["🚁", "붕붕이", "재미", 20],
  ["🦢", "두루미", "귀한 소식", 90],
];
const fmt = (m) => (m < 60 ? `${m}분` : m % 60 ? `${Math.floor(m / 60)}시간 ${m % 60}분` : `${Math.floor(m / 60)}시간`);
const timeFor = (min, km) => fmt(Math.round((min * km) / 325));

const MAGPIE = `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
<path d="M40 92 L6 118 L46 108 Z" fill="#1E3A5C"/><ellipse cx="96" cy="88" rx="52" ry="34" fill="#1E3A5C"/>
<ellipse cx="104" cy="104" rx="30" ry="18" fill="#FBF3E4"/><path d="M66 82 Q96 52 128 82 Q100 96 66 82 Z" fill="#1B6E5C"/>
<circle cx="140" cy="62" r="22" fill="#1E3A5C"/><circle cx="148" cy="58" r="3.5" fill="#FBF3E4"/><circle cx="149" cy="58" r="1.5" fill="#2A2118"/>
<path d="M160 62 L184 68 L160 74 Z" fill="#E0A83C"/><path d="M86 120 L82 144 M106 120 L110 144" stroke="#E0A83C" stroke-width="4" stroke-linecap="round"/>
<path d="M20 40 q8 -10 16 0 M168 28 q8 -10 16 0" stroke="#E0A83C" stroke-width="3" fill="none" stroke-linecap="round"/></svg>`;
const MAGPIE_ON_DARK = MAGPIE.replace(/#1E3A5C/g, "#8FB3DA").replace('fill="#2A2118"', 'fill="#1A2538"');

const BASE = `
@font-face { font-family: P; src: url("${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: 100%; height: 100%; }
body { font-family: P, "Malgun Gothic", sans-serif; color: #2A2118; background: #FBF3E4; position: relative; overflow: hidden; }
.band { position: absolute; left: 0; right: 0; top: 0; height: 22px; display: flex; }
.band i { flex: 1; } .band i:nth-child(1){background:#C1481F} .band i:nth-child(2){background:#E0A83C} .band i:nth-child(3){background:#1B6E5C} .band i:nth-child(4){background:#1E3A5C} .band i:nth-child(5){background:#FBF3E4;border-bottom:2px solid #C1481F}
.wrap { position: absolute; inset: 22px 0 0 0; padding: 90px 84px 70px; display: flex; flex-direction: column; }
.brand { margin-top: auto; display: flex; justify-content: space-between; align-items: center; font-size: 30px; font-weight: 700; }
.brand small { font-size: 24px; font-weight: 600; color: #C1481F; border: 2px solid #E0A83C; border-radius: 999px; padding: 6px 18px; }
h1 { font-size: 92px; line-height: 1.12; letter-spacing: -2px; font-weight: 800; }
.proverb { color: #C1481F; font-weight: 700; font-size: 40px; margin-top: 28px; }
.sub { font-size: 36px; line-height: 1.55; opacity: .75; margin-top: 24px; }
`;

const cards = [
  {
    file: "01-concept", w: 1080, h: 1350,
    html: `<div class="band"><i></i><i></i><i></i><i></i><i></i></div><div class="wrap">
      <div style="width:620px;margin:20px auto 0">${MAGPIE}</div>
      <h1 style="text-align:center;margin-top:36px">소식은<br>날아서 와요</h1>
      <p class="proverb" style="text-align:center">“아침 까치가 울면 반가운 손님이 온다”</p>
      <p class="sub" style="text-align:center">실제 거리만큼 걸려 도착하는<br>느린 편지, 새 편지</p>
      <div class="brand"><span>🕊️ 새 편지</span><small>출시 준비 중 · 체험판</small></div></div>`,
  },
  {
    file: "02-birds", w: 1080, h: 1350,
    html: `<div class="band"><i></i><i></i><i></i><i></i><i></i></div><div class="wrap">
      <h1 style="font-size:80px">어떤 새에게<br>편지를 맡길까요?</h1>
      <p class="sub" style="margin-top:18px;font-size:32px">서울 → 부산 325km 기준</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:26px;margin-top:44px">
      ${BIRDS.map(([e, n, b, m]) => `<div style="background:#fff;border-radius:34px;padding:34px 38px;display:flex;align-items:center;gap:26px;box-shadow:0 6px 0 rgba(42,33,24,.06)">
        <span style="font-size:96px;line-height:1">${e}</span>
        <div><div style="font-size:48px;font-weight:800">${n}</div>
        <div style="font-size:34px;font-weight:700;color:#C1481F">약 ${m}분</div>
        <div style="display:inline-block;margin-top:8px;font-size:22px;font-weight:700;background:#E0A83C;border-radius:999px;padding:3px 14px">${b}</div></div></div>`).join("")}
      </div>
      <div class="brand"><span>🕊️ 새 편지</span><small>출시 준비 중 · 체험판</small></div></div>`,
  },
  {
    file: "03-magpie", w: 1080, h: 1350,
    html: `<style>body{background:#16243A;color:#FBF3E4} .brand small{color:#F0BC5C;border-color:#F0BC5C}
      .sp{position:absolute;font-size:54px}</style>
      <div class="band"><i></i><i></i><i></i><i></i><i></i></div>
      ${[[110,170,"✨"],[900,230,"💛"],[200,520,"🌸"],[860,600,"✨"],[120,880,"💛"],[930,940,"🌸"],[540,150,"✨"],[760,420,"🌸"]].map(([x, y, s]) => `<span class="sp" style="left:${x}px;top:${y}px">${s}</span>`).join("")}
      <div class="wrap">
      <div style="width:560px;margin:60px auto 0">${MAGPIE_ON_DARK}</div>
      <h1 style="text-align:center;margin-top:40px;font-size:84px">아침 까치가 울면<br>반가운 손님이 온다</h1>
      <p class="sub" style="text-align:center;color:#FBF3E4;opacity:.85">까치로 보낸 편지는<br>도착할 때 반짝이가 내려와요</p>
      <div class="brand"><span>🐦‍⬛ 새 편지</span><small>출시 준비 중 · 체험판</small></div></div>`,
  },
  {
    file: "04-jeju", w: 1080, h: 1350,
    html: `<div class="band"><i></i><i></i><i></i><i></i><i></i></div><div class="wrap">
      <h1 style="font-size:84px">서울 → 제주<br><span style="color:#C1481F">452km</span>, 새로 보내면?</h1>
      <svg viewBox="0 0 300 230" style="width:100%;height:410px;margin-top:30px;background:#fff;border-radius:34px">
        <path d="M120,30 L140,150 L115,200" stroke="#1E3A5C" stroke-width="2" stroke-dasharray="5 5" fill="none" opacity=".6"/>
        <path d="M120,30 L135,120" stroke="#C1481F" stroke-width="3.5" fill="none"/>
        ${[["남대문", 120, 30], ["남해 상공", 140, 150], ["한라산", 115, 200]].map(([n, x, y]) => `<circle cx="${x}" cy="${y}" r="4.5" fill="#E0A83C"/><text x="${x + 9}" y="${y + 4}" font-size="11" font-weight="700" fill="#2A2118" font-family="P">${n}</text>`).join("")}
        <text x="123" y="116" font-size="24">🦢</text></svg>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:18px;margin-top:34px">
      ${BIRDS.map(([e, n, , m]) => `<div style="background:#fff;border-radius:26px;padding:18px 10px;text-align:center"><div style="font-size:54px;line-height:1.1">${e}</div><div style="font-size:30px;font-weight:800">${n}</div><div style="font-size:28px;font-weight:700;color:#C1481F">${timeFor(m, 452)}</div></div>`).join("")}
      </div>
      <div class="brand"><span>🕊️ 새 편지</span><small>출시 준비 중 · 체험판</small></div></div>`,
  },
  {
    file: "og", w: 1200, h: 630, copyTo: path.join(root, "public", "og.png"),
    html: `<style>.wrap{padding:60px 76px 44px;flex-direction:row;align-items:center;gap:40px} h1{font-size:76px} .proverb{font-size:28px;margin-top:18px} .sub{font-size:28px;margin-top:14px}
      .brand{position:absolute;left:76px;bottom:40px;font-size:26px}</style>
      <div class="band"><i></i><i></i><i></i><i></i><i></i></div><div class="wrap">
      <div style="flex:1"><h1>소식은<br>날아서 와요</h1><p class="proverb">“아침 까치가 울면 반가운 손님이 온다”</p><p class="sub">실제 거리만큼 걸려 도착하는 느린 편지<br>출시 준비 중 · 체험판</p></div>
      <div style="width:430px">${MAGPIE}</div></div>
      <div class="brand">🕊️ 새 편지</div>`,
  },
];

for (const c of cards) {
  const htmlPath = path.join(srcDir, `${c.file}.html`);
  fs.writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${c.html}</body></html>`, "utf8");
  const png = path.join(outDir, `${c.file}.png`);
  execFileSync(EDGE, [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
    `--window-size=${c.w},${c.h}`, "--virtual-time-budget=4000",
    `--screenshot=${png}`, "file:///" + htmlPath.replace(/\\/g, "/"),
  ], { stdio: "ignore", timeout: 60000 });
  if (c.copyTo) fs.copyFileSync(png, c.copyTo);
  console.log(c.file, fs.existsSync(png) ? fs.statSync(png).size + " bytes" : "MISSING");
}
