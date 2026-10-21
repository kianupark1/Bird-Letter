/**
 * 8차 시안: "날아가는 지도 사진으로 공유하기"(인스타 스토리·카카오톡 프로필용 세로 사진): npx tsx docs/시안/build-v8.mts
 * 결과: docs/시안/images/v8-1-날아가는중.png, v8-2-도착.png, v8-3-버튼위치.png
 * 앱에 붙이기 전 대표님 확인용. 그림 속 이름·시간은 예시(시간은 앱 계산식 그대로).
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: BirdIcon } = await import("../../src/components/BirdIcon.tsx");
const { getBird } = await import("../../core/birds.ts");
const { travelMinutes, formatMinutes } = await import("../../core/geo.ts");
const { getRoute } = await import("../../core/routes.ts");
const { koreaMapSvg, routeCurve } = await import("../../promo/mapArt.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "../..");
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const FONT = resolve(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const W = 1080, H = 1920, MH = H + 340, Z = 0.95;
const BUSAN = getRoute("seoul-busan").km;
const total = Math.max(1, travelMinutes(getBird("crane"), BUSAN));
const shot = (f: string) => "data:image/png;base64," + readFileSync(resolve(root, "promo/store", f)).toString("base64");

const BASE = `${css}
@font-face { font-family: P; src: url("file://${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: P, sans-serif; color: #2A2118; background: #FBF3E4; position: relative; } svg { overflow: visible; display: block; }
.card { position: absolute; left: 70px; right: 70px; background: #fff; border-radius: 44px; padding: 36px 42px; box-shadow: 0 14px 0 rgba(42,33,24,.08); }
.pill { display: inline-block; background: #fff; border-radius: 999px; padding: 22px 50px; font-size: 60px; font-weight: 850; box-shadow: 0 10px 0 rgba(42,33,24,.08); }
.foot { position: absolute; left: 0; right: 0; bottom: 70px; text-align: center; font-size: 34px; font-weight: 800; color: #2A2118; }
.foot small { display: block; font-size: 26px; font-weight: 600; opacity: .7; margin-top: 6px; }
`;

function mapWithBird(p: number) {
  const c = routeCurve(W, MH, "seoul", "busan", Z);
  const q = c.at(p);
  return `<div style="position:absolute;inset:0;overflow:hidden">${koreaMapSvg({ w: W, h: MH, from: "seoul", to: "busan", zoom: Z })}
    <svg width="${W}" height="${MH}" style="position:absolute;inset:0"><path d="${c.d}" fill="none" stroke="#C1481F" stroke-width="12" stroke-linecap="round" pathLength="100" stroke-dasharray="${p * 100} 100"/></svg>
    <div style="position:absolute;left:${q.x - 130}px;top:${q.y - 150}px">${bird("crane", 260, true)}</div></div>`;
}

const pages: { file: string; html: string }[] = [
  { file: "v8-1-날아가는중", html: `${mapWithBird(0.45)}
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><span class="pill">엄마에게 가는 편지 💌</span></div>
    <div class="card" style="top:1330px">
      <div style="font-size:54px;font-weight:850;line-height:1.25">지금 <span style="color:#C1481F">대전</span>을 지나는 중 🕊</div>
      <div style="font-size:38px;opacity:.75;margin-top:10px">서울 → 부산 ${BUSAN}km · 두루미</div>
      <div style="height:20px;border-radius:99px;background:rgba(42,33,24,.12);margin-top:24px;overflow:hidden"><div style="width:45%;height:100%;background:#E0A83C"></div></div>
      <div style="font-size:40px;font-weight:800;margin-top:18px">도착까지 ${formatMinutes(Math.round(total * 0.55))}</div>
    </div>
    <div class="foot">새 편지<small>기다림이 즐거운 편지</small></div>` },
  { file: "v8-2-도착", html: `${mapWithBird(1)}
    <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><span class="pill">엄마에게 편지가 도착했어요 💌</span></div>
    <div class="card" style="top:1330px;text-align:center">
      <div style="font-size:54px;font-weight:850">${BUSAN}km를 날아왔어요</div>
      <div style="font-size:38px;opacity:.75;margin-top:12px">두루미 · ${formatMinutes(total)} 걸렸어요</div>
    </div>
    <div class="foot">새 편지<small>기다림이 즐거운 편지</small></div>` },
  // 앱 안 버튼 위치: 대화방 위 지도 오른쪽 위에 작은 [공유] 하나만(화면은 단순하게)
  { file: "v8-3-버튼위치", html: `<div style="position:absolute;left:50%;top:120px;transform:translateX(-50%);width:760px;height:1352px;border-radius:90px;background:#1A1613;padding:22px">
      <div style="width:100%;height:100%;border-radius:70px;overflow:hidden;position:relative"><img src="${shot("phone-2-room.png")}" style="width:100%;display:block">
        <div style="position:absolute;right:42px;top:282px;background:#C1481F;color:#fff;border-radius:999px;padding:12px 24px;font-size:28px;font-weight:850;box-shadow:0 0 0 8px rgba(193,72,31,.25)">📸 공유</div></div></div>
    <div style="position:absolute;left:70px;right:70px;top:1530px;font-size:44px;font-weight:800;text-align:center;line-height:1.45">지도 오른쪽 위 <span style="color:#C1481F">[📸 공유]</span> 하나만 추가<br><span style="font-size:34px;font-weight:600;opacity:.75">누르면 위 사진이 만들어지고, 인스타·카카오톡으로 바로 보내요<br>편지 내용은 사진에 들어가지 않아요</span></div>` },
];

mkdirSync(resolve(root, "docs/시안/images"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const pg of pages) {
  const p = await (await browser.newContext({ viewport: { width: W, height: H } })).newPage();
  await p.setContent(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${pg.html}</body></html>`);
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: resolve(root, `docs/시안/images/${pg.file}.png`) });
  console.log(pg.file);
}
await browser.close();
