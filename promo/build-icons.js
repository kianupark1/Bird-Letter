// 앱 아이콘 생성기: node promo/build-icons.js  → public/icon-*.png, src/app/favicon.ico 대신 icon.png
const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(__dirname, "cards-src");
fs.mkdirSync(srcDir, { recursive: true });
const EDGE = ["C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "C:/Program Files/Microsoft/Edge/Application/msedge.exe"].find((p) => fs.existsSync(p));
if (!EDGE) throw new Error("Edge를 찾을 수 없어요");

// 까치(크림색 몸통)를 다홍 배경 위에. safe는 마스커블 아이콘용 안전 여백(%)
const magpie = `<svg viewBox="0 0 200 160" xmlns="http://www.w3.org/2000/svg">
<path d="M40 92 L6 118 L46 108 Z" fill="#FBF3E4"/><ellipse cx="96" cy="88" rx="52" ry="34" fill="#FBF3E4"/>
<ellipse cx="104" cy="104" rx="30" ry="18" fill="#E8683F" opacity=".35"/><path d="M66 82 Q96 52 128 82 Q100 96 66 82 Z" fill="#E0A83C"/>
<circle cx="140" cy="62" r="22" fill="#FBF3E4"/><circle cx="148" cy="58" r="3.5" fill="#1E3A5C"/>
<path d="M160 62 L184 68 L160 74 Z" fill="#E0A83C"/><path d="M86 120 L82 144 M106 120 L110 144" stroke="#E0A83C" stroke-width="4" stroke-linecap="round"/></svg>`;

const make = (name, size, birdPct, rounded) => {
  const html = `<!doctype html><meta charset="utf-8"><style>*{margin:0}html,body{width:${size}px;height:${size}px;background:transparent}
  .bg{width:${size}px;height:${size}px;background:#C1481F;display:grid;place-items:center;${rounded ? `border-radius:${Math.round(size * 0.22)}px;` : ""}}
  .b{width:${birdPct}%}</style><div class="bg"><div class="b">${magpie}</div></div>`;
  const htmlPath = path.join(srcDir, `${name}.html`);
  fs.writeFileSync(htmlPath, html, "utf8");
  const out = path.join(root, "public", `${name}.png`);
  execFileSync(EDGE, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", "--default-background-color=00000000",
    `--window-size=${size},${size}`, "--virtual-time-budget=2000", `--screenshot=${out}`, "file:///" + htmlPath.replace(/\\/g, "/")], { stdio: "ignore", timeout: 60000 });
  console.log(name, fs.existsSync(out) ? fs.statSync(out).size + " bytes" : "MISSING");
  return out;
};

fs.mkdirSync(path.join(root, "public"), { recursive: true });
make("icon-192", 192, 74, true);
make("icon-512", 512, 74, true);
make("icon-512-maskable", 512, 56, false); // 모서리가 잘려도 되도록 그림을 작게, 배경은 꽉 채움
const apple = make("apple-icon", 180, 74, false);
fs.copyFileSync(apple, path.join(root, "src", "app", "apple-icon.png"));
fs.copyFileSync(path.join(root, "public", "icon-192.png"), path.join(root, "src", "app", "icon.png"));
