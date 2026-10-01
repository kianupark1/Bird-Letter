// 앱인토스 콘솔 제출용 이미지 생성기: node promo/build-toss-assets.js  → toss/assets/logo-600.png
// 규격(공식 콘솔 문서): 앱 로고 600×600px PNG, 정사각형, 둥근 모서리 불가
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const outDir = path.join(root, "toss", "assets");
const srcDir = path.join(__dirname, "cards-src");
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(srcDir, { recursive: true });
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
if (!EDGE) throw new Error("Edge를 찾을 수 없어요");

const magpie = `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
<path d="M40 92 L6 118 L46 108 Z" fill="#FBF3E4"/><ellipse cx="96" cy="88" rx="52" ry="34" fill="#FBF3E4"/>
<ellipse cx="104" cy="104" rx="30" ry="18" fill="#E8683F" opacity=".35"/><path d="M66 82 Q96 52 128 82 Q100 96 66 82 Z" fill="#E0A83C"/>
<circle cx="140" cy="62" r="22" fill="#FBF3E4"/><circle cx="148" cy="58" r="3.5" fill="#1E3A5C"/>
<path d="M160 62 L184 68 L160 74 Z" fill="#E0A83C"/><path d="M86 120 L82 144 M106 120 L110 144" stroke="#E0A83C" stroke-width="4" stroke-linecap="round"/></svg>`;

const size = 600;
// 정사각형 꽉 채움(모서리를 둥글게 자르지 않음), 새는 안전 여백 안에 배치
const html = `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{width:${size}px;height:${size}px}
.bg{width:${size}px;height:${size}px;background:#C1481F;display:grid;place-items:center}.b{width:66%;transform:translateY(4%)}</style>
<div class="bg"><div class="b">${magpie}</div></div>`;
const htmlPath = path.join(srcDir, "toss-logo.html");
fs.writeFileSync(htmlPath, html, "utf8");
const out = path.join(outDir, "logo-600.png");
execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1",
  `--window-size=${size},${size}`, "--virtual-time-budget=2000", `--screenshot=${out}`, "file:///" + htmlPath.replace(/\\/g, "/")], { stdio: "ignore", timeout: 60000 });
console.log("logo-600.png", fs.existsSync(out) ? fs.statSync(out).size + " bytes" : "MISSING");
