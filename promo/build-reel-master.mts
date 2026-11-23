/**
 * 대표 광고 영상 "카톡 말고, 새가 물어다 주는 편지"(4:5 1080x1350, 약 25초): npx tsx promo/build-reel-master.mts
 * 2026-11-23 대표님: "영상만 보고 확 올 수 있게, 누구나 쓰는 자기 모습을 상상하게, 다운받고 싶게. 첫 장은 영상, 나머지는 카드 뉴스.
 * 애플 스토어 링크는 프로필 안내, 플레이스토어는 11월 중 출시."
 * 장면: 제목 → 카톡 홍수 → 새가 날아요 → 지도(진짜 거리) → 비 오는 날 천천히(새 기능) → 가끔 길 잃음 → 도착·두루마리·폴라로이드 → 누구에게? → 끝(앱스토어·프로필·플레이 11월 중 출시 예정)
 * 시간은 앱 계산(core/birds) 그대로, 편지 내용은 예시(화면에 "화면은 예시예요"). 프레임마다 window.at(t)로 그려서 이어 붙임.
 * 결과: promo/video/card/reel-master.mp4(4:5, 넘겨 보기 첫 장) · promo/video/reel-master.mp4(9:16, 릴스·틱톡) · -cover.png
 */
import { createRequire } from "node:module";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";

const req = createRequire(import.meta.url);
const React = req("react");
const { renderToStaticMarkup } = req("react-dom/server");
(globalThis as any).React = React;
const { default: CuteBird } = await import("../src/components/CuteBird.tsx");
const { SLOGAN } = await import("./store.mts");
const { BIRDS } = await import("../core/birds.ts");
const { formatMinutes } = await import("../core/geo.ts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const f = (p: string) => "file://" + resolve(root, p);
const bird = (id: string, s: number, v = "C") => renderToStaticMarkup(React.createElement(CuteBird as any, { id, variant: v, size: s, letter: v === "C" }));
const pigeonMin = BIRDS.find((b: any) => b.id === "pigeon")!.minutesSeoulBusan as number;
const FPS = 30, T = 25, W = 1080, H = 1350;

const chats = ["ㅇㅇ", "ㅋㅋ", "넵", "👍", "ㅇㅋ", "읽음", "ㅎㅎ", "ㄱㄱ", "?", "ㅋㅋㅋ", "ㅇㅇ", "넹", "ㅇㅋㅇㅋ", "👌", "ㅋ", "웅", "ㅇㅇ", "ㄴㄴ", "ㅎ", "ㅋㅋ"];
const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: P; src: url(${f("src/app/fonts/PretendardSub.woff2")}); font-weight: 100 900; }
@font-face { font-family: H; src: url(${f("public/fonts/SaePyeonjiHand.woff2")}); }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: P, sans-serif; background: #FBF3E4; color: #16110E; letter-spacing: -1.5px; word-break: keep-all; position: relative; }
.sc { position: absolute; inset: 0; opacity: 0; overflow: hidden; }
.cap { position: absolute; left: 60px; right: 60px; text-align: center; font-weight: 900; font-size: 92px; line-height: 1.15; letter-spacing: -4px; }
.sub { position: absolute; left: 60px; right: 60px; text-align: center; font-weight: 700; font-size: 44px; line-height: 1.35; }
.bub { display: block; width: fit-content; max-width: 520px; margin: 0 0 22px auto; background: #FEE500; border-radius: 30px; padding: 18px 30px; font-size: 46px; font-weight: 700; color: #222; }
.bub.y { margin: 0 auto 22px 0; background: #fff; }
.chip { display: inline-block; background: #fff; color: #16110E; border-radius: 99px; padding: 22px 40px; font-size: 52px; font-weight: 800; margin: 14px; box-shadow: 0 10px 24px rgba(0,0,0,.12); opacity: 0; transform: scale(.6); }
.note { position: absolute; left: 70px; right: 70px; background: #fff; border-radius: 34px; padding: 30px 36px; display: flex; gap: 24px; align-items: center; box-shadow: 0 24px 50px rgba(0,0,0,.22); }
.note img { width: 96px; height: 96px; border-radius: 22px; }
.scroll { position: absolute; left: 110px; right: 110px; background: #FFF8EC; border-radius: 22px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,.14); }
.scroll .in { padding: 50px 56px; font-family: H, P; font-size: 60px; line-height: 1.4; letter-spacing: 0; }
.rod { position: absolute; left: 92px; right: 92px; height: 34px; background: #D9BE8C; border-radius: 17px; }
.drop { position: absolute; width: 5px; height: 60px; background: rgba(200,225,255,.75); border-radius: 3px; }
.btn { position: absolute; left: 120px; right: 120px; text-align: center; border-radius: 999px; font-weight: 800; }
</style></head><body>

<div class="sc" id="s0" style="background:#E0A83C">
  <div class="cap" style="top:250px;font-size:84px">카톡 말고,</div>
  <div class="cap" style="top:360px;font-size:118px;line-height:1.08">새가 물어다<br>주는 편지</div>
  <div id="b0" style="position:absolute;left:300px;top:690px">${bird("magpie", 480)}</div>
  <div class="sub" style="top:1210px;font-size:38px;font-weight:800">🔊 소리 켜고 보기 · 새 편지</div>
</div>

<div class="sc" id="s1" style="background:#B9C9D9">
  <div style="position:absolute;left:0;right:0;top:0;height:120px;background:#A9BCCD;display:flex;align-items:center;padding:0 50px;font-size:40px;font-weight:800;color:#2c3a48">💬 단톡방 · <span id="cnt" style="margin-left:14px;color:#E2512A">999+</span></div>
  <div id="flood" style="position:absolute;left:60px;right:60px;top:140px">${chats.map((c, i) => `<div class="bub ${i % 3 === 1 ? "y" : ""}">${c}</div>`).join("").repeat(3)}</div>
  <div id="dim" style="position:absolute;inset:0;background:rgba(22,17,14,.82);opacity:0"></div>
  <div id="q1" class="cap" style="top:430px;color:#fff;opacity:0;font-size:84px">하루에 수백 개.<br><span style="color:#F0BC5C">기억나는 말,<br>있어요?</span></div>
</div>

<div class="sc" id="s2" style="background:#FBF3E4">
  <div class="cap" style="top:200px">이번엔,</div>
  <div class="cap" style="top:320px;color:#E2512A">새가 직접<br>날아가요</div>
  <div id="b2" style="position:absolute;top:720px">${bird("pigeon", 420)}</div>
</div>

<div class="sc" id="s3" style="background:#FBF3E4">
  <div class="cap" style="top:90px;font-size:76px">진짜 거리만큼,<br><span style="color:#E2512A">진짜로 날아가요</span></div>
  <svg width="${W}" height="${H}" style="position:absolute;left:0;top:0">
    <path id="route" d="M250 420 C 360 560, 520 600, 600 720 S 760 900, 820 960" fill="none" stroke="#16110E" stroke-width="9" stroke-linecap="round" stroke-dasharray="6 22"/>
    <circle cx="250" cy="420" r="22" fill="#1E3A5C"/><text x="160" y="400" font-size="44" font-weight="800" fill="#1E3A5C" font-family="P">서울</text>
    <circle cx="820" cy="960" r="22" fill="#E2512A"/><text x="850" y="950" font-size="44" font-weight="800" fill="#E2512A" font-family="P">부산</text>
    <text x="640" y="560" font-size="56">⛰️</text><text x="330" y="760" font-size="50">🌾</text><text x="700" y="1040" font-size="46">🌊</text>
  </svg>
  <div id="b3" style="position:absolute;width:190px;height:190px;margin:-95px 0 0 -95px">${bird("pigeon", 190)}</div>
  <div style="position:absolute;left:70px;right:70px;top:1060px;background:#fff;border-radius:34px;padding:30px 36px;box-shadow:0 20px 40px rgba(0,0,0,.12)">
    <div style="display:flex;justify-content:space-between;font-size:40px;font-weight:800"><span>🕊 비둘기가 날아가는 중</span><span style="color:#E2512A" id="left">남은 시간</span></div>
    <div style="font-size:30px;font-weight:600;opacity:.6;margin-top:6px">서울 → 부산 325km · 실제 새의 비행 속도를 바탕으로</div>
    <div style="margin-top:18px;height:16px;background:#EFE6D6;border-radius:8px;overflow:hidden"><div id="bar" style="height:100%;width:0;background:#E0A83C"></div></div>
  </div>
</div>

<div class="sc" id="s4" style="background:linear-gradient(#5D6F82,#8A9AAB)">
  <div id="rain"></div>
  <div style="position:absolute;left:120px;top:520px;font-size:150px">☁️</div><div style="position:absolute;left:640px;top:470px;font-size:190px">☁️</div>
  <div class="cap" style="top:110px;color:#fff;font-size:88px">비 오는 날엔,<br><span style="color:#F0BC5C">새도 천천히.</span></div>
  <div id="b4" style="position:absolute;left:330px;top:720px">${bird("pigeon", 400)}</div>
  <div style="position:absolute;left:0;right:0;top:1150px;text-align:center"><span style="display:inline-block;background:#fff;border-radius:99px;padding:22px 40px;font-size:44px;font-weight:800">🌧 비가 와서 비둘기가 천천히 날아요</span></div>
  <div class="sub" style="top:1260px;color:#fff;font-size:34px;opacity:.9">보내는 순간의 진짜 날씨를 봐요</div>
</div>

<div class="sc" id="s5" style="background:#FBF3E4">
  <div class="cap" style="top:110px;font-size:84px">가끔은<br><span style="color:#E2512A">길도 잃어요 🧭</span></div>
  <svg width="${W}" height="${H}" style="position:absolute;left:0;top:0"><path id="loop" d="M140 560 C 360 520, 420 700, 330 780 C 240 860, 200 700, 360 650 C 560 590, 640 820, 540 880 C 450 930, 470 760, 640 760 C 800 760, 860 900, 950 980" fill="none" stroke="#16110E" stroke-width="8" stroke-dasharray="4 20" stroke-linecap="round"/></svg>
  <div id="b5" style="position:absolute;width:200px;height:200px;margin:-100px 0 0 -100px">${bird("magpie", 200)}</div>
  <div class="sub" style="top:1130px;font-size:52px;font-weight:800">그래도 편지는 <span style="color:#E2512A">꼭 도착해요.</span></div>
</div>

<div class="sc" id="s6" style="background:#E2512A">
  <div id="nt" class="note" style="top:-260px"><img src="${f("promo/store/play-icon-512.png")}"><div><div style="font-size:28px;font-weight:800;opacity:.55;letter-spacing:0">새 편지 · 지금</div><div style="font-size:46px;font-weight:800;line-height:1.25;margin-top:4px">💌 엄마에게서 편지가<br>도착했어요</div></div></div>
  <div class="rod" id="rod1" style="top:400px;opacity:0"></div>
  <div class="scroll" id="sc" style="top:417px;height:0"><div class="in">밥은 잘 챙겨 먹지?<br>오늘 하늘 보니까<br>네 생각이 나더라.<br>보고 싶다. <span style="color:#E2512A">— 엄마가</span></div></div>
  <div class="rod" id="rod2" style="top:400px;opacity:0"></div>
  <div id="pol" style="position:absolute;right:80px;top:960px;width:300px;background:#fff;padding:18px 18px 60px;box-shadow:0 20px 40px rgba(0,0,0,.25);transform:rotate(6deg);opacity:0">
    <div id="photo" style="height:240px;background:linear-gradient(160deg,#f7d9b8,#e9a87c 50%,#8a6a8c)"></div>
    <div style="position:absolute;left:0;right:0;bottom:14px;text-align:center;font-family:H,P;font-size:34px;color:#555;letter-spacing:0">우리 동네 노을</div></div>
  <div id="pt" style="position:absolute;left:84px;top:1020px;color:#fff;font-size:42px;font-weight:800;line-height:1.35;opacity:0">사진은 폴라로이드로,<br>천천히 선명해져요</div>
  <div style="position:absolute;left:84px;bottom:50px;color:rgba(255,255,255,.7);font-size:26px;font-weight:700;letter-spacing:0">화면은 예시예요</div>
</div>

<div class="sc" id="s7" style="background:#1E3A5C">
  <div class="cap" style="top:170px;color:#fff;font-size:96px">당신은<br><span style="color:#F0BC5C">누구에게</span><br>보낼래요?</div>
  <div style="position:absolute;left:50px;right:50px;top:640px;text-align:center">
    <span class="chip">👩 엄마</span><span class="chip">🧳 멀리 사는 친구</span><span class="chip">🪖 군대 간 동생</span><span class="chip">💝 고마운 선생님</span><span class="chip">🌏 아직 모르는 펜팔 친구</span></div>
</div>

<div class="sc" id="s8" style="background:#1E3A5C;color:#fff;text-align:center">
  <img src="${f("promo/store/play-icon-512.png")}" style="position:absolute;left:430px;top:110px;width:220px;height:220px;border-radius:52px;box-shadow:0 30px 60px rgba(0,0,0,.3)">
  <div style="position:absolute;left:0;right:0;top:360px;font-size:120px;font-weight:900;letter-spacing:-5px">새 편지</div>
  <div style="position:absolute;left:0;right:0;top:520px;font-size:46px;font-weight:700">${SLOGAN}</div>
  <div class="btn" style="top:650px;background:#fff;color:#16110E;padding:30px 0;font-size:44px">🍎 아이폰 · 앱스토어에서 '새편지'</div>
  <div class="btn" id="prof" style="top:790px;background:#F0BC5C;color:#16110E;padding:24px 0;font-size:40px">👆 링크는 프로필에 @saepyeonji</div>
  <div style="position:absolute;left:60px;right:60px;top:940px;font-size:40px;font-weight:800;line-height:1.45">▶ 구글 플레이 <span style="color:#F0BC5C">11월 중 출시 예정</span><br><span style="font-size:34px;font-weight:600;opacity:.85">안드로이드는 지금 웹으로 · bird-letter.vercel.app</span></div>
  <div style="position:absolute;left:0;right:0;top:1180px;font-size:32px;font-weight:700;opacity:.75">무료로 시작해요</div>
</div>

<script>
const S = [[0,1.6],[1.6,4.4],[4.4,7.2],[7.2,11],[11,14],[14,16.4],[16.4,20],[20,22.2],[22.2,${T}]];
const $ = (id) => document.getElementById(id);
const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : 1 - Math.pow(1 - x, 3);
const drops = []; for (let i = 0; i < 70; i++) { const d = document.createElement("div"); d.className = "drop"; $("rain").appendChild(d); drops.push([Math.random() * ${W}, Math.random() * ${H}, 900 + Math.random() * 500]); }
const route = $("route"), RL = route.getTotalLength(), loop = $("loop"), LL = loop.getTotalLength();
const PIG = ${pigeonMin};
const fmt = (m) => { m = Math.max(0, Math.round(m)); const h = Math.floor(m / 60), mm = m % 60; return (h ? h + "시간 " : "") + mm + "분"; };
// 첫 장면(i=0)은 처음부터 보이게: 인스타 넘겨 보기 썸네일이 첫 프레임이라서
window.at = (t) => {
  S.forEach(([a, b], i) => { const el = $("s" + i); const o = Math.min(i === 0 ? 1 : (t - a) / 0.22, (b - t) / 0.22 + (i === S.length - 1 ? 9 : 0)); el.style.opacity = Math.max(0, o); });
  // 0 제목: 새가 살짝 둥실
  $("b0").style.transform = "translateY(" + Math.sin(t * 5) * 14 + "px) rotate(-6deg)";
  // 1 카톡 홍수
  { const l = t - 1.6; $("flood").style.transform = "translateY(" + (-Math.min(l, 1.8) * 1400) + "px)"; $("cnt").textContent = l < 1.8 ? (Math.floor(120 + l * 480)) + "" : "999+";
    const k = ease((l - 1.7) / 0.4); $("dim").style.opacity = k; $("q1").style.opacity = k; }
  // 2 새가 날아 들어옴
  { const l = t - 4.4; $("b2").style.left = (-420 + ease(l / 1.6) * 750) + "px"; $("b2").style.transform = "translateY(" + Math.sin(t * 7) * 18 + "px) rotate(-8deg)"; }
  // 3 지도 위 비행
  { const l = t - 7.2, p = ease(l / 3.4) * 0.92; route.style.strokeDashoffset = 0; const pt = route.getPointAtLength(RL * p);
    $("b3").style.left = pt.x + "px"; $("b3").style.top = (pt.y + Math.sin(t * 8) * 6) + "px"; $("bar").style.width = (p * 100) + "%"; $("left").textContent = "남은 시간 " + fmt(PIG * (1 - p)); }
  // 4 비
  { const l = t - 11; drops.forEach(([x, y, v], i) => { const d = $("rain").children[i]; d.style.left = (x - ((l * v * 0.18) % 200)) + "px"; d.style.top = (((y + l * v) % (${H} + 100)) - 100) + "px"; d.style.transform = "rotate(12deg)"; });
    $("b4").style.transform = "translate(" + Math.sin(l * 1.2) * 30 + "px," + Math.sin(l * 2.2) * 22 + "px) rotate(4deg)"; }
  // 5 길 잃음
  { const l = t - 14, p = ease(l / 2.2); const pt = loop.getPointAtLength(LL * p); $("b5").style.left = pt.x + "px"; $("b5").style.top = pt.y + "px"; $("b5").style.transform = "rotate(" + Math.sin(l * 6) * 12 + "deg)"; }
  // 6 도착
  { const l = t - 16.4; $("nt").style.top = (-260 + ease(l / 0.5) * 330) + "px";
    const u = ease((l - 0.8) / 0.9); $("rod1").style.opacity = l > 0.8 ? 1 : 0; $("rod2").style.opacity = l > 0.8 ? 1 : 0; $("sc").style.height = (u * 470) + "px"; $("rod2").style.top = (400 + u * 470) + "px";
    const q = ease((l - 1.8) / 0.4); $("pol").style.opacity = q; $("pt").style.opacity = q;
    const dev = Math.max(0, Math.min(1, (l - 1.9) / 1.4)); $("photo").style.filter = "brightness(" + (2.2 - dev * 1.2) + ") saturate(" + dev + ") blur(" + ((1 - dev) * 6) + "px)"; }
  // 7 누구에게?
  { const l = t - 20; [...document.querySelectorAll(".chip")].forEach((c, i) => { const k = ease((l - 0.35 - i * 0.25) / 0.3); c.style.opacity = k; c.style.transform = "scale(" + (0.6 + k * 0.4) + ")"; }); }
  // 8 끝: 프로필 버튼이 콕콕
  { const l = t - 22.2; $("prof").style.transform = "scale(" + (1 + Math.max(0, Math.sin(l * 6)) * 0.05) + ")"; }
};
</script></body></html>`;

const tmp = resolve(root, "promo/.reel-frames-master");
rmSync(tmp, { recursive: true, force: true });
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch({ args: ["--allow-file-access-from-files"] });
const page = await browser.newPage({ viewport: { width: W, height: H } });
// 파일로 열어야 아이콘·손글씨 글꼴(file://)이 불러와져요
writeFileSync(`${tmp}/index.html`, html);
await page.goto("file://" + tmp + "/index.html", { waitUntil: "load" });
await page.evaluate(async () => { await (document as any).fonts.ready; await Promise.all([...document.images].map((i) => i.decode().catch(() => {}))); });
const N = Math.round(T * FPS);
for (let i = 0; i < N; i++) {
  await page.evaluate((t) => (window as any).at(t), i / FPS);
  await page.screenshot({ path: `${tmp}/f${String(i).padStart(4, "0")}.jpg`, type: "jpeg", quality: 90 });
}
await browser.close();

mkdirSync(resolve(root, "promo/video/card"), { recursive: true });
const card = resolve(root, "promo/video/card/reel-master.mp4");
const music = resolve(root, "promo/video/saepyeonji-15s.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", `${tmp}/f%04d.jpg`, "-stream_loop", "-1", "-i", music,
  "-filter_complex", `[1:a]atrim=0:${T},afade=t=out:st=${T - 1.5}:d=1.5[a]`,
  "-map", "0:v", "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "19", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", String(T), card]);
// 9:16(릴스·틱톡): 위아래를 황토로 채움
const tall = resolve(root, "promo/video/reel-master.mp4");
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", card, "-vf", "pad=1080:1920:0:285:color=0xE0A83C", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", tall]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${tmp}/f0000.jpg`, resolve(root, "promo/video/reel-master-cover.png")]);
execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", `${tmp}/f0000.jpg`, resolve(root, "promo/video/card/reel-master-cover.jpg")]);
rmSync(tmp, { recursive: true, force: true });
console.log("master", card, tall);
