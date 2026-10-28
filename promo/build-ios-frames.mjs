/**
 * 앱스토어 화면 사진에 제목을 얹은 판(6.9인치 1320×2868): node promo/build-ios-frames.mjs
 * 먼저 node promo/build-store-shots.mjs [주소] --ios 로 promo/store/ios-*.png(실제 화면)를 만들어 두세요.
 * → promo/store/ios-frame-*.png. 첫 두 장이 스토어 검색 결과에 보여서 가장 중요해요(promo/출시-홍보.md 11번).
 * 홍보 문구 규칙: "실제 새 속도와 같다"고 쓰지 않음. 슬로건은 첫 장에.
 */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const { chromium } = req("playwright");
const DIR = resolve(import.meta.dirname, "store");
const font = readFileSync(resolve(import.meta.dirname, "../src/app/fonts/PretendardSub.woff2")).toString("base64");
const SLOGAN = "기다림도 소통의 일부입니다.";
const FRAMES = [
  { shot: "1-list", title: "보고 싶은 사람에게<br>새가 편지를 물고 날아가요", sub: SLOGAN, bg: "#C1481F" },
  { shot: "2-room", title: "편지가 어디쯤 왔는지<br>둘이 같이 기다려요", sub: "도착 시각까지 카운트다운", bg: "#1E3A5C" },
  { shot: "3-birds", title: "새 6종, 걸리는 시간이<br>저마다 달라요", sub: "빠른 매부터 느긋한 까치까지", bg: "#1B6E5C" },
  { shot: "4-map", title: "날아오는 길을<br>지도로 따라가요", sub: "지금 지나는 곳과 남은 거리", bg: "#B07A1E" },
  { shot: "5-welcome", title: "느리게 와서<br>더 설레는 편지", sub: SLOGAN, bg: "#C1481F" },
];

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1320, height: 2868 } });
for (const f of FRAMES) {
  const img = readFileSync(resolve(DIR, `ios-${f.shot}.png`)).toString("base64");
  await page.setContent(`<!doctype html><html><head><style>
    @font-face { font-family: P; src: url(data:font/woff2;base64,${font}) format("woff2"); font-weight: 100 900; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1320px; height: 2868px; background: ${f.bg}; font-family: P, sans-serif; color: #fff; overflow: hidden; position: relative; }
    .saek { position: absolute; top: 0; left: 0; right: 0; height: 22px; background: linear-gradient(90deg, #C1481F 0 20%, #E0A83C 20% 40%, #1B6E5C 40% 60%, #1E3A5C 60% 80%, #FBF3E4 80%); }
    h1 { position: absolute; top: 170px; left: 0; right: 0; text-align: center; font-size: 104px; font-weight: 800; line-height: 1.28; letter-spacing: -2px; }
    p { position: absolute; top: 470px; left: 0; right: 0; text-align: center; font-size: 54px; font-weight: 600; opacity: .9; }
    .phone { position: absolute; top: 650px; left: 50%; width: 1000px; transform: translateX(-50%); border-radius: 72px; overflow: hidden; box-shadow: 0 40px 90px rgba(0,0,0,.35); border: 14px solid #1A1613; background: #1A1613; }
    .phone img { display: block; width: 100%; border-radius: 58px; }
  </style></head><body><div class="saek"></div><h1>${f.title}</h1><p>${f.sub}</p><div class="phone"><img src="data:image/png;base64,${img}"></div></body></html>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: resolve(DIR, `ios-frame-${f.shot}.png`) });
  console.log("ios-frame-" + f.shot);
}
await browser.close();
