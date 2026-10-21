/**
 * 홍보 영상(세로 15초, 릴스·틱톡·쇼츠 공용) 생성기: npx tsx promo/build-video.mts
 * 결과: promo/video/saepyeonji-15s.mp4 (1080×1920, 30fps, 소리 포함), 표지 promo/video/saepyeonji-15s-cover.png
 * 한 장면씩 그림을 정확한 시각으로 찍어서(프레임 450장) 이어 붙여요. AI 생성 크레딧이 필요 없어요.
 * 흐름: ① 고객의 문제(너무 빠른 답장) → ② 천천히 오는 소식 → ③ 지도 위를 날아가는 새 → ④ 두루마리 펼침 → ⑤ 앱 이름·받는 곳
 * 소리: 직접 만든 효과음(톡·푸드덕·짹짹·종이·종)과 잔잔한 화음. 올릴 때 앱에서 유행 음원을 덧입혀도 돼요.
 * 문구 규칙(promo/출시-홍보.md 1번): "실제 새 속도와 같다" 금지, 숫자는 앱 계산식 그대로.
 * 필요한 것: Playwright(+Chromium), ffmpeg
 */
import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync, rmSync } from "node:fs";
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
const { koreaMapSvg, routeCurve } = await import("./mapArt.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const W = 1080, H = 1920, FPS = 30, DUR = 15;
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const FONT = resolve(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const BUSAN = getRoute("seoul-busan").km;
const CRANE_MIN = Math.max(1, travelMinutes(getBird("crane"), BUSAN));
const MH = H + 340; // 지도를 아래로 내려 위쪽 제목과 안 겹치게(그림은 화면보다 길게 그려서 빈 곳이 없게)
const curve = routeCurve(W, MH, "seoul", "busan", 0.95);
const pts = Array.from({ length: 101 }, (_, i) => curve.at(i / 100));

const html = `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${css}
@font-face { font-family: P; src: url("file://${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: P, sans-serif; color: #2A2118; background: #FBF3E4; position: relative; }
svg { overflow: visible; display: block; }
.L { position: absolute; inset: 0; }
.cap { position: absolute; left: 70px; right: 70px; text-align: center; font-weight: 850; letter-spacing: -2px; line-height: 1.15; }
.bub { position: absolute; padding: 22px 36px; border-radius: 40px; font-size: 50px; font-weight: 800; background: #2C3B55; color: #FBF3E4; }
.bub.me { background: #E0A83C; color: #2A2118; }
.card { position: absolute; left: 70px; right: 70px; background: #fff; border-radius: 44px; padding: 34px 40px; box-shadow: 0 14px 0 rgba(42,33,24,.08); }
.bar { height: 20px; border-radius: 99px; background: rgba(42,33,24,.12); overflow: hidden; margin-top: 22px; }
.bar i { display: block; height: 100%; background: #E0A83C; }
.rod { position: absolute; left: 110px; width: 860px; height: 52px; border-radius: 26px; background: linear-gradient(#B07A4A,#7A4E2A 60%,#5B3A29); }
.paper { position: absolute; left: 140px; width: 800px; background: #FFFDF6; overflow: hidden; box-shadow: 0 16px 40px rgba(42,33,24,.18); }
.ln { font-size: 50px; line-height: 1.75; font-weight: 650; color: #3A2F25; padding: 0 70px; }
.pill { display: inline-flex; align-items: center; gap: 16px; background: #C1481F; color: #fff; border-radius: 999px; padding: 30px 54px; font-size: 52px; font-weight: 850; box-shadow: 0 12px 0 #8E3214; }
</style></head><body>
<div class="L" id="navy" style="background:#16243A"></div>
<div class="L" id="mapL"><div class="L" style="overflow:hidden">${koreaMapSvg({ w: W, h: MH, from: "seoul", to: "busan", zoom: 0.95 })}
  <svg class="L" width="${W}" height="${MH}"><path id="trail" d="${curve.d}" fill="none" stroke="#C1481F" stroke-width="12" stroke-linecap="round"/>
  <circle id="ripple" cx="${curve.b.x}" cy="${curve.b.y}" r="20" fill="none" stroke="#1B6E5C" stroke-width="8"/></svg>
  <div id="mbird" style="position:absolute;left:0;top:0;width:260px;height:210px">${bird("crane", 260, true)}</div></div>
  <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><span style="display:inline-block;background:#fff;border-radius:999px;padding:20px 48px;font-size:62px;font-weight:850;box-shadow:0 10px 0 rgba(42,33,24,.08)">엄마에게 보내는 편지 💌</span></div>
  <div class="card" style="top:1420px" id="cardC">
    <div style="display:flex;align-items:center;gap:22px"><div style="width:130px">${bird("crane", 130, true)}</div>
      <div><div style="font-size:50px;font-weight:850">두루미가 날아가는 중</div><div style="font-size:38px;opacity:.7;margin-top:4px">서울 → 부산 ${BUSAN}km · ${formatMinutes(CRANE_MIN)}</div></div></div>
    <div class="bar"><i id="barC"></i></div>
    <div style="display:flex;justify-content:space-between;margin-top:18px;font-size:40px;font-weight:800"><span id="whereC" style="color:#C1481F"></span><span id="leftC"></span></div>
  </div>
</div>
<div class="L" id="sceneA">
  <div class="cap" style="top:330px;font-size:104px;color:#FBF3E4">답장, 너무 빨라서<br><span style="color:#F0BC5C">설레지 않죠?</span></div>
  ${[["ㅇㅇ", 0], ["ㅋㅋㅋ", 1], ["읽음", 0], ["?", 1], ["왜 답 안 해", 0], ["ㅇㅋ", 1]].map(([t, me], i) => `<div class="bub ${me ? "me" : ""}" id="b${i}" style="${me ? "right:120px" : "left:120px"};top:${780 + i * 140}px">${t}</div>`).join("")}
</div>
<div class="L" id="sceneB">
  <div class="cap" style="top:440px;font-size:96px">가끔은<br>천천히 오는 소식이<br><span style="color:#C1481F">더 설레요</span></div>
  <div id="bbird" style="position:absolute;left:300px;top:1000px">${bird("magpie", 480, true)}</div>
</div>
<div class="L" id="sceneD">
  <div class="cap" style="top:220px;font-size:88px">도착하면<br><span style="color:#C1481F">두루마리처럼 펼쳐져요</span></div>
  <div class="rod" style="top:600px"></div>
  <div class="paper" id="paper" style="top:626px;height:0">
    <div style="height:60px"></div>
    <div class="ln" id="l0">엄마, 이번 주말에</div>
    <div class="ln" id="l1">내려갈게요.</div>
    <div class="ln" id="l2">된장찌개 해 주세요 🙂</div>
  </div>
  <div class="rod" id="rod2" style="top:600px"></div>
  <div id="pola" style="position:absolute;right:110px;top:1260px;width:330px;background:#fff;padding:20px 20px 80px;box-shadow:0 16px 34px rgba(42,33,24,.25);transform:rotate(6deg)">
    <div id="polaImg" style="height:290px;background:linear-gradient(#9CC7E0,#E9D7B5 70%,#C9A27A)"></div></div>
  <div id="dbird" style="position:absolute;left:120px;top:1300px;transform:rotate(-6deg)">${bird("crane", 300, true)}</div>
</div>
<div class="L" id="sceneE" style="background:#FBF3E4">
  <div style="position:absolute;left:0;right:0;top:0;height:26px;display:flex"><i style="flex:1;background:#C1481F"></i><i style="flex:1;background:#E0A83C"></i><i style="flex:1;background:#1B6E5C"></i><i style="flex:1;background:#1E3A5C"></i></div>
  <div id="ebird" style="position:absolute;left:250px;top:330px">${bird("magpie", 580, true)}</div>
  <div class="cap" style="top:860px;font-size:150px;letter-spacing:-4px">새 편지</div>
  <div class="cap" style="top:1060px;font-size:60px;font-weight:700;color:#C1481F">기다림이 즐거운 편지</div>
  <div style="position:absolute;left:0;right:0;top:1250px;text-align:center"><span class="pill" id="pill">구글 플레이에서 ‘새 편지’ · 무료</span>
    <div style="font-size:40px;font-weight:600;opacity:.65;margin-top:34px">아이폰 앱은 곧 날아가요</div></div>
</div>
<script>
const PTS = ${JSON.stringify(pts.map((p) => [Math.round(p.x), Math.round(p.y), Math.round(p.angle)]))};
const TOTAL = ${CRANE_MIN};
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const k = (t, a, b) => clamp((t - a) / (b - a));           // a~b 사이 진행(0~1)
const ease = (x) => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const show = (el, o) => { el.style.opacity = o; el.style.visibility = o <= 0.001 ? "hidden" : "visible"; };
const trail = $("trail"), LEN = trail.getTotalLength(); trail.style.strokeDasharray = LEN;
const fmt = (m) => { m = Math.max(0, Math.round(m)); const d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60; return (d ? d + "일 " : "") + (h || d ? h + "시간 " : "") + mm + "분"; };
window.render = (t) => {
  // ① 0~2.6초: 너무 빠른 답장
  show($("navy"), 1 - k(t, 2.4, 2.9));
  show($("sceneA"), 1 - k(t, 2.4, 2.8));
  for (let i = 0; i < 6; i++) { const s = back(k(t, 0.15 + i * 0.25, 0.35 + i * 0.25)); const el = $("b" + i); el.style.transform = "scale(" + s + ")"; el.style.opacity = k(t, 0.15 + i * 0.25, 0.2 + i * 0.25); }
  // ② 2.6~4.4초: 천천히 오는 소식
  const bIn = k(t, 2.6, 3.0), bOut = k(t, 4.1, 4.5);
  show($("sceneB"), bIn * (1 - bOut));
  $("bbird").style.transform = "translate(" + (1 - ease(k(t, 2.7, 3.6))) * 700 + "px," + Math.sin(t * 6) * 14 + "px)";
  // ③ 4.4~9.2초: 지도 위를 날아가는 두루미(시간을 빨리 감아서)
  const mIn = k(t, 4.2, 4.6), mOut = k(t, 9.0, 9.4);
  show($("mapL"), mIn * (1 - mOut));
  const p = ease(k(t, 4.6, 8.6));
  const q = PTS[Math.round(p * 100)];
  $("mbird").style.transform = "translate(" + (q[0] - 130) + "px," + (q[1] - 150 + Math.sin(t * 9) * 10) + "px) rotate(" + (q[2] > 90 || q[2] < -90 ? 0 : q[2] * 0.25) + "deg)";
  trail.style.strokeDashoffset = LEN * (1 - p);
  $("barC").style.width = (p * 100).toFixed(1) + "%";
  $("whereC").textContent = p >= 1 ? "도착했어요! 💌" : p > 0.82 ? "곧 도착해요" : p > 0.42 ? "대전을 지났어요" : "출발했어요";
  $("leftC").textContent = p >= 1 ? "" : "남은 시간 " + fmt(TOTAL * (1 - p));
  const r = k(t, 8.6, 9.2); const rp = $("ripple"); rp.setAttribute("r", 20 + r * 90); rp.style.opacity = r > 0 ? 1 - r : 0;
  // ④ 9.2~12.4초: 두루마리 펼침 + 폴라로이드가 선명해짐
  const dIn = k(t, 9.1, 9.5), dOut = k(t, 12.3, 12.7);
  show($("sceneD"), dIn * (1 - dOut));
  const open = ease(k(t, 9.5, 10.6)), PH = 440;
  $("paper").style.height = open * PH + "px"; $("rod2").style.top = 600 + open * PH + "px";
  for (let i = 0; i < 3; i++) $("l" + i).style.opacity = k(t, 10.5 + i * 0.35, 10.9 + i * 0.35);
  const pl = k(t, 11.1, 12.2); $("pola").style.opacity = k(t, 11.0, 11.3); $("polaImg").style.filter = "blur(" + (1 - pl) * 18 + "px) brightness(" + (1.6 - pl * 0.6) + ")";
  $("dbird").style.transform = "rotate(-6deg) translateY(" + Math.sin(t * 5) * 10 + "px)";
  // ⑤ 12.4~15초: 앱 이름·받는 곳
  show($("sceneE"), k(t, 12.4, 12.8));
  $("ebird").style.transform = "translateY(" + Math.sin(t * 4) * 16 + "px) scale(" + back(k(t, 12.4, 13.0)) + ")";
  $("pill").style.transform = "scale(" + (1 + Math.max(0, Math.sin((t - 13.4) * 5)) * 0.04 * (t > 13.4 ? 1 : 0)) + ")";
};
window.render(0);
</script></body></html>`;

// 소리: 직접 만든 효과음(44.1kHz 모노 WAV)
function makeAudio(path: string) {
  const SR = 44100, N = SR * DUR, a = new Float32Array(N);
  const add = (t0: number, len: number, f: (x: number, i: number) => number) => { const s = Math.floor(t0 * SR); for (let i = 0; i < len * SR && s + i < N; i++) a[s + i] += f(i / SR, i); };
  let seed = 7; const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  // 잔잔한 화음(②부터 크게)
  for (let i = 0; i < N; i++) { const t = i / SR; const v = (t < 2.6 ? 0.25 : 1) * Math.min(1, t / 0.6) * Math.min(1, (DUR - t) / 1.2);
    a[i] += 0.045 * v * (Math.sin(2 * Math.PI * 220 * t) + 0.8 * Math.sin(2 * Math.PI * 277.2 * t) + 0.6 * Math.sin(2 * Math.PI * 329.6 * t)) * (0.85 + 0.15 * Math.sin(2 * Math.PI * 0.5 * t)); }
  // ① 말풍선 톡
  for (let i = 0; i < 6; i++) add(0.15 + i * 0.25, 0.08, (x) => 0.35 * Math.sin(2 * Math.PI * (700 + i * 60) * x) * Math.exp(-x * 50));
  // ②로 넘어갈 때 휙
  add(2.5, 0.5, (x) => 0.18 * noise() * Math.sin(Math.PI * x / 0.5));
  // ③ 푸드덕(날갯짓 4번) + 짹짹짹
  for (let i = 0; i < 4; i++) add(4.5 + i * 0.13, 0.08, (x) => 0.35 * noise() * Math.exp(-x * 40));
  for (let i = 0; i < 3; i++) add(5.1 + i * 0.16, 0.09, (x) => 0.22 * Math.sin(2 * Math.PI * (2600 + 16000 * x) * x) * Math.sin(Math.PI * x / 0.09));
  add(8.6, 0.09, (x) => 0.22 * Math.sin(2 * Math.PI * (2800 + 14000 * x) * x) * Math.sin(Math.PI * x / 0.09));
  // ④ 종이 펼치는 소리
  add(9.5, 1.1, (x) => 0.12 * noise() * (0.5 + 0.5 * Math.sin(x * 60)) * Math.sin(Math.PI * x / 1.1));
  // ⑤ 종소리
  add(12.45, 2.4, (x) => 0.28 * (Math.sin(2 * Math.PI * 880 * x) + 0.5 * Math.sin(2 * Math.PI * 1320 * x)) * Math.exp(-x * 2.2));
  const buf = Buffer.alloc(44 + N * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32000), 44 + i * 2);
  writeFileSync(path, buf);
}

const out = resolve(root, "promo/video"), tmp = resolve(root, "promo/video/.frames");
rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
writeFileSync(resolve(tmp, "index.html"), html, "utf8");
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
await page.goto("file://" + resolve(tmp, "index.html"));
await page.evaluate(() => document.fonts.ready);
for (let f = 0; f < FPS * DUR; f++) {
  await page.evaluate((t) => (window as any).render(t), f / FPS);
  await page.screenshot({ path: resolve(tmp, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
  if (f % 60 === 0) console.log(`${(f / FPS).toFixed(0)}초`);
}
await page.evaluate((t) => (window as any).render(t), 14.2);
await page.screenshot({ path: resolve(out, "saepyeonji-15s-cover.png") });
await browser.close();
makeAudio(resolve(tmp, "audio.wav"));
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", resolve(tmp, "f%04d.jpg"), "-i", resolve(tmp, "audio.wav"),
  "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest",
  resolve(out, "saepyeonji-15s.mp4")]);
rmSync(tmp, { recursive: true, force: true });
console.log("promo/video/saepyeonji-15s.mp4");
