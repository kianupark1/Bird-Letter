/**
 * 앱 아이콘 생성기: npx tsx promo/build-icons.mts
 * 편지를 문 까치가 날아가는 모습을 날개를 활짝 펼친 모습으로 직접 그려 다홍 바탕에 놓고, 구름을 깔아 "날아가는 느낌"을 줍니다. Playwright(Chromium)로 PNG를 만듭니다.
 * → public/icon-192.png, icon-512.png, icon-512-maskable.png, apple-icon.png, src/app/{icon,apple-icon}.png
 * → assets/(스토어 앱용 원본, @capacitor/assets가 안드로이드·아이폰 크기로 나눔): icon-only, icon-foreground, icon-background, splash, splash-dark
 */
import { createRequire } from "node:module";
import { copyFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");

const root = resolve(import.meta.dirname, "..");
// 날개를 활짝 펼친 까치가 편지를 물고 구름 사이를 날아가는 그림(200x200). 색은 앱의 오방색 그대로.
const NAVY = "#1E3A5C", DARK = "#142A44", GREEN = "#1B6E5C", CREAM = "#FBF3E4", GOLD = "#E0A83C", RED = "#C1481F";
const scene = (k: number, clouds = true) => `
${clouds ? "" : "<!--"}<g fill="${CREAM}">
  <g opacity=".30"><circle cx="34" cy="150" r="14"/><circle cx="52" cy="144" r="18"/><circle cx="72" cy="152" r="13"/><rect x="26" y="150" width="56" height="14" rx="7"/></g>
  <g opacity=".22"><circle cx="150" cy="40" r="10"/><circle cx="164" cy="34" r="13"/><circle cx="180" cy="42" r="9"/><rect x="142" y="40" width="46" height="11" rx="5.5"/></g>
  <g opacity=".18"><circle cx="150" cy="176" r="9"/><circle cx="164" cy="171" r="12"/><rect x="142" y="176" width="40" height="10" rx="5"/></g>
</g>${clouds ? "" : "-->"}
<g transform="translate(94 104) scale(${k}) translate(-104 -100)">
  <!-- 먼 쪽 날개(위로 솟음) -->
  <path d="M98 102 C102 62 112 30 132 4 C140 34 134 72 116 106 Z" fill="${DARK}"/>
  <path d="M112 90 C116 62 122 38 132 16" stroke="${GREEN}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
  <!-- 꼬리 -->
  <path d="M66 116 L12 140 L22 148 L72 134 Z" fill="${NAVY}"/>
  <path d="M22 142 L64 126" stroke="${GREEN}" stroke-width="3.4" stroke-linecap="round"/>
  <!-- 몸통과 배 -->
  <ellipse cx="102" cy="112" rx="42" ry="22" transform="rotate(-12 102 112)" fill="${NAVY}"/>
  <ellipse cx="106" cy="123" rx="27" ry="11" transform="rotate(-12 106 123)" fill="${CREAM}"/>
  <!-- 가까운 쪽 날개(뒤로 크게 펼침) -->
  <path d="M96 108 C74 66 44 38 6 30 C14 38 22 46 26 54 C20 54 14 54 8 52 C24 66 40 84 60 104 C52 106 46 106 40 104 C58 118 76 124 92 122 Z" fill="${NAVY}"/>
  <path d="M90 108 C70 76 46 52 20 40" stroke="${GREEN}" stroke-width="7" fill="none" stroke-linecap="round"/>
  <path d="M82 104 C66 82 48 66 30 56" stroke="#3EA890" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
  <path d="M30 44 L10 33 L18 46 Z" fill="${CREAM}"/>
  <!-- 머리·눈·부리 -->
  <circle cx="144" cy="94" r="18" fill="${NAVY}"/>
  <circle cx="150" cy="90" r="4.4" fill="${CREAM}"/><circle cx="151.4" cy="90.4" r="2.1" fill="#1A1613"/>
  <!-- 입에 문 편지: 편지를 먼저 그리고 부리를 그 위에 얹어서 "물고 있는" 모습 -->
  <g transform="translate(188 111) rotate(10)">
    <rect x="-22" y="-15" width="44" height="30" rx="3.5" fill="rgba(0,0,0,.22)" transform="translate(2.5 3.5)"/>
    <rect x="-22" y="-15" width="44" height="30" rx="3.5" fill="${CREAM}"/>
    <!-- 항공우편풍 빨강·남색 줄무늬 테두리 -->
    <rect x="-20" y="-13" width="40" height="26" rx="2.5" fill="none" stroke="${RED}" stroke-width="4"/>
    <rect x="-20" y="-13" width="40" height="26" rx="2.5" fill="none" stroke="${NAVY}" stroke-width="4" stroke-dasharray="6 6" stroke-dashoffset="3"/>
    <rect x="-17.5" y="-10.5" width="35" height="21" rx="1.5" fill="#FFF9EC"/>
    <!-- 뚜껑 접힌 선과 그늘 -->
    <path d="M-17.5 -10.5 L0 4 L17.5 -10.5 Z" fill="${RED}" opacity=".09"/>
    <path d="M-17.5 -10.5 L0 4 L17.5 -10.5" fill="none" stroke="${RED}" stroke-width="1.8" stroke-linejoin="round"/>
    <path d="M-17.5 10.5 L-5 0 M17.5 10.5 L5 0" fill="none" stroke="${RED}" stroke-width="1.2" opacity=".5"/>
    <!-- 하트 도장 -->
    <circle cx="0" cy="4" r="7" fill="${RED}"/>
    <circle cx="0" cy="4" r="7" fill="none" stroke="${GOLD}" stroke-width="1.4"/>
    <path d="M0 8.6 C-5.4 4.4 -2.6 0.4 0 2.8 C2.6 0.4 5.4 4.4 0 8.6 Z" fill="${CREAM}"/>
  </g>
  <path d="M157 100 L181 103 L158 106 Z" fill="#B5832A"/>
  <path d="M157 92 L182 100 L157 101 Z" fill="${GOLD}"/>
</g>`;

const GRAD = "linear-gradient(160deg,#D2552A 0%,#C1481F 55%,#A83B17 100%)";
const html = (size: number, k: number, rounded: boolean, bg = GRAD, art = true, clouds = true) => `<!doctype html><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}html,body{width:${size}px;height:${size}px;background:transparent}
.bg{position:relative;width:${size}px;height:${size}px;background:${bg};overflow:hidden;${rounded ? `border-radius:${Math.round(size * 0.22)}px;` : ""}}
.bg svg{position:absolute;inset:0;width:100%;height:100%;display:block}
</style><div class="bg">${art ? `<svg viewBox="0 0 200 200">${scene(k, clouds)}</svg>` : ""}</div>`;
// 시작 화면: 한지(또는 먹빛) 바탕 가운데에 둥근 아이콘 하나
const splash = (size: number, page: string) => `<!doctype html><meta charset="utf-8"><style>
*{margin:0}html,body{width:${size}px;height:${size}px;background:${page};display:grid;place-items:center}
.i{width:${Math.round(size * 0.22)}px;height:${Math.round(size * 0.22)}px;border-radius:22%;background:${GRAD};overflow:hidden}
.i svg{width:100%;height:100%;display:block}
</style><div class="i"><svg viewBox="0 0 200 200">${scene(0.9)}</svg></div>`;

mkdirSync(resolve(root, "public"), { recursive: true });
const browser = await chromium.launch();
const shot = async (path: string, size: number, content: string) => {
  const page = await browser.newPage({ viewport: { width: size, height: size }, deviceScaleFactor: 1 });
  await page.setContent(content);
  await page.screenshot({ path: resolve(root, path), omitBackground: true });
  await page.close();
  console.log(path);
};
const make = (name: string, size: number, pct: number, rounded: boolean) => shot(`public/${name}.png`, size, html(size, pct, rounded));
await make("icon-192", 192, 0.9, true);
await make("icon-512", 512, 0.9, true);
await make("icon-512-maskable", 512, 0.7, false); // 모서리가 잘려도 되도록 그림을 작게, 배경은 꽉 채움
await make("apple-icon", 180, 0.9, false);
// 스토어 앱용 원본(1024px). 안드로이드 둥근·물방울 아이콘은 가장자리가 잘려서 앞 그림(foreground)을 작게.
mkdirSync(resolve(root, "assets"), { recursive: true });
await shot("assets/icon-only.png", 1024, html(1024, 0.9, false));
await shot("assets/icon-foreground.png", 1024, html(1024, 0.62, false, "transparent"));
await shot("assets/icon-background.png", 1024, html(1024, 0.9, false, GRAD, false));
await shot("assets/splash.png", 2732, splash(2732, "#FBF3E4"));
await shot("assets/splash-dark.png", 2732, splash(2732, "#1A1613"));
// 안드로이드 알림 줄의 작은 아이콘: 흰색 실루엣만(투명 바탕). 구름은 빼요.
await shot("assets/notify-icon.png", 96, `<!doctype html><style>*{margin:0}html,body{width:96px;height:96px;background:transparent}svg{width:96px;height:96px;display:block;filter:brightness(0) invert(1)}</style><svg viewBox="0 0 200 200">${scene(1, false)}</svg>`);
// SNS 프로필 사진(인스타·틱톡·유튜브는 동그랗게 잘라 보여 줘서 그림을 가운데로 작게, 잘리는 구름은 뺌): promo/sns/
mkdirSync(resolve(root, "promo/sns"), { recursive: true });
await shot("promo/sns/profile-dahong.png", 1080, html(1080, 0.7, false, GRAD, true, false));
await shot("promo/sns/profile-hanji.png", 1080, html(1080, 0.7, false, "radial-gradient(circle at 50% 40%,#FFF9EE 0%,#FBF3E4 60%,#F1E2C6 100%)", true, false));
await shot("promo/sns/profile-night.png", 1080, html(1080, 0.7, false, "linear-gradient(160deg,#2A4B73 0%,#1E3A5C 55%,#142A45 100%)", true, false));
await browser.close();
copyFileSync(resolve(root, "public/apple-icon.png"), resolve(root, "src/app/apple-icon.png"));
copyFileSync(resolve(root, "public/icon-192.png"), resolve(root, "src/app/icon.png"));
