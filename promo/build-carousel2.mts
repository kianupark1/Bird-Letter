/**
 * 넘겨 보는 글 2차(3편 × 8장) + 같은 장면으로 만든 릴스: npx tsx promo/build-carousel2.mts
 * 2026-11-11 대표님: "더 업그레이드해 줘, 영상도 있으면 좋고, 이것들 참고해서 다시"
 * 참고: 첫 장은 불편부터(질문) → 누가·언제 → 쓰기 전·후 → 실제 화면에 주황 번호 → 저장해 두고 그날 보내기
 * 첫 장에 "안드로이드 곧" 띠 없음(광고처럼 보여서), 안드로이드 문구는 마지막 장에만 작게.
 * 결과: promo/cards/c2-<편>-1~8.png·.jpg, promo/video/c2-<편>.mp4(9:16 릴스)·-cover.png
 */
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
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
const mins = (b: string, r: string) => formatMinutes(travelMinutes(getBird(b), getRoute(r).km));
const shot = (f: string) => "file://" + resolve(root, "promo/store", f);
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const DAHONG = "#C1481F", ORANGE = "#E8683F", INK = "#1E1A17", GRAY = "#6B635B", BG = "#F3F1EE", HANJI = "#FBF3E4";
const N = 8;

const BASE = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 100%; height: 100%; }
body { font-family: P, sans-serif; color: ${INK}; background: ${BG}; position: relative; overflow: hidden; letter-spacing: -0.6px; }
svg { overflow: visible; display: block; }
.num { display: inline-block; padding: 10px 24px; border-radius: 999px; background: ${ORANGE}; color: #fff; font-size: 32px; font-weight: 800; }
h1 { font-size: 70px; font-weight: 900; line-height: 1.22; letter-spacing: -2.5px; margin-top: 22px; word-break: keep-all; }
h1 em { font-style: normal; color: ${DAHONG}; }
.body { font-size: 34px; line-height: 1.6; color: ${GRAY}; margin-top: 22px; word-break: keep-all; }
.body b { color: ${INK}; }
.top { position: absolute; left: 72px; right: 72px; top: 80px; }
.count { position: absolute; right: 52px; top: 52px; padding: 8px 20px; border-radius: 999px; background: rgba(30,26,23,.08); color: ${GRAY}; font-size: 26px; font-weight: 700; }
.brand { position: absolute; right: 64px; bottom: 48px; display: flex; align-items: center; gap: 10px; font-size: 30px; font-weight: 900; }
.swipe { position: absolute; left: 72px; bottom: 56px; font-size: 27px; font-weight: 700; color: ${GRAY}; }
.phone { position: absolute; left: 50%; transform: translateX(-50%); width: 560px; border-radius: 48px; overflow: hidden; border: 10px solid #1E1A17; background: #fff; box-shadow: 0 30px 60px rgba(40,20,5,.22); }
.phone img { width: 100%; display: block; }
.tag { position: absolute; padding: 16px 26px; border-radius: 22px; background: #fff; font-size: 32px; font-weight: 800; box-shadow: 0 14px 30px rgba(40,20,5,.2); white-space: nowrap; }
.tag i { font-style: normal; color: ${ORANGE}; margin-right: 8px; }
.card { background: #fff; border-radius: 28px; padding: 30px 34px; display: flex; gap: 26px; align-items: center; margin-bottom: 20px; box-shadow: 0 2px 0 rgba(0,0,0,.03); }
.card .em { font-size: 64px; width: 84px; text-align: center; }
.card b { display: block; font-size: 38px; font-weight: 900; }
.card span { display: block; font-size: 30px; color: ${GRAY}; margin-top: 6px; word-break: keep-all; }
.col { flex: 1; border-radius: 30px; padding: 34px 30px; }
.col h3 { font-size: 30px; font-weight: 900; letter-spacing: 2px; }
.bub { margin-top: 22px; padding: 24px 28px; border-radius: 24px; font-size: 36px; font-weight: 700; line-height: 1.45; word-break: keep-all; }
.note { margin-top: 22px; font-size: 31px; color: ${GRAY}; line-height: 1.5; word-break: keep-all; }
`;
const brand = `<div class="brand">${bird("magpie", 46, true)}새 편지</div>`;
const count = (i: number) => `<div class="count">${i}/${N}</div>`;
const swipe = (i: number) => (i < N ? `<div class="swipe">넘겨 보세요 →</div>` : "");
const head = (n: string, h: string, b = "") => `<div class="top"><span class="num">${n}</span><h1>${h}</h1>${b ? `<p class="body">${b}</p>` : ""}</div>`;
// 폰 화면을 아래쪽에 크게(위에서 top px부터, 화면 아래로 잘림)
const phone = (f: string, top: number, shift = 0, tags = "") =>
  `<div class="phone" style="top:${top}px"><img src="${shot(f)}" style="margin-top:-${shift}px"></div>${tags}`;

type Theme = {
  key: string; bird: string; route: string; to: string; place: string;
  hook: [string, string]; hookSub: string;
  before: string; after: string;
  letter: string[]; occasion: string; tagAt: string;
};
const THEMES: Theme[] = [
  {
    key: "mom", bird: "pigeon", route: "seoul-busan", to: "엄마", place: "부산",
    hook: ["엄마한테 ‘사랑해’,", "카톡으로 보내기 <em>어색하죠?</em>"],
    hookSub: "하고 싶은 말은 많은데,<br>막상 쓰면 ‘밥은 먹었어?’로 끝나요",
    before: "엄마 사랑해 ㅎㅎ", after: "엄마, 요즘 자꾸 엄마 밥 생각이 나요.",
    letter: ["엄마, 요즘 자꾸", "엄마 밥 생각이 나요.", "이번 주말엔 꼭 내려갈게요.", "늘 고마워요. 사랑해요."],
    occasion: "엄마 생일", tagAt: "대전 근처를 지나요",
  },
  {
    key: "love", bird: "hawk", route: "seoul-gyeongju", to: "너", place: "경주",
    hook: ["‘보고 싶어’ 한마디,", "1초 만에 가면 <em>너무 가볍죠?</em>"],
    hookSub: "멀리 있는 사람에게<br>조금 더 마음을 담아 보내고 싶을 때",
    before: "보고싶다", after: "오늘 하늘 보다가 네 생각이 났어.",
    letter: ["오늘 하늘 보다가", "네 생각이 났어.", "이 편지가 도착할 때쯤", "나도 너한테 가는 중일 거야."],
    occasion: "기념일", tagAt: "대구 근처를 지나요",
  },
  {
    key: "friend", bird: "magpie", route: "seoul-jeju", to: "친구", place: "제주",
    hook: ["연락 끊긴 친구에게", "먼저 카톡하기, <em>민망하죠?</em>"],
    hookSub: "‘잘 지내?’ 한 줄 보내 놓고<br>읽씹당할까 봐 지우게 될 때",
    before: "잘 지내..?", after: "문득 우리 학교 앞 떡볶이가 생각났어.",
    letter: ["문득 우리 학교 앞", "떡볶이가 생각났어.", "잘 지내지?", "제주 가면 꼭 연락할게."],
    occasion: "친구 생일", tagAt: "남해 상공을 지나요",
  },
];

function slides(t: Theme): string[] {
  const time = mins(t.bird, t.route);
  const bname = getBird(t.bird).name;
  return [
    // 1 불편부터(질문) — 띠 없음
    `<div style="position:absolute;inset:0;background:${HANJI}"></div>
     <div style="position:absolute;left:72px;right:72px;top:150px">
       <div style="font-size:38px;font-weight:800;color:${DAHONG}">이런 적 있죠?</div>
       <h1 style="font-size:96px;line-height:1.18;letter-spacing:-4px;margin-top:30px">${t.hook[0]}<br>${t.hook[1]}</h1>
       <p class="body" style="font-size:40px;margin-top:40px">${t.hookSub}</p></div>
     <div style="position:absolute;right:70px;top:880px;transform:rotate(-6deg)">${bird(t.bird, 290, true)}</div>
     <div class="tag" style="left:72px;top:1000px;transform:rotate(-3deg)"><i>💌</i>그 말, 새가 대신 전해 줄게요</div>
     ${count(1)}<div class="swipe">어떻게냐면 →</div>`,
    // 2 누가·언제
    `${head("01 누가 · 언제 쓰면 좋을까?", `말로 하기 어려운 마음,<br><em>이럴 때</em> 써요`)}
     <div style="position:absolute;left:64px;right:64px;top:480px">
       <div class="card"><div class="em">👩‍👧</div><div><b>멀리 사는 부모님께</b><span>전화로는 쑥스러운 ‘고마워요’</span></div></div>
       <div class="card"><div class="em">💑</div><div><b>장거리 연인에게</b><span>기념일 아침에 딱 맞춰 도착하게</span></div></div>
       <div class="card"><div class="em">🤝</div><div><b>오랜만인 친구에게</b><span>먼저 연락하기 민망할 때 한 통</span></div></div>
       <div class="card"><div class="em">🎂</div><div><b>생일 · 응원 · 사과</b><span>카톡 한 줄로는 가벼운 날</span></div></div></div>
     ${count(2)}${swipe(2)}${brand}`,
    // 3 쓰기 전·후
    `${head("02 쓰기 전 · 후", `같은 마음인데<br>전해지는 게 <em>달라요</em>`)}
     <div style="position:absolute;left:64px;right:64px;top:470px;display:flex;gap:24px">
       <div class="col" style="background:#E9E6E2"><h3 style="color:#8A827A">BEFORE · 카톡</h3>
         <div class="bub" style="background:#FEE500">${t.before}</div>
         <div class="note">1초 만에 도착<br>‘1’ 사라지면 끝<br>…답장 기다리며 초조</div></div>
       <div class="col" style="background:#FFF1EA;border:4px solid ${ORANGE}"><h3 style="color:${ORANGE}">AFTER · 새 편지</h3>
         <div class="bub" style="background:#fff">${t.after}</div>
         <div class="note" style="color:${INK}">${bname}가 ${t.place}까지<br><b>${time}</b> 날아가요<br>도착하면 편지지로 펼쳐져요</div></div></div>
     <div style="position:absolute;left:72px;right:72px;top:1120px;font-size:34px;font-weight:800;text-align:center;color:${DAHONG}">빨리 보내는 대신, 천천히 <u style="text-underline-offset:8px">마음을</u> 보내요</div>
     ${count(3)}${swipe(3)}${brand}`,
    // 4 같이 기다리는 지도(실제 화면)
    `${head("03 같이 기다려요", `지금 <em>어디쯤</em> 날고 있는지<br>둘 다 보여요`)}
     ${phone("ios-4-map.png", 470, 120, `<div class="tag" style="left:70px;top:820px"><i>📍</i>지금 낙화암 근처</div><div class="tag" style="right:60px;top:1060px"><i>⏱</i>남은 시간 1초마다</div>`)}
     ${count(4)}<div class="tag" style="left:70px;bottom:40px;font-size:26px;padding:10px 18px;opacity:.85">실제 앱 화면 · 서울 → 제주</div>`,
    // 5 도착하면 두루마리
    `${head("04 도착하면", `돌돌 말린 <em>편지지</em>가<br>스르륵 펼쳐져요`)}
     <div style="position:absolute;left:150px;right:150px;top:500px;height:640px;background:${HANJI};border-radius:12px;box-shadow:0 24px 50px rgba(60,30,10,.18);padding:70px 64px;transform:rotate(-1.5deg)">
       <div style="position:absolute;left:-26px;right:-26px;top:-26px;height:52px;border-radius:26px;background:linear-gradient(#D9C4A0,#B89A6C)"></div>
       <div style="position:absolute;left:-26px;right:-26px;bottom:-26px;height:52px;border-radius:26px;background:linear-gradient(#D9C4A0,#B89A6C)"></div>
       <div style="font-size:32px;color:${GRAY};font-weight:700">${t.to}에게</div>
       <div style="font-size:40px;line-height:1.85;font-weight:700;margin-top:20px;background:repeating-linear-gradient(transparent 0 72px,rgba(193,72,31,.18) 72px 74px)">${t.letter.join("<br>")}</div>
       <div style="position:absolute;right:56px;bottom:56px;width:86px;height:86px;border:5px solid ${DAHONG};border-radius:12px;color:${DAHONG};font-size:30px;font-weight:900;display:grid;place-items:center;transform:rotate(8deg)">새편지</div></div>
     <div style="position:absolute;left:72px;right:72px;top:1170px;font-size:31px;color:${GRAY};text-align:center">사진은 폴라로이드로 서서히 선명해져요</div>
     ${count(5)}${swipe(5)}${brand}`,
    // 6 시작은 쉬워요
    `${head("05 시작은 버튼 한 번", `가입도, 초대도<br><em>한 번</em>이면 끝`)}
     <div style="position:absolute;left:64px;right:64px;top:480px">
       <div class="card" style="background:#FEE500"><div class="em">💬</div><div><b>카카오로 가입하기</b><span style="color:#3A3200">아이디·비밀번호 만들 필요 없어요</span></div></div>
       <div class="card"><div class="em">✉️</div><div><b>이름 쓰고, 새 고르고, 날리기</b><span>메신저처럼 채팅창에서 바로</span></div></div>
       <div class="card"><div class="em">🔗</div><div><b>받는 사람은 링크만 누르면</b><span>앱 없어도 날아오는 모습·편지를 봐요</span></div></div>
       <div class="card" style="background:#FFF1EA;border:3px solid ${ORANGE}"><div class="em">🕊</div><div><b style="color:${DAHONG}">무료예요</b><span>새 3종 모두 그냥 쓰면 돼요</span></div></div></div>
     ${count(6)}${swipe(6)}${brand}`,
    // 7 만든 이유
    `${head("06 왜 이런 걸 만들었냐면", `모든 게 너무 빨라진 요즘,<br><em>기다리는 설렘</em>을 다시`, "주문하면 바로 오고, 메시지는 1초면 가는 시대.<br>답장을 기다리며 우체통을 열어 보던 그 마음을<br><b>작은 1인 회사가 되살리고 싶었어요.</b>")}
     <div style="position:absolute;left:0;right:0;top:820px;display:flex;justify-content:center;gap:50px">${bird("hawk", 180, true)}${bird("pigeon", 180, true)}${bird("magpie", 180, true)}</div>
     <div style="position:absolute;left:72px;right:72px;top:1060px;text-align:center;font-size:30px;color:${GRAY}">매 · 비둘기 · 까치 — 실제 새의 비행 속도를 바탕으로 날아가요</div>
     ${count(7)}${swipe(7)}${brand}`,
    // 8 저장 + 행동
    `<div style="position:absolute;inset:0;background:${INK}"></div>
     <div style="position:absolute;left:72px;right:72px;top:120px;color:#fff;text-align:center">
       <div style="display:flex;justify-content:center">${bird(t.bird, 230, true)}</div>
       <h1 style="font-size:78px;margin-top:34px">📌 저장해 두고<br><span style="color:#F0BC5C">${t.occasion}</span>에 보내 보세요</h1>
       <div style="margin:56px auto 0;display:inline-block;background:#fff;color:${INK};padding:26px 44px;border-radius:30px;font-size:44px;font-weight:900">앱스토어에서 ‘새 편지’ · 무료</div>
       <div style="margin-top:20px;font-size:30px;font-weight:700;opacity:.8">링크는 프로필에 · 안드로이드는 곧</div>
       <div style="display:flex;justify-content:center;gap:56px;margin-top:64px;font-size:30px;font-weight:700;opacity:.92">
         <div><span style="font-size:60px">🔖</span><br>저장</div><div><span style="font-size:60px">📤</span><br>${t.to === "너" ? "그 사람에게 공유" : t.to + "에게 공유"}</div><div><span style="font-size:60px">❤️</span><br>좋아요</div></div>
       <div style="font-size:36px;color:#F0BC5C;margin-top:64px;font-weight:800">${SLOGAN}</div></div>
     <div class="count" style="background:rgba(255,255,255,.14);color:#fff">${N}/${N}</div>`,
  ];
}

mkdirSync(resolve(root, "promo/cards-src"), { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox", "--allow-file-access-from-files"] });
const only = process.argv[2];
for (const t of THEMES.filter((x) => !only || x.key === only)) {
  const files: string[] = [];
  for (const [i, html] of slides(t).entries()) {
    const file = `c2-${t.key}-${i + 1}`;
    const htmlPath = resolve(root, `promo/cards-src/${file}.html`);
    writeFileSync(htmlPath, `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${BASE}</style></head><body>${html}</body></html>`, "utf8");
    const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
    const p = await ctx.newPage();
    await p.goto("file://" + htmlPath);
    await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
    const png = resolve(root, `promo/cards/${file}.png`);
    await p.screenshot({ path: png });
    execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
    await ctx.close();
    files.push(png);
  }
  console.log("cards", t.key);
  // 릴스: 같은 8장을 2.4초씩, 0.4초 겹쳐 넘김, 위아래 한지색 여백(9:16), 우리 영상의 새 노래
  const D = 2.4, X = 0.4;
  const inputs = files.flatMap((f) => ["-loop", "1", "-t", String(D), "-i", f]);
  const music = resolve(root, "promo/video/saepyeonji-15s.mp4");
  const pre = files.map((_, i) => `[${i}:v]scale=1080:1350,pad=1080:1920:0:285:color=0xF3F1EE,setsar=1,fps=30,format=yuv420p[v${i}]`);
  let last = "v0", off = 0;
  const xf: string[] = [];
  for (let i = 1; i < files.length; i++) {
    off += D - X;
    xf.push(`[${last}][v${i}]xfade=transition=slideleft:duration=${X}:offset=${off.toFixed(2)}[x${i}]`);
    last = `x${i}`;
  }
  const total = D * files.length - X * (files.length - 1);
  const out = resolve(root, `promo/video/c2-${t.key}.mp4`);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", ...inputs, "-i", music,
    "-filter_complex", [...pre, ...xf, `[${files.length}:a]apad,atrim=0:${total},afade=t=out:st=${total - 1.5}:d=1.5[a]`].join(";"),
    "-map", `[${last}]`, "-map", "[a]", "-c:v", "libx264", "-preset", "medium", "-crf", "21", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-t", String(total), out]);
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", files[0], "-vf", "pad=1080:1920:0:285:color=0xF3F1EE", out.replace(/\.mp4$/, "-cover.png")]);
  console.log("reel", t.key, existsSync(out));
}
await browser.close();
