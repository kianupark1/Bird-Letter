/**
 * 웃긴 사연 릴스 "헤어진 철수 씨" (세로 9:16, 약 24초): npx tsx promo/build-reel-chulsu.mts
 * 2026-11-15 대표님: "광고를 더 기발하게 영상으로, 웃긴 사연. 헤어진 철수 씨가 새편지로 진심을 전하고 수미 씨와 다시 만나게 된 사연, 웃기고 공감 가게"
 * 연출된 이야기라는 표시를 화면에 늘 둠(실제 후기처럼 보이지 않게). 시간은 앱 계산(참새 서울→부산 약 11시간 36분, 매 약 3시간 37분).
 * 프레임마다 window.at(t)로 화면을 정확히 그린 뒤 찍어서 이어 붙임(AI 크레딧 불필요).
 * 결과: promo/video/reel-chulsu.mp4·-cover.png, 넘겨 보기용 4:5 사본 promo/video/card/reel-chulsu.mp4
 */
import { createRequire } from "node:module";
import { mkdirSync, rmSync, existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: CuteBird } = await import("../src/components/CuteBird.tsx");
const { SLOGAN } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const f = (p: string) => "file://" + resolve(root, p);
const bird = (id: string, s: number) => renderToStaticMarkup(React.createElement(CuteBird as any, { id, variant: "C", size: s, letter: true }));
const FPS = 30, T = 28;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: P; src: url(${f("src/app/fonts/PretendardSub.woff2")}); font-weight: 100 900; }
@font-face { font-family: H; src: url(${f("public/fonts/SaePyeonjiHand.woff2")}); }
* { box-sizing: border-box; margin: 0; }
html, body { width: 1080px; height: 1920px; overflow: hidden; }
body { font-family: P, sans-serif; background: #FBF3E4; color: #16110E; letter-spacing: -1.5px; word-break: keep-all; }
.sc { position: absolute; inset: 0; opacity: 0; }
.cap { position: absolute; left: 60px; right: 60px; text-align: center; font-weight: 900; font-size: 82px; line-height: 1.15; letter-spacing: -4px; }
.sub { position: absolute; left: 60px; right: 60px; text-align: center; font-weight: 700; font-size: 44px; line-height: 1.3; }
.fic { position: absolute; left: 0; right: 0; top: 70px; text-align: center; font-size: 30px; font-weight: 700; color: rgba(22,17,14,.55); letter-spacing: 0; z-index: 9; }
.fic.l { color: rgba(255,255,255,.7); }
.chat { position: absolute; left: 90px; right: 90px; top: 520px; height: 900px; background: #B2C7D9; border-radius: 48px; padding: 50px 40px; overflow: hidden; box-shadow: 0 30px 60px rgba(0,0,0,.18); }
.bub { display: block; max-width: 560px; margin: 0 0 26px auto; background: #FEE500; border-radius: 34px; padding: 22px 34px; font-size: 52px; font-weight: 700; position: relative; width: fit-content; }
.bub i { position: absolute; left: -54px; bottom: 6px; font-style: normal; font-size: 30px; color: #E8B100; font-weight: 900; }
.who { font-size: 34px; font-weight: 800; color: #3a4a5c; margin-bottom: 30px; }
.face { position: absolute; font-size: 300px; left: 50%; transform: translateX(-50%); line-height: 1; }
.card { position: absolute; left: 90px; right: 90px; background: #fff; border-radius: 44px; padding: 44px; box-shadow: 0 30px 60px rgba(0,0,0,.14); }
.pill { display: inline-block; background: #E2512A; color: #fff; border-radius: 99px; padding: 12px 28px; font-size: 38px; font-weight: 800; }
.big { font-size: 150px; font-weight: 900; letter-spacing: -6px; color: #E2512A; font-variant-numeric: tabular-nums; }
.list div { font-size: 58px; font-weight: 800; margin: 26px 0; opacity: 0; }
.scroll { position: absolute; left: 110px; right: 110px; background: #FFF8EC; border: 3px solid #E0A83C; border-radius: 24px; padding: 50px 54px; font-family: H, P; font-size: 66px; line-height: 1.35; overflow: hidden; letter-spacing: 0; box-shadow: 0 20px 50px rgba(0,0,0,.12); }
.tag { position: absolute; left: 0; right: 0; bottom: 110px; display: flex; justify-content: center; align-items: center; gap: 22px; font-size: 52px; font-weight: 900; }
.tag img { width: 120px; height: 120px; border-radius: 28px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
</style></head><body>
<div class="fic" id="fic">이 이야기는 연출된 가상의 이야기입니다</div>

<!-- 1. 훅 -->
<div class="sc" id="s1" style="background:#16110E;color:#fff">
  <div class="cap" style="top:420px;font-size:72px;color:#F0BC5C">헤어진 지 37일째</div>
  <div class="cap" style="top:540px;font-size:120px">철수 씨의<br>새벽 2시</div>
  <div class="face" style="top:1060px">🥲</div>
</div>

<!-- 2. 카톡 자니? -->
<div class="sc" id="s2">
  <div class="cap" style="top:200px">카톡은 1초.</div>
  <div class="sub" style="top:330px">(그래서 더 빨리 망함)</div>
  <div class="chat"><div class="who">수미 ♡ → 수미</div>
    <span class="bub" id="b1"><i>1</i>자니?</span>
    <span class="bub" id="b2"><i>1</i>자니??</span>
    <span class="bub" id="b3"><i>1</i>밥은 먹고 자니???</span>
    <span class="bub" id="b4" style="background:#fff"><i></i>…(읽음)</span>
  </div>
  <div class="cap" id="ssip" style="top:1480px;color:#E2512A;font-size:110px;transform:rotate(-6deg)">읽씹 😇</div>
</div>

<!-- 3. 친구의 한마디 -->
<div class="sc" id="s3" style="background:#1E3A5C;color:#fff">
  <div class="face" style="top:330px;font-size:240px">🧑‍🦱</div>
  <div class="cap" style="top:720px;font-size:76px">"야, 요즘 누가<br>새벽에 카톡을 해"</div>
  <div class="cap" style="top:1020px;font-size:96px;color:#F0BC5C">"진심은<br>편지로 써."</div>
</div>

<!-- 4. 새편지로 참새 -->
<div class="sc" id="s4">
  <div class="cap" style="top:200px">그래서 철수는<br>새편지를 열었다</div>
  <div class="card" style="top:560px">
    <div style="font-size:40px;font-weight:800;color:#888">받는 사람</div>
    <div style="font-size:64px;font-weight:900;margin:10px 0 30px">수미 · 부산</div>
    <div style="display:flex;align-items:center;gap:30px">
      <div style="transform:scaleX(-1)">${bird("sparrow", 220)}</div>
      <div><div style="font-size:60px;font-weight:900">참새</div><div class="pill">제일 느린 새</div></div>
    </div>
  </div>
  <div class="sub" style="top:1260px">"진심은 천천히 가야 한대서…"</div>
  <div class="cap" style="top:1420px;color:#E2512A">도착까지<br>11시간 36분</div>
</div>

<!-- 5. 기다리는 11시간 -->
<div class="sc" id="s5">
  <div class="cap" style="top:190px">참새가 나는 동안<br>철수가 한 일</div>
  <div class="big" id="cd" style="position:absolute;left:0;right:0;top:470px;text-align:center">11:36:00</div>
  <div id="fly" style="position:absolute;top:690px;left:0">${bird("sparrow", 200)}</div>
  <div class="list" style="position:absolute;left:120px;right:80px;top:960px">
    <div id="l1">🚿 샤워 3번</div>
    <div id="l2">🪞 사과 연습 40번</div>
    <div id="l3">📱 지도 새로고침 1,204번</div>
    <div id="l4">🐦 참새 응원 "힘내…!"</div>
  </div>
</div>

<!-- 6. 수미 도착 -->
<div class="sc" id="s6" style="background:#FFF1E6">
  <div class="card" id="noti" style="top:260px;padding:36px 40px;display:flex;gap:28px;align-items:center">
    <div style="font-size:90px">💌</div>
    <div><div style="font-size:44px;font-weight:900">철수 님의 편지가 도착했어요</div><div style="font-size:36px;color:#888;font-weight:600">참새가 11시간 36분 날아왔어요</div></div>
  </div>
  <div class="cap" id="sumi1" style="top:560px;font-size:76px">수미: "…참새로?"</div>
  <div class="scroll" id="scr" style="top:760px;height:0">수미야.<br>새벽에 '자니?' 보낸 거<br>진짜 미안해.<br>참새가 밤새 날아갈 만큼<br>천천히, 진심으로 말할게.<br>보고 싶어.</div>
</div>

<!-- 7. 답장은 매로 -->
<div class="sc" id="s7" style="background:#E2512A;color:#fff">
  <div class="cap" style="top:300px;font-size:70px">다음 날 아침, 철수에게</div>
  <div class="card" style="top:470px;color:#16110E;display:flex;gap:26px;align-items:center">
    <div>${bird("hawk", 200)}</div>
    <div><div style="font-size:50px;font-weight:900">수미 님이 답장했어요</div><div style="font-size:40px;font-weight:700;color:#E2512A">매로 · 3시간 37분 뒤 도착</div></div>
  </div>
  <div class="cap" style="top:900px;font-size:88px">"할 말 많아.<br>빨리 와."</div>
  <div class="face" id="jump" style="top:1290px;font-size:260px">🥹</div>
</div>

<!-- 8. 끝 -->
<div class="sc" id="s8">
  <div class="cap" style="top:330px">카톡은 1초,<br><span style="color:#E2512A">진심은 11시간.</span></div>
  <div style="position:absolute;left:0;right:0;top:760px;display:flex;justify-content:center">${bird("sparrow", 380)}</div>
  <div class="sub" style="top:1260px;font-size:52px;font-weight:900">${SLOGAN}</div>
  <div class="sub" style="top:1360px;font-size:40px;color:#666">앱스토어에서 ‘새 편지’ · 무료</div>
  <div class="tag"><img src="data:image/png;base64,${readFileSync(resolve(root, "promo/store/play-icon-512.png")).toString("base64")}">새 편지</div>
</div>

<script>
const S = [[0,2.4],[2.4,7.4],[7.4,10],[10,13.6],[13.6,17.6],[17.6,21],[21,24.2],[24.2,99]];
const $ = (id) => document.getElementById(id);
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
window.at = (t) => {
  S.forEach(([a, b], i) => {
    const el = $("s" + (i + 1));
    const o = Math.min(clamp((t - a) / 0.25), i === S.length - 1 ? 1 : clamp((b - t) / 0.2));
    el.style.opacity = o;
    el.style.transform = "translateY(" + (1 - ease((t - a) / 0.35)) * 60 + "px)";
  });
  $("fic").className = "fic" + ((t < 2.4 || (t >= 7.4 && t < 10) || (t >= 21 && t < 24.2)) ? " l" : "");
  // 2. 말풍선이 하나씩
  [["b1", 2.9], ["b2", 3.6], ["b3", 4.3], ["b4", 5.3]].forEach(([id, s]) => { const e = $(id); e.style.opacity = clamp((t - s) / 0.15); e.style.transform = "scale(" + (0.7 + 0.3 * ease((t - s) / 0.2)) + ")"; });
  $("ssip").style.opacity = clamp((t - 5.9) / 0.1); $("ssip").style.transform = "rotate(-6deg) scale(" + (1.6 - 0.6 * ease((t - 5.9) / 0.25)) + ")";
  // 5. 카운트다운(빨리 감기) + 나는 참새 + 목록
  const p = clamp((t - 13.8) / 3.6);
  const left = Math.round((1 - p) * (11 * 3600 + 36 * 60));
  const hh = Math.floor(left / 3600), mm = Math.floor(left / 60) % 60, ss = left % 60;
  $("cd").textContent = hh + ":" + String(mm).padStart(2, "0") + ":" + String(ss).padStart(2, "0");
  $("fly").style.transform = "translate(" + (-200 + p * 1300) + "px," + Math.sin(t * 9) * 16 + "px)";
  [["l1", 14.1], ["l2", 14.9], ["l3", 15.7], ["l4", 16.5]].forEach(([id, s]) => { const e = $(id); e.style.opacity = clamp((t - s) / 0.15); e.style.transform = "translateX(" + (1 - ease((t - s) / 0.3)) * -60 + "px)"; });
  // 6. 알림 → "참새로?" → 두루마리 펼침
  $("noti").style.transform = "translateY(" + (1 - ease((t - 17.7) / 0.4)) * -300 + "px)";
  $("sumi1").style.opacity = clamp((t - 18.3) / 0.2);
  $("scr").style.height = (ease((t - 19.0) / 1.4) * 760) + "px";
  // 7. 기뻐서 폴짝
  $("jump").style.transform = "translateX(-50%) translateY(" + (-Math.abs(Math.sin((t - 22.5) * 7)) * 80 * (t > 22.5 ? 1 : 0)) + "px)";
};
</script></body></html>`;

const tmp = resolve(root, "promo/.reel-frames");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1080, height: 1920 } });
await page.setContent(html, { waitUntil: "load" });
await page.evaluate(() => (document as any).fonts.ready);
const N = Math.round(T * FPS);
for (let i = 0; i < N; i++) {
  await page.evaluate((t) => (window as any).at(t), i / FPS);
  await page.screenshot({ path: `${tmp}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 90 });
}
await browser.close();

mkdirSync(resolve(root, "promo/video/card"), { recursive: true });
const out = resolve(root, "promo/video/reel-chulsu.mp4");
const music = resolve(root, "promo/video/saepyeonji-15s.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${tmp}/f%04d.jpg`, "-stream_loop", "-1", "-i", music,
  "-filter_complex", `[1:a]atrim=0:${T},afade=t=out:st=${T - 1.5}:d=1.5[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", String(T), out]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${tmp}/f${String(Math.round(1.6 * FPS)).padStart(4, "0")}.jpg`, out.replace(/\.mp4$/, "-cover.png")]);
// 넘겨 보기 첫 장용 4:5(한지색 여백으로 감쌈)
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", out, "-vf", "scale=-2:1350,pad=1080:1350:(ow-iw)/2:0:color=0xFBF3E4", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", resolve(root, "promo/video/card/reel-chulsu.mp4")]);
rmSync(tmp, { recursive: true, force: true });
console.log("reel", existsSync(out), out);
