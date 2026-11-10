/**
 * 앱 홍보 카드(2026-11-10 대표님: "더 어플리케이션 홍보 느낌 나게, 아무도 안 봄"): npx tsx promo/build-app.mts [이름 일부]
 * 감성 카드 대신 "무슨 앱인지·뭐가 다른지·앱스토어 무료"가 첫눈에 보이게: 큰 제목 + 실제 앱 화면 + 앱스토어 단추 + 슬로건.
 * 결과: promo/cards/app-*.png·.jpg (원본 HTML은 promo/cards-src)
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
const mins = (id: string, r: string) => formatMinutes(travelMinutes(getBird(id), getRoute(r).km));
const shot = (f: string) => "file://" + resolve(root, "promo/store", f);
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");

const DAHONG = "#C1481F", INK = "#2A2118", HANJI = "#FBF3E4", NAVY = "#1E3A5C", HWANGTO = "#E0A83C";
const BASE = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 100%; height: 100%; }
body { font-family: P, sans-serif; color: ${INK}; position: relative; overflow: hidden; background: ${HANJI}; letter-spacing: -0.5px; }
svg { overflow: visible; display: block; }
body.hot { background: linear-gradient(160deg, #D4572A 0%, ${DAHONG} 55%, #A63A16 100%); color: #fff; }
.tag { display: inline-flex; align-items: center; gap: 12px; padding: 12px 24px; border-radius: 999px; font-size: 30px; font-weight: 700; background: rgba(193,72,31,.1); color: ${DAHONG}; }
.hot .tag { background: rgba(255,255,255,.18); color: #fff; }
h1 { font-size: 92px; font-weight: 900; line-height: 1.16; letter-spacing: -3px; margin-top: 26px; word-break: keep-all; }
h1 em { font-style: normal; color: ${DAHONG}; }
.hot h1 em { color: #FFE08A; }
.sub { font-size: 38px; font-weight: 500; line-height: 1.5; margin-top: 22px; opacity: .82; word-break: keep-all; }
.top { position: absolute; left: 76px; right: 76px; top: 80px; }
.bar { position: absolute; left: 0; right: 0; bottom: 0; height: 150px; display: flex; align-items: center; justify-content: space-between; padding: 0 64px; background: ${INK}; color: #fff; }
.store { display: flex; align-items: center; gap: 16px; font-size: 36px; font-weight: 800; }
.store i { font-style: normal; display: grid; place-items: center; width: 68px; height: 68px; border-radius: 18px; background: #fff; }
.store small { display: block; font-size: 24px; font-weight: 500; opacity: .7; }
.slogan { font-size: 27px; font-weight: 600; color: ${HWANGTO}; }
.phone { position: absolute; border-radius: 64px; background: #16110E; padding: 18px; box-shadow: 0 40px 80px rgba(40,20,5,.38); }
.phone > div { width: 100%; height: 100%; border-radius: 48px; overflow: hidden; background: ${HANJI}; }
.phone img { width: 100%; height: 100%; object-fit: cover; }
.chip { position: absolute; padding: 18px 26px; border-radius: 26px; background: #fff; color: ${INK}; font-size: 34px; font-weight: 800; box-shadow: 0 14px 30px rgba(40,20,5,.22); }
`;
const BAR = `<div class="bar"><div class="store"><i>${bird("magpie", 54, true)}</i><span>앱스토어 ‘새 편지’<small>무료 · 안드로이드는 곧</small></span></div><div class="slogan">${SLOGAN}</div></div>`;
const phone = (f: string, x: number, y: number, w: number, h: number, rot = 0, pos = "top") =>
  `<div class="phone" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;transform:rotate(${rot}deg)"><div><img src="${shot(f)}" style="object-position:${pos}"></div></div>`;
const top = (tag: string, h1: string, sub = "") => `<div class="top"><span class="tag">${tag}</span><h1>${h1}</h1>${sub ? `<p class="sub">${sub}</p>` : ""}</div>`;
const chip = (t: string, x: number, y: number, rot = 0) => `<div class="chip" style="left:${x}px;top:${y}px;transform:rotate(${rot}deg)">${t}</div>`;

const cards: { file: string; hot?: boolean; html: string }[] = [
  { file: "app-01-what", hot: true, html: `${top("🕊 새로 나온 메신저 앱", `진짜 <em>새가<br>배달하는</em><br>메신저`, "편지를 쓰면 새가 진짜 거리만큼 날아가요")}
    ${phone("ios-1-list.png", 290, 600, 500, 900, -4)}${chip("📍 서울 → 부산 · 매 " + mins("hawk", "seoul-busan"), 560, 660, 4)}${BAR}` },
  { file: "app-02-live", html: `${top("실시간 위치", `내 편지, 지금<br><em>대전 하늘</em>을 나는 중`, "보내는 사람도 받는 사람도 지도로 같이 기다려요")}
    ${phone("ios-4-map.png", 290, 480, 500, 940, 3, "center 30%")}${chip("⏱ 도착까지 3:59:57", 70, 640, -5)}${BAR}` },
  { file: "app-03-birds", hot: true, html: `${top("새 3종", `어떤 새로<br><em>보낼까요?</em>`, "빠른 매, 든든한 비둘기, 느긋한 까치")}
    <div style="position:absolute;left:70px;right:70px;top:640px;display:flex;gap:26px">
      ${[["hawk", "매"], ["pigeon", "비둘기"], ["magpie", "까치"]].map(([id, n]) => `<div style="flex:1;background:#fff;color:${INK};border-radius:40px;padding:34px 10px 30px;text-align:center;box-shadow:0 18px 36px rgba(40,20,5,.25)">
        <div style="display:grid;place-items:center;height:210px">${bird(id, 200, true)}</div><div style="font-size:48px;font-weight:900;margin-top:10px">${n}</div>
        <div style="font-size:30px;font-weight:700;color:${DAHONG};margin-top:8px">${mins(id, "seoul-busan")}</div></div>`).join("")}</div>
    <div style="position:absolute;left:0;right:0;top:1040px;text-align:center;font-size:32px;font-weight:600;opacity:.85">서울 → 부산 기준 · 실제 새의 비행 속도를 바탕으로</div>${BAR}` },
  { file: "app-04-open", html: `${top("도착하면", `편지가 <em>두루마리</em>처럼<br>펼쳐져요 📜`, "사진은 폴라로이드로, 폰에 저장도 돼요")}
    ${phone("ios-2-room.png", 290, 480, 500, 940, -3, "center 62%")}${BAR}` },
  { file: "app-05-noread", hot: true, html: `${top("읽씹 걱정 끝", `답장이 <em>천천히</em> 와도<br>괜찮은 메신저`, "카톡으로 꺼내기 어려운 말, 새가 천천히 전해 줘요")}
    ${phone("ios-2-room.png", 290, 600, 500, 900, 4, "center 70%")}${chip("💬 보고 싶어요", 70, 700, -6)}${chip("🕊 3시간 뒤 도착", 650, 900, 5)}${BAR}` },
  { file: "app-06-kakao", html: `${top("시작은 1초", `<em>카카오</em>로 가입,<br>카톡으로 초대`, "아이디·비밀번호 없이, 링크 누른 친구는 저절로 친구")}
    <div style="position:absolute;left:120px;right:120px;top:700px;display:flex;flex-direction:column;gap:30px">
      ${[["#FEE500", "#191600", "💬 카카오로 가입하기"], ["#fff", "#1F1F1F", "G  구글로 가입하기"], ["#111", "#fff", "  애플로 가입하기"]].map(([bg, fg, t]) => `<div style="height:130px;border-radius:34px;background:${bg};color:${fg};display:flex;align-items:center;justify-content:center;font-size:46px;font-weight:800;box-shadow:0 12px 26px rgba(40,20,5,.18);border:2px solid rgba(0,0,0,.06)">${t}</div>`).join("")}</div>${BAR}` },
  { file: "app-07-penpal", hot: true, html: `${top("🌏 펜팔", `모르는 누군가에게<br><em>편지 날려 보내기</em>`, "이름 대신 펜팔 이름, 위치는 도시까지만 · 만 14세 이상")}
    ${phone("ios-4-map.png", 290, 600, 500, 900, -3, "center 45%")}${chip("✉ 부산 사는 비둘기님에게", 470, 680, 4)}${BAR}` },
  { file: "app-08-free", html: `${top("지금 무료", `느려서 더 반가운<br><em>새 편지</em>`, "앱스토어에서 ‘새 편지’를 검색해 보세요 · 안드로이드는 곧")}
    ${phone("ios-1-list.png", 60, 560, 390, 780, -8)}${phone("ios-4-map.png", 630, 560, 390, 780, 8, "center 30%")}${phone("ios-2-room.png", 345, 500, 390, 820, 0, "center 55%")}${BAR}` },
];

const only = process.argv[2];
mkdirSync(resolve(root, "promo/cards-src"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const c of cards.filter((c) => !only || c.file.includes(only))) {
  const htmlPath = resolve(root, `promo/cards-src/${c.file}.html`);
  writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body class="${c.hot ? "hot" : ""}">${c.html}</body></html>`, "utf8");
  const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
  const p = await ctx.newPage();
  await p.goto("file://" + htmlPath);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(root, `promo/cards/${c.file}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]); // 인스타는 JPG만
  await ctx.close();
  console.log(c.file);
}
await browser.close();
