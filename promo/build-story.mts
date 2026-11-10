/**
 * 그림 한 장 글을 "넘겨 보는 5장 이야기"로 바꿔요(2026-11-10 대표님: "인스타 한 장으로 올라가면 안 돼, 스토리 있게 여러 장").
 *   npx tsx promo/build-story.mts
 * 1장 기: 원래 그림(첫 장, 안드로이드 전엔 '곧 출시' 띠가 붙은 사본) → 2장 승: 그 글의 이야기 + 실제 앱 화면(글마다 다름)
 * → 3장 전: 이렇게 써요(편지 쓰기·지도로 같이 기다리기·두루마리) → 4장: 시작이 쉬워요 → 5장 결: 첫 편지 날려 보기 + 슬로건
 * 결과: promo/cards/story/d<날>-<때>-<원래 이름>-2.png·.jpg, 공통 promo/cards/story/how·easy·cta.png·.jpg, schedule.json의 글마다 carousel 칸.
 * 영상 글(릴스)은 그대로 둬요.
 */
import { createRequire } from "node:module";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../src/components/BirdIcon.tsx");
const { SLOGAN } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const b64 = (p: string) => readFileSync(p).toString("base64");
const shot = (f: string) => "data:image/png;base64," + b64(resolve(root, "promo/store", f));
const FONT = "data:font/woff2;base64," + b64(resolve(root, "src/app/fonts/PretendardSub.woff2"));
const DAHONG = "#C1481F", INK = "#1E1A17", GRAY = "#5E5750", BG = "#F3F1EE";
const N = 5;
const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const BASE = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 1080px; height: 1350px; }
body { font-family: P, sans-serif; color: ${INK}; background: ${BG}; position: relative; overflow: hidden; letter-spacing: -0.6px; }
svg { overflow: visible; display: block; }
.pic { position: absolute; left: 64px; right: 64px; top: 64px; height: 640px; border-radius: 36px; overflow: hidden; background: #FBF3E4; }
.pic img { width: 100%; height: 100%; object-fit: cover; }
.txt { position: absolute; left: 72px; right: 72px; top: 760px; }
.eye { font-size: 34px; font-weight: 800; color: ${DAHONG}; }
h1 { font-size: 66px; font-weight: 900; line-height: 1.22; letter-spacing: -2.2px; margin-top: 18px; word-break: keep-all; }
h1 em { font-style: normal; color: ${DAHONG}; }
.body { font-size: 35px; line-height: 1.6; color: ${GRAY}; margin-top: 26px; word-break: keep-all; }
.body b { color: ${INK}; }
.count { position: absolute; right: 52px; top: 52px; padding: 10px 22px; border-radius: 999px; background: rgba(30,26,23,.55); color: #fff; font-size: 28px; font-weight: 700; z-index: 2; }
.brand { position: absolute; right: 64px; bottom: 50px; display: flex; align-items: center; gap: 10px; font-size: 32px; font-weight: 900; }
.swipe { position: absolute; left: 72px; bottom: 56px; font-size: 28px; font-weight: 700; color: ${GRAY}; }
.row { display: flex; align-items: center; justify-content: space-between; background: #fff; border-radius: 24px; padding: 28px 36px; font-size: 38px; font-weight: 800; margin-bottom: 18px; }
.row span { font-size: 30px; font-weight: 600; color: ${GRAY}; }
.row s { color: #A49B92; text-decoration-thickness: 4px; }
`;
const brand = `<div class="brand">${bird("magpie", 48, true)}새 편지</div>`;
const count = (i: number) => `<div class="count">${i}/${N}</div>`;
const swipe = `<div class="swipe">넘겨 보세요 →</div>`;
const pic = (f: string, pos = "top") => `<div class="pic"><img src="${shot(f)}" style="object-position:${pos}"></div>`;
const txt = (eye: string, h1: string, body: string) => `<div class="txt"><div class="eye">${eye}</div><h1>${h1}</h1><p class="body">${body}</p></div>`;

// 공통 3장(3·4·5장)
const SHARED: Record<string, string> = {
  how: `${count(3)}${pic("ios-4-map.png", "center 28%")}
    ${txt("이렇게 써요", `쓰고, 새를 고르면<br><em>같이 기다려요</em>`, "① 편지를 쓰고 까치·비둘기·매 중 하나를 골라요<br>② 받는 사람도 같은 지도에서 날아오는 걸 봐요<br>③ 도착하면 두루마리로 펼쳐 읽어요")}${swipe}${brand}`,
  easy: `${count(4)}<div style="position:absolute;left:64px;right:64px;top:90px">
     <div class="row"><b>① 앱스토어에서 ‘새 편지’</b><span>받기 · 안드로이드 곧</span></div>
     <div class="row" style="background:#FEE500;color:#191919"><b>② 카카오로 가입하기</b><span>버튼 한 번</span></div>
     <div class="row"><s>아이디 · 비밀번호 만들기</s><span>없어요</span></div>
     <div class="row" style="background:#FFF1EA;border:3px solid ${DAHONG}"><b style="color:${DAHONG}">③ 첫 편지 날리기</b><span style="color:${DAHONG}">끝!</span></div></div>
    ${txt("시작이 쉬워요", `받고, 버튼 <em>한 번</em>이면<br>바로 시작`, "카카오·구글·애플 중 아무거나 한 번 누르면 가입 끝.<br>친구 초대도 <b>카톡 한 번</b>이면 저절로 친구가 돼요.")}${swipe}${brand}`,
  cta: `<div style="position:absolute;inset:0;background:${INK}"></div>
   <div style="position:absolute;left:72px;right:72px;top:150px;color:#fff;text-align:center">
     <div style="display:flex;justify-content:center">${bird("magpie", 260, true)}</div>
     <h1 style="font-size:84px;margin-top:40px">오늘 생각나는 사람에게<br><span style="color:#F0BC5C">첫 편지</span>를 날려 보세요</h1>
     <div style="margin:60px auto 0;display:inline-flex;align-items:center;gap:18px;background:#fff;color:${INK};padding:28px 44px;border-radius:30px;font-size:44px;font-weight:900">앱스토어에서 ‘새 편지’ · 무료</div>
     <div style="margin-top:22px;font-size:34px;font-weight:700;opacity:.9">안드로이드는 곧 출시돼요</div>
     <div style="font-size:34px;color:#F0BC5C;margin-top:70px;font-weight:700">${SLOGAN}</div></div>
   <div style="position:absolute;right:52px;top:52px;padding:10px 22px;border-radius:999px;background:rgba(255,255,255,.18);color:#fff;font-size:28px;font-weight:700">${N}/${N}</div>`,
};

// 2장: 그 글의 이야기(첫 줄 다음 문장들) + 실제 앱 화면
const SHOTS: [string, string][] = [["ios-1-list.png", "top"], ["ios-2-room.png", "top"], ["ios-3-birds.png", "center 55%"], ["ios-5-welcome.png", "center 45%"]];
function storyOf(text: string) {
  const lines = text.split("\n").map((l) => l.trim());
  const body = lines.slice(1).filter((l) => l && !l.includes("{{받기}}") && !l.startsWith("#") && !l.includes(SLOGAN));
  return { h1: body[0] ?? lines[0], rest: body.slice(1, 4) };
}

const schedPath = resolve(root, "promo/schedule.json");
const sched = JSON.parse(readFileSync(schedPath, "utf8"));
const outDir = resolve(root, "promo/cards/story");
mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await (await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 })).newPage();
async function render(name: string, html: string) {
  await page.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${html}</body></html>`);
  await page.evaluate(async () => { await document.fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
  const png = resolve(outDir, `${name}.png`);
  await page.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
}
for (const [k, html] of Object.entries(SHARED)) await render(k, html);

let n = 0;
for (const [i, p] of sched.posts.entries()) {
  // 영상·이미 여러 장인 글·0일째(이미 올라감)는 그대로
  if (!p.image || p.video || p.carousel || (typeof p.day === "number" && p.day < 1)) continue;
  const base = `d${p.day ?? "x"}-${p.slot ?? "am"}-${p.image.replace(/\.png$/, "")}`; // 같은 그림을 여러 날 써도 이야기 장은 글마다 따로
  const { h1, rest } = storyOf(p.text);
  const [f, pos] = SHOTS[i % SHOTS.length];
  await render(`${base}-2`, `${count(2)}${pic(f, pos)}${txt("새 편지 이야기", esc(h1), rest.map(esc).join("<br>"))}${swipe}${brand}`);
  p.carousel = [p.image, `story/${base}-2.png`, "story/how.png", "story/easy.png", "story/cta.png"];
  n++;
}
await browser.close();
writeFileSync(schedPath, JSON.stringify(sched, null, 2) + "\n");
console.log(`이야기 5장으로 바꾼 글 ${n}개`);
