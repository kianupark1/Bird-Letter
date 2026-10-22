/**
 * 홍보 영상(세로 15초, 릴스·틱톡·쇼츠 공용) 생성기: npx tsx promo/build-video.mts [이야기 이름, 없으면 모두]
 * 결과(이야기 3편, 틱톡은 자주 올려야 해서 여러 편): promo/video/saepyeonji-15s.mp4(엄마·부산·두루미),
 *   saepyeonji-15s-love.mp4(멀리 있는 너·경주·매), saepyeonji-15s-grandma.mp4(할머니·강릉·까치),
 *   기다림 편 -suneung·-xmas·-dad·-friend·-sister(아래 VARIANTS). 1080×1920, 30fps, 소리 포함, 표지는 -cover.png
 * 받는 곳 문구는 promo/store.mts 한곳.
 * 한 장면씩 그림을 정확한 시각으로 찍어서(프레임 450장) 이어 붙여요. AI 생성 크레딧이 필요 없어요.
 * 흐름: ① 고객의 문제(너무 빠른 답장) → ② 천천히 오는 소식 → ③ 지도 위를 날아가는 새 → ④ 두루마리 펼침 → ⑤ 앱 이름·받는 곳
 * 소리: 통통 튀는 마림바 새 노래 + 짹짹·푸드덕·종이·종(모두 코드로 만듦). 올릴 때 앱에서 유행 음원을 덧입혀도 돼요.
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
const { default: FlyBird } = await import("../src/components/FlyBird.tsx");
const { getBird } = await import("../core/birds.ts");
const { travelMinutes, formatMinutes } = await import("../core/geo.ts");
const { getRoute } = await import("../core/routes.ts");
const { withIGa } = await import("../core/korean.ts");
const { koreaMapSvg, routeCurve, MAP_CSS } = await import("./mapArt.mts");
const { STORE_PILL, STORE_SUB } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const W = 1080, H = 1920, FPS = 30, DUR = 15;
const css = readFileSync(resolve(root, "src/app/globals.css"), "utf8").split("* { box-sizing")[0].replace(/@media \(prefers-color-scheme: dark\)[\s\S]*$/, "}");
const FONT = resolve(root, "node_modules/pretendard/dist/web/variable/woff2/PretendardVariable.woff2");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
// 날개를 퍼덕이는 새(앱 지도와 같은 FlyBird). 가운데가 (0,0)이라 상자 가운데에 놓아요. left면 왼쪽을 봐요
const flyG = (id: string, size: number, left = false) => renderToStaticMarkup(React.createElement(FlyBird as any, { birdId: id, x: 0, y: 0, size, angle: left ? 180 : 0 }));
const fly = (id: string, size: number, box: number, left = false) =>
  `<svg width="${box}" height="${box}" viewBox="${-box / 2} ${-box / 2} ${box} ${box}">${flyG(id, size, left)}</svg>`;
// 이야기마다 첫 1초 문제(hook)·받는 사람·노선·새·두루마리 글이 달라요. 시간·거리는 앱 계산식 그대로
const VARIANTS = {
  mom: { file: "saepyeonji-15s", hook: ["답장, 너무 빨라서", "설레지 않죠?"], to: "엄마에게 보내는 편지 💌", from: "seoul", dest: "busan", bird: "crane", mid: "대전을 지났어요",
    chat: ["ㅇㅇ", "ㅋㅋㅋ", "읽음", "?", "왜 답 안 해", "ㅇㅋ"], lines: ["엄마, 이번 주말에", "내려갈게요.", "된장찌개 해 주세요 🙂"] },
  love: { file: "saepyeonji-15s-love", hook: ["읽씹될까 봐", "조마조마할 때"], to: "멀리 있는 너에게 💌", from: "seoul", dest: "gyeongju", bird: "hawk", mid: "월악산을 지났어요",
    chat: ["자?", "…", "읽음", "왜 답 없어", "ㅠㅠ", "잘 자"], lines: ["경주는 어때?", "보고 싶어서", "편지 먼저 보낸다 💌"] },
  grandma: { file: "saepyeonji-15s-grandma", hook: ["전화는 쑥스럽고", "문자는 너무 짧을 때"], to: "할머니께 보내는 편지 💌", from: "seoul", dest: "gangneung", bird: "magpie", mid: "오대산을 지났어요",
    chat: ["ㅇㅇ", "넵", "읽음", "ㅎㅎ", "ㅇㅋ", "👍"], lines: ["할머니, 날 추워요.", "감기 조심하시고", "주말에 갈게요 🙂"] },
  // 기다림의 즐거움을 첫 줄로(2026-10-22 대표님: "기다리는 것에 대한 즐거움이 포인트", 릴스·틱톡 팔로워 없이 퍼지게)
  suneung: { file: "saepyeonji-15s-suneung", hook: ["시험 끝나는 날", "딱 도착하게 보냈어"], to: "수능 보는 동생에게 💌", from: "seoul", dest: "daejeon", bird: "swallow", mid: "독립기념관을 지났어요",
    slow: ["기다리는 동안", "더 응원하게 돼요"], chat: ["화이팅", "ㅇㅇ", "읽음", "…", "긴장돼", "ㅠㅠ"], lines: ["시험 끝! 고생했어", "오늘은 푹 쉬어", "맛있는 거 먹자 🙂"] },
  xmas: { file: "saepyeonji-15s-xmas", hook: ["크리스마스 아침에", "도착하는 편지 🎄"], to: "친구에게 크리스마스 편지 🎄", from: "seoul", dest: "jeonju", bird: "crane", mid: "공산성을 지났어요",
    slow: ["열어 보기 전까지", "두근두근"], chat: ["메리크리스마스", "ㅁㅋ", "읽음", "ㅎㅎ", "ㅇㅇ", "🎄"], lines: ["메리 크리스마스!", "올해도 고마웠어", "내년에도 잘 부탁해 🎄"] },
  dad: { file: "saepyeonji-15s-dad", hook: ["보낸 지 12시간째", "아직 날아가는 중"], to: "아빠에게 보내는 편지 💌", from: "seoul", dest: "gwangju", bird: "pigeon", mid: "전주 한옥마을을 지났어요",
    slow: ["어디쯤 왔을까", "자꾸 보게 돼요"], chat: ["아빠 뭐해", "…", "읽음", "?", "바쁘신가", "ㅠ"], lines: ["아빠, 요즘 바쁘시죠?", "말로는 쑥스러워서", "편지로 보내요 🙂"] },
  friend: { file: "saepyeonji-15s-friend", hook: ["바로 안 가서", "더 설레는 편지"], to: "부산 사는 친구에게 💌", from: "seoul", dest: "busan", bird: "swallow", mid: "속리산을 지났어요",
    slow: ["하루를 기다리면", "하루만큼 반가워요"], chat: ["ㅋㅋ", "ㅇㅇ", "읽음", "ㅋ", "ㄱㄱ", "ㅇㅋ"], lines: ["다음 달에 놀러 갈게", "맛집 찾아 놔", "보고 싶다 🙂"] },
  sister: { file: "saepyeonji-15s-sister", hook: ["도착 알림이", "이렇게 설렐 줄이야"], to: "대구 사는 언니에게 💌", from: "seoul", dest: "daegu", bird: "bungbungi", mid: "속리산을 지났어요",
    slow: ["기다리는 시간도", "편지의 일부예요"], chat: ["생축", "ㄱㅅ", "읽음", "🎂", "ㅇㅇ", "ㅎㅎ"], lines: ["언니 생일 축하해!", "케이크는 직접 사 갈게", "사랑해 🎂"] },
} as const;
type VKey = keyof typeof VARIANTS;
const pick = process.argv[2] as VKey | undefined;
if (pick && !VARIANTS[pick]) throw new Error(`모르는 이야기: ${pick} (${Object.keys(VARIANTS).join("|")})`);
const MH = H + 340; // 지도를 아래로 내려 위쪽 제목과 안 겹치게(그림은 화면보다 길게 그려서 빈 곳이 없게)

function htmlFor(v: (typeof VARIANTS)[VKey]) {
const slow = "slow" in v ? v.slow : ["가끔은<br>천천히 오는 소식이", "더 설레요"];
const ROUTE = getRoute(`${v.from}-${v.dest}`), B = getBird(v.bird);
const FLY_MIN = Math.max(1, travelMinutes(B, ROUTE.km));
const curve = routeCurve(W, MH, v.from, v.dest, 0.95);
const pts = Array.from({ length: 101 }, (_, i) => curve.at(i / 100));
return `<!doctype html>
<html lang="ko"><head><meta charset="utf-8"><style>${css}
@font-face { font-family: P; src: url("file://${FONT}") format("woff2"); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; }
html, body { width: ${W}px; height: ${H}px; overflow: hidden; }
body { font-family: P, sans-serif; color: #2A2118; background: #FBF3E4; position: relative; }
svg { overflow: visible; display: block; }
${MAP_CSS}
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
<div class="L" id="mapL"><div class="L" style="overflow:hidden">${koreaMapSvg({ w: W, h: MH, from: v.from, to: v.dest, zoom: 0.95 })}
  <svg class="L" width="${W}" height="${MH}"><path id="trail" d="${curve.d}" fill="none" stroke="#C1481F" stroke-width="12" stroke-linecap="round"/>
  <circle id="ripple" cx="${curve.b.x}" cy="${curve.b.y}" r="20" fill="none" stroke="#1B6E5C" stroke-width="8"/></svg>
  <svg class="L" width="${W}" height="${MH}"><g id="mbird">${flyG(v.bird, 4.2, curve.b.x < curve.a.x)}</g></svg></div>
  <div style="position:absolute;left:0;right:0;top:110px;text-align:center"><span style="display:inline-block;background:#fff;border-radius:999px;padding:20px 48px;font-size:62px;font-weight:850;box-shadow:0 10px 0 rgba(42,33,24,.08)">${v.to}</span></div>
  <div class="card" style="top:1420px" id="cardC">
    <div style="display:flex;align-items:center;gap:22px"><div style="width:130px">${bird(v.bird, 130, true)}</div>
      <div><div style="font-size:50px;font-weight:850">${withIGa(B.name)} 날아가는 중</div><div style="font-size:38px;opacity:.7;margin-top:4px">${ROUTE.from.name} → ${ROUTE.to.name} ${ROUTE.km}km · ${formatMinutes(FLY_MIN)}</div></div></div>
    <div class="bar"><i id="barC"></i></div>
    <div style="display:flex;justify-content:space-between;margin-top:18px;font-size:40px;font-weight:800"><span id="whereC" style="color:#C1481F"></span><span id="leftC"></span></div>
  </div>
</div>
<div class="L" id="sceneA">
  <div class="cap" style="top:330px;font-size:104px;color:#FBF3E4">${v.hook[0]}<br><span style="color:#F0BC5C">${v.hook[1]}</span></div>
  ${v.chat.map((t, i) => [t, i % 2] as const).map(([t, me], i) => `<div class="bub ${me ? "me" : ""}" id="b${i}" style="${me ? "right:120px" : "left:120px"};top:${780 + i * 140}px">${t}</div>`).join("")}
</div>
<div class="L" id="sceneB">
  <div class="cap" style="top:440px;font-size:96px">${slow[0]}<br><span style="color:#C1481F">${slow[1]}</span></div>
  <div id="bbird" style="position:absolute;left:240px;top:960px">${fly("magpie", 7, 600)}</div>
</div>
<div class="L" id="sceneD">
  <div class="cap" style="top:220px;font-size:88px">도착하면<br><span style="color:#C1481F">두루마리처럼 펼쳐져요</span></div>
  <div class="rod" style="top:600px"></div>
  <div class="paper" id="paper" style="top:626px;height:0">
    <div style="height:60px"></div>
    ${v.lines.map((t, i) => `<div class="ln" id="l${i}">${t}</div>`).join("\n    ")}
  </div>
  <div class="rod" id="rod2" style="top:600px"></div>
  <div id="pola" style="position:absolute;right:110px;top:1260px;width:330px;background:#fff;padding:20px 20px 80px;box-shadow:0 16px 34px rgba(42,33,24,.25);transform:rotate(6deg)">
    <div id="polaImg" style="height:290px;background:linear-gradient(#9CC7E0,#E9D7B5 70%,#C9A27A)"></div></div>
  <div id="dbird" style="position:absolute;left:120px;top:1300px;transform:rotate(-6deg)">${bird(v.bird, 300, true)}</div>
</div>
<div class="L" id="sceneE" style="background:#FBF3E4">
  <div style="position:absolute;left:0;right:0;top:0;height:26px;display:flex"><i style="flex:1;background:#C1481F"></i><i style="flex:1;background:#E0A83C"></i><i style="flex:1;background:#1B6E5C"></i><i style="flex:1;background:#1E3A5C"></i></div>
  <div id="ebird" style="position:absolute;left:240px;top:250px">${fly("magpie", 8, 600)}</div>
  <div class="cap" style="top:860px;font-size:150px;letter-spacing:-4px">새 편지</div>
  <div class="cap" style="top:1060px;font-size:60px;font-weight:700;color:#C1481F">기다림이 즐거운 편지</div>
  <div style="position:absolute;left:0;right:0;top:1250px;text-align:center"><span class="pill" id="pill">${STORE_PILL}</span>
    ${STORE_SUB ? `<div style="font-size:40px;font-weight:600;opacity:.65;margin-top:34px">${STORE_SUB}</div>` : ""}</div>
</div>
<script>
const PTS = ${JSON.stringify(pts.map((p) => [Math.round(p.x), Math.round(p.y), Math.round(p.angle)]))};
const TOTAL = ${FLY_MIN};
const $ = (id) => document.getElementById(id);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const k = (t, a, b) => clamp((t - a) / (b - a));           // a~b 사이 진행(0~1)
const ease = (x) => x < .5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2;
const back = (x) => { const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
const show = (el, o) => { el.style.opacity = o; el.style.visibility = o <= 0.001 ? "hidden" : "visible"; };
const trail = $("trail"), LEN = trail.getTotalLength(); trail.style.strokeDasharray = LEN;
const fmt = (m) => { m = Math.max(0, Math.round(m)); const d = Math.floor(m / 1440), h = Math.floor(m % 1440 / 60), mm = m % 60; return (d ? d + "일 " : "") + (h || d ? h + "시간 " : "") + mm + "분"; };
const SVGS = [...document.querySelectorAll("svg")].filter((s) => !s.parentElement.closest("svg"));
SVGS.forEach((s) => s.pauseAnimations && s.pauseAnimations());
window.render = (t) => {
  SVGS.forEach((s) => s.setCurrentTime && s.setCurrentTime(t)); // 날갯짓도 프레임 시각에 맞춰요
  // ① 0~2.6초: 너무 빠른 답장
  show($("navy"), 1 - k(t, 2.4, 2.9));
  show($("sceneA"), 1 - k(t, 2.4, 2.8));
  for (let i = 0; i < 6; i++) { const s = back(k(t, 0.15 + i * 0.25, 0.35 + i * 0.25)); const el = $("b" + i); el.style.transform = "scale(" + s + ")"; el.style.opacity = k(t, 0.15 + i * 0.25, 0.2 + i * 0.25); }
  // ② 2.6~4.4초: 천천히 오는 소식
  const bIn = k(t, 2.6, 3.0), bOut = k(t, 4.1, 4.5);
  show($("sceneB"), bIn * (1 - bOut));
  $("bbird").style.transform = "translate(" + (1 - ease(k(t, 2.7, 3.6))) * 700 + "px," + Math.sin(t * 6) * 14 + "px)";
  // ③ 4.4~9.2초: 지도 위를 날아가는 새(시간을 빨리 감아서)
  const mIn = k(t, 4.2, 4.6), mOut = k(t, 9.0, 9.4);
  show($("mapL"), mIn * (1 - mOut));
  const p = ease(k(t, 4.6, 8.6));
  const q = PTS[Math.round(p * 100)];
  const tl = q[2] > 90 || q[2] < -90 ? -(q[2] > 0 ? 180 - q[2] : -180 - q[2]) : q[2]; // 왼쪽을 볼 땐 뒤집힌 만큼 반대로 기울여요
  $("mbird").setAttribute("transform", "translate(" + q[0] + " " + (q[1] - 40 + Math.sin(t * 6) * 8) + ") rotate(" + Math.max(-20, Math.min(20, tl * 0.35)) + ")");
  trail.style.strokeDashoffset = LEN * (1 - p);
  $("barC").style.width = (p * 100).toFixed(1) + "%";
  $("whereC").textContent = p >= 1 ? "도착했어요! 💌" : p > 0.82 ? "곧 도착해요" : p > 0.42 ? ${JSON.stringify(v.mid)} : "출발했어요";
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
}

// 소리(2026-10-22 대표님: "음악을 좀 더 흥미롭게 새 느낌으로"): 통통 튀는 마림바·실로폰 멜로디 + 피치카토 베이스 + 쉐이커,
// 사이사이 짹짹·날갯짓, 끝은 종소리. 모두 코드로 만든 소리(44.1kHz 모노 WAV)라 저작권 걱정이 없어요
function makeAudio(path: string) {
  const SR = 44100, N = SR * DUR, a = new Float32Array(N);
  const add = (t0: number, len: number, f: (x: number, i: number) => number) => { const s = Math.floor(t0 * SR); for (let i = 0; i < len * SR && s + i < N; i++) if (s + i >= 0) a[s + i] += f(i / SR, i); };
  let seed = 7; const noise = () => ((seed = (seed * 16807) % 2147483647) / 2147483647) * 2 - 1;
  const hz = (m: number) => 440 * Math.pow(2, (m - 69) / 12); // 미디 번호 → 주파수
  // 마림바(나무 소리): 기음 + 4배음이 빨리 사라짐
  const marimba = (t0: number, m: number, vol: number, len = 0.5) => { const f = hz(m);
    add(t0, len, (x) => vol * (Math.sin(2 * Math.PI * f * x) * Math.exp(-x * 7) + 0.35 * Math.sin(2 * Math.PI * f * 4 * x) * Math.exp(-x * 30)) * Math.min(1, x * 400)); };
  // 실로폰(유리 같은 반짝임)
  const glock = (t0: number, m: number, vol: number) => { const f = hz(m);
    add(t0, 0.7, (x) => vol * (Math.sin(2 * Math.PI * f * x) + 0.4 * Math.sin(2 * Math.PI * f * 2.76 * x) * Math.exp(-x * 8)) * Math.exp(-x * 5) * Math.min(1, x * 600)); };
  // 피치카토 베이스(통통)
  const pluck = (t0: number, m: number, vol: number) => { const f = hz(m);
    add(t0, 0.35, (x) => vol * (Math.sin(2 * Math.PI * f * x) + 0.3 * Math.sin(2 * Math.PI * f * 2 * x)) * Math.exp(-x * 11) * Math.min(1, x * 300)); };
  // 쉐이커(사각사각): 높은 소리만 남긴 잡음
  const shaker = (t0: number, vol: number) => { let prev = 0; add(t0, 0.06, (x) => { const n = noise(), h = n - prev; prev = n; return vol * h * Math.exp(-x * 70); }); };
  // 짹짹: 위로 휙 올라가는 짧은 휘파람
  const chirp = (t0: number, base: number, vol: number) => { let ph = 0;
    add(t0, 0.07, (x) => { ph += 2 * Math.PI * (base + 30000 * x + 600 * Math.sin(x * 400)) / SR; return vol * Math.sin(ph) * Math.sin(Math.PI * x / 0.07); }); };
  const tweet = (t0: number, n: number, vol = 0.16) => { for (let i = 0; i < n; i++) chirp(t0 + i * 0.1, 2700 + (i % 2) * 500, vol); };
  const flap = (t0: number, n: number, vol = 0.3) => { for (let i = 0; i < n; i++) add(t0 + i * 0.12, 0.07, (x) => vol * noise() * Math.exp(-x * 45) * (0.6 + 0.4 * Math.sin(x * 900))); };

  // ① 0~2.6초 너무 빠른 답장: 메신저 톡톡(조금 딱딱하게) + 낮은 콩콩
  for (let i = 0; i < 6; i++) add(0.15 + i * 0.25, 0.06, (x) => 0.3 * Math.sin(2 * Math.PI * (900 + i * 40) * x) * Math.exp(-x * 60));
  for (let i = 0; i < 5; i++) pluck(0.2 + i * 0.5, 45, 0.18);
  add(2.45, 0.5, (x) => 0.16 * noise() * Math.sin(Math.PI * x / 0.5)); // 휙

  // ②~④ 2.6~12.4초: 새 노래. 박자 0.25초(120 BPM 8분음표), 다장조 C–Am–F–G 한 마디 1초
  const T0 = 2.6, STEP = 0.25, BARS = 10;
  const chords = [[48, 60, 64, 67], [45, 57, 60, 64], [41, 57, 60, 65], [43, 55, 59, 62]];
  // 멜로디(8분음표 4개 = 한 마디): 새가 통통 뛰는 것처럼 오르내려요. 0은 쉼
  const mel = [
    [72, 76, 79, 76], [81, 79, 76, 0], [77, 81, 84, 81], [79, 0, 74, 76],
    [72, 76, 79, 84], [81, 79, 76, 79], [77, 76, 74, 72], [74, 79, 0, 79],
    [84, 83, 81, 79], [77, 79, 84, 0],
  ];
  for (let b = 0; b < BARS; b++) {
    const t = T0 + b * 1.0, ch = chords[b % 4];
    pluck(t, ch[0], 0.32); pluck(t + 0.5, ch[0] + 7, 0.22);                 // 베이스 통·통
    for (let s2 = 0; s2 < 4; s2++) shaker(t + s2 * STEP, s2 % 2 ? 0.05 : 0.08); // 사각사각
    marimba(t + 0.25, ch[1], 0.07, 0.35); marimba(t + 0.25, ch[2], 0.07, 0.35); // 뒷박 화음(쿵짝의 짝)
    marimba(t + 0.75, ch[2], 0.06, 0.35); marimba(t + 0.75, ch[3], 0.06, 0.35);
    mel[b].forEach((m, k2) => { if (m) { marimba(t + k2 * STEP, m, 0.2); if (b >= 2) glock(t + k2 * STEP, m + 12, 0.035); } });
  }
  // 새 소리 장식: ② 까치가 들어올 때, ③ 출발 푸드덕·날아가는 동안 짹짹, 도착 짹짹짹
  tweet(2.75, 2, 0.14); tweet(3.6, 3, 0.12);
  flap(4.5, 4); tweet(5.0, 3);
  tweet(6.3, 2, 0.1); flap(7.0, 2, 0.18); tweet(7.6, 2, 0.1);
  tweet(8.6, 4, 0.18);
  // ④ 종이 펼치는 사르르 + 반짝(폴라로이드)
  add(9.5, 1.1, (x) => 0.1 * noise() * (0.5 + 0.5 * Math.sin(x * 60)) * Math.sin(Math.PI * x / 1.1));
  [84, 88, 91, 96].forEach((m, i) => glock(11.1 + i * 0.12, m, 0.06));
  // ⑤ 12.4~15초: 마지막 화음 + 종소리 + 짹
  [48, 60, 64, 67, 72].forEach((m) => marimba(12.6, m, 0.12, 2.2));
  add(12.45, 2.4, (x) => 0.24 * (Math.sin(2 * Math.PI * 880 * x) + 0.5 * Math.sin(2 * Math.PI * 1320 * x)) * Math.exp(-x * 2.2));
  tweet(13.3, 2, 0.14);
  // 끝에서 부드럽게 줄이고, 너무 크면 눌러 줘요
  for (let i = 0; i < N; i++) { const t = i / SR; a[i] = Math.tanh(a[i] * 1.2 * Math.min(1, (DUR - t) / 0.8)); }
  const buf = Buffer.alloc(44 + N * 2);
  buf.write("RIFF", 0); buf.writeUInt32LE(36 + N * 2, 4); buf.write("WAVEfmt ", 8); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(SR, 24); buf.writeUInt32LE(SR * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34); buf.write("data", 36); buf.writeUInt32LE(N * 2, 40);
  for (let i = 0; i < N; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, a[i])) * 32000), 44 + i * 2);
  writeFileSync(path, buf);
}

const out = resolve(root, "promo/video"), tmp = resolve(root, "promo/video/.frames");
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
for (const key of (pick ? [pick] : Object.keys(VARIANTS)) as VKey[]) {
  const v = VARIANTS[key];
  rmSync(tmp, { recursive: true, force: true }); mkdirSync(tmp, { recursive: true });
  writeFileSync(resolve(tmp, "index.html"), htmlFor(v), "utf8");
  const page = await (await browser.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage();
  await page.goto("file://" + resolve(tmp, "index.html"));
  await page.evaluate(() => document.fonts.ready);
  for (let f = 0; f < FPS * DUR; f++) {
    await page.evaluate((t) => (window as any).render(t), f / FPS);
    await page.screenshot({ path: resolve(tmp, `f${String(f).padStart(4, "0")}.jpg`), type: "jpeg", quality: 92 });
    if (f % 90 === 0) console.log(`${key} ${(f / FPS).toFixed(0)}초`);
  }
  await page.evaluate((t) => (window as any).render(t), 14.2);
  await page.screenshot({ path: resolve(out, `${v.file}-cover.png`) });
  await page.close();
  makeAudio(resolve(tmp, "audio.wav"));
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-framerate", String(FPS), "-i", resolve(tmp, "f%04d.jpg"), "-i", resolve(tmp, "audio.wav"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-preset", "medium", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", "-shortest",
    resolve(out, `${v.file}.mp4`)]);
  console.log(`promo/video/${v.file}.mp4`);
}
await browser.close();
rmSync(tmp, { recursive: true, force: true });
