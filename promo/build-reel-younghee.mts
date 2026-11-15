/**
 * 웃긴 사연 릴스 2편 "고백 47번 지운 영희 씨" (세로 9:16, 18초, 빠른 컷): npx tsx promo/build-reel-younghee.mts
 * 2026-11-15 저녁 대표님: "어제 느낌보다 더 영상 재미있게, 조금 더 빠르게"
 * 연출된 이야기 표시는 늘 화면에. 시간은 앱 계산(서울 마포→대전 142km: 비둘기 2시간 11분, 매 1시간 35분).
 * 결과: promo/video/reel-younghee.mp4·-cover.png, 4:5 사본 promo/video/card/reel-younghee.mp4
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
const FPS = 30, T = 18;

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
.punch { position: absolute; left: 0; right: 0; text-align: center; font-weight: 900; letter-spacing: -6px; }
.split { position: absolute; top: 470px; width: 470px; height: 860px; background: #fff; border-radius: 44px; box-shadow: 0 30px 60px rgba(0,0,0,.14); padding: 40px 30px; text-align: center; overflow: hidden; }
.typing { display: inline-block; background: #FEE500; border-radius: 30px; padding: 20px 30px; font-size: 54px; font-weight: 800; min-width: 80px; min-height: 100px; }
.list div { font-size: 58px; font-weight: 800; margin: 26px 0; opacity: 0; }
.scroll { position: absolute; left: 110px; right: 110px; background: #FFF8EC; border: 3px solid #E0A83C; border-radius: 24px; padding: 50px 54px; font-family: H, P; font-size: 66px; line-height: 1.35; overflow: hidden; letter-spacing: 0; box-shadow: 0 20px 50px rgba(0,0,0,.12); }
.tag { position: absolute; left: 0; right: 0; bottom: 110px; display: flex; justify-content: center; align-items: center; gap: 22px; font-size: 52px; font-weight: 900; }
.tag img { width: 120px; height: 120px; border-radius: 28px; box-shadow: 0 8px 24px rgba(0,0,0,.18); }
</style></head><body>
<div class="fic" id="fic">이 이야기는 연출된 가상의 이야기입니다</div>

<!-- 1. 훅: 지운 횟수 -->
<div class="sc" id="s1" style="background:#16110E;color:#fff">
  <div class="cap" style="top:380px;font-size:74px">고백 카톡<br>쓰고 지운 횟수</div>
  <div class="punch big" id="cnt" style="top:720px;font-size:330px;color:#F0BC5C">1</div>
  <div class="cap" style="top:1180px;font-size:70px">번 🫠</div>
</div>

<!-- 2. 카톡 흑역사 -->
<div class="sc" id="s2">
  <div class="cap" style="top:190px">결국 보낸 건…</div>
  <div class="chat" style="top:420px;height:820px"><div class="who">민호</div>
    <div style="text-align:right"><span class="typing" id="ty"></span></div>
    <span class="bub" id="y2" style="margin-top:26px"><i>1</i>ㅋㅋ 뭐해</span>
    <span class="bub" id="y3" style="background:#fff;margin:0 auto 0 0"><i></i>ㅋ</span>
  </div>
  <div class="cap" id="hk" style="top:1330px;color:#E2512A;font-size:120px;transform:rotate(-5deg)">ㅋ 한 글자 😇</div>
</div>

<!-- 3. 결심 -->
<div class="sc" id="s3" style="background:#E2512A;color:#fff">
  <div class="face" style="top:330px;font-size:280px">😤</div>
  <div class="cap" style="top:760px;font-size:96px">"이번엔<br>새로 보낸다"</div>
</div>

<!-- 4. 새편지 비둘기 -->
<div class="sc" id="s4">
  <div class="card" style="top:300px">
    <div style="font-size:40px;font-weight:800;color:#888">받는 사람</div>
    <div style="font-size:64px;font-weight:900;margin:10px 0 24px">민호 · 대전</div>
    <div style="display:flex;align-items:center;gap:30px">
      <div style="transform:scaleX(-1)">${bird("pigeon", 200)}</div>
      <div><div style="font-size:60px;font-weight:900">비둘기</div><div class="pill">2시간 11분</div></div>
    </div>
  </div>
  <div class="scroll" style="top:960px;height:330px;font-size:70px">좋아해.<br>카톡으론 도저히 못 하겠어서.</div>
  <div class="cap" id="go" style="top:1420px;color:#E2512A;font-size:100px">➤ 날려 보냄!</div>
</div>

<!-- 5. 둘 다 지도만 봄 -->
<div class="sc" id="s5">
  <div class="cap" style="top:200px">그 2시간 동안<br><span style="color:#E2512A">둘 다 지도만 봄</span></div>
  <div class="split" style="left:50px">
    <div style="font-size:44px;font-weight:900">영희</div>
    <div style="font-size:150px;margin:30px 0" id="f1">😬</div>
    <div style="font-size:40px;font-weight:800">"지금 평택…<br>지금 천안…"</div>
  </div>
  <div class="split" style="right:50px">
    <div style="font-size:44px;font-weight:900">민호</div>
    <div style="font-size:150px;margin:30px 0" id="f2">🤔</div>
    <div style="font-size:40px;font-weight:800">"영희가<br>왜 편지를…?"</div>
  </div>
  <div class="big" id="cd" style="position:absolute;left:0;right:0;top:1380px;text-align:center;font-size:130px">2:11:00</div>
  <div id="fly" style="position:absolute;top:1560px;left:0">${bird("pigeon", 170)}</div>
</div>

<!-- 6. 도착 -->
<div class="sc" id="s6" style="background:#FFF1E6">
  <div class="card" id="noti" style="top:240px;padding:36px 40px;display:flex;gap:28px;align-items:center">
    <div style="font-size:90px">💌</div>
    <div><div style="font-size:46px;font-weight:900">영희 님의 편지가 도착했어요</div></div>
  </div>
  <div class="scroll" id="scr" style="top:560px;height:0;font-size:76px">좋아해.<br>카톡으론 도저히<br>못 하겠어서.</div>
  <div class="face" id="mh" style="top:1240px;font-size:240px">😳</div>
</div>

<!-- 7. 매로 답장 -->
<div class="sc" id="s7" style="background:#1E3A5C;color:#fff">
  <div class="cap" style="top:250px;font-size:70px">민호의 답장</div>
  <div class="card" style="top:420px;color:#16110E;display:flex;gap:26px;align-items:center">
    <div>${bird("hawk", 190)}</div>
    <div><div style="font-size:52px;font-weight:900">매로 보냈어요</div><div style="font-size:40px;font-weight:700;color:#E2512A">제일 빠른 새</div></div>
  </div>
  <div class="cap" style="top:860px;font-size:92px">"나도.<br>그래서 매로 보냄."</div>
  <div class="face" id="jump" style="top:1300px;font-size:260px">🥹</div>
</div>

<!-- 8. 끝 -->
<div class="sc" id="s8">
  <div class="cap" style="top:300px">카톡 고백은 <span style="color:#888">3초 흑역사</span><br>편지 고백은 <span style="color:#E2512A">2시간 설렘</span></div>
  <div style="position:absolute;left:0;right:0;top:760px;display:flex;justify-content:center">${bird("pigeon", 360)}</div>
  <div class="sub" style="top:1240px;font-size:52px;font-weight:900">${SLOGAN}</div>
  <div class="sub" style="top:1340px;font-size:40px;color:#666">앱스토어에서 ‘새 편지’ · 무료</div>
  <div class="tag"><img src="data:image/png;base64,${readFileSync(resolve(root, "promo/store/play-icon-512.png")).toString("base64")}">새 편지</div>
</div>

<script>
const S = [[0,1.6],[1.6,4.4],[4.4,5.6],[5.6,8],[8,10.6],[10.6,12.6],[12.6,14.8],[14.8,99]];
const $ = (id) => document.getElementById(id);
const clamp = (x) => Math.max(0, Math.min(1, x));
const ease = (x) => 1 - Math.pow(1 - clamp(x), 3);
const pop = (x) => { x = clamp(x); return 1 + 0.35 * Math.sin(x * Math.PI) * (1 - x); };
window.at = (t) => {
  S.forEach(([a, b], i) => {
    const el = $("s" + (i + 1));
    el.style.opacity = Math.min(i === 0 ? 1 : clamp((t - a) / 0.12), i === S.length - 1 ? 1 : clamp((b - t) / 0.1));
    el.style.transform = i === 0 ? "" : "scale(" + (1.08 - 0.08 * ease((t - a) / 0.25)) + ")";
  });
  $("fic").className = "fic" + ((t < 1.6 || (t >= 4.4 && t < 5.6) || (t >= 12.6 && t < 14.8)) ? " l" : "");
  // 1. 1 → 47 빠르게
  const n = Math.max(1, Math.round(ease(t / 1.3) * 47)); $("cnt").textContent = n;
  $("cnt").style.transform = "scale(" + (1 + (n === 47 ? 0.15 * Math.sin(clamp((t - 1.2) / 0.3) * Math.PI) : 0)) + ")";
  // 2. 타자 → 지움 → ㅋㅋ 뭐해 → ㅋ
  const word = "좋아해…", tt = t - 1.7;
  let s = tt < 0 ? "" : tt < 0.6 ? word.slice(0, Math.ceil(tt / 0.15)) : tt < 1.0 ? word.slice(0, Math.max(0, word.length - Math.ceil((tt - 0.6) / 0.1))) : "";
  $("ty").textContent = s; $("ty").style.opacity = tt < 1.05 ? 1 : 0;
  $("y2").style.opacity = clamp((t - 2.8) / 0.08); $("y3").style.opacity = clamp((t - 3.3) / 0.08);
  $("hk").style.opacity = clamp((t - 3.6) / 0.08); $("hk").style.transform = "rotate(-5deg) scale(" + (1.7 - 0.7 * ease((t - 3.6) / 0.2)) + ")";
  // 4. 날려 보냄 펑
  $("go").style.opacity = clamp((t - 7.0) / 0.1); $("go").style.transform = "scale(" + pop((t - 7.0) / 0.4) + ")";
  // 5. 카운트다운 빨리 감기 + 나는 비둘기 + 표정 흔들
  const p = clamp((t - 8.2) / 2.2);
  const left = Math.round((1 - p) * (2 * 3600 + 11 * 60));
  $("cd").textContent = Math.floor(left / 3600) + ":" + String(Math.floor(left / 60) % 60).padStart(2, "0") + ":" + String(left % 60).padStart(2, "0");
  $("fly").style.transform = "translate(" + (-180 + p * 1260) + "px," + Math.sin(t * 12) * 14 + "px)";
  $("f1").style.transform = "rotate(" + Math.sin(t * 18) * 8 + "deg)"; $("f2").style.transform = "rotate(" + Math.sin(t * 14 + 1) * 6 + "deg)";
  // 6. 알림 → 두루마리 → 😳
  $("noti").style.transform = "translateY(" + (1 - ease((t - 10.6) / 0.3)) * -300 + "px)";
  $("scr").style.height = (ease((t - 10.9) / 0.9) * 560) + "px";
  $("mh").style.opacity = clamp((t - 11.8) / 0.1); $("mh").style.transform = "translateX(-50%) scale(" + pop((t - 11.8) / 0.4) + ")";
  // 7. 폴짝
  $("jump").style.transform = "translateX(-50%) translateY(" + (t > 13.6 ? -Math.abs(Math.sin((t - 13.6) * 9)) * 90 : 0) + "px)";
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
const out = resolve(root, "promo/video/reel-younghee.mp4");
const music = resolve(root, "promo/video/saepyeonji-15s.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${tmp}/f%04d.jpg`, "-stream_loop", "-1", "-i", music,
  "-filter_complex", `[1:a]atrim=0:${T},afade=t=out:st=${T - 1.5}:d=1.5[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", String(T), out]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${tmp}/f${String(Math.round(0.4 * FPS)).padStart(4, "0")}.jpg`, out.replace(/\.mp4$/, "-cover.png")]);
// 넘겨 보기 첫 장용 4:5(한지색 여백으로 감쌈)
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", out, "-vf", "scale=-2:1350,pad=1080:1350:(ow-iw)/2:0:color=0xFBF3E4", "-c:v", "libx264", "-crf", "21", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", resolve(root, "promo/video/card/reel-younghee.mp4")]);
rmSync(tmp, { recursive: true, force: true });
console.log("reel", existsSync(out), out);
