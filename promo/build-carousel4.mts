/**
 * 넘겨 보는 글 4차(펜팔 8장): npx tsx promo/build-carousel4.mts
 * 2026-11-12 대표님: "이번 광고는 새 편지로 새 친구를 만난다는 것을 강조해줘" — 3차와 같은 정보형 틀.
 * 법무 선: "펜팔 친구"로 묶어 말하고 연애·소개팅·랜덤 만남은 쓰지 않음, 만 14세 이상 표시.
 * (아래는 3차 설명)
 * 넘겨 보는 글 3차(정보형 8장): npx tsx promo/build-carousel3.mts
 * 2026-11-11 대표님: "광고 올리자, 지금까지 올린 게 잘 안 됐어, 이거(디자인 정보형 카드뉴스) 감안해서 다시"
 * 참고 글의 형식: 흰 바탕 · 번호 달린 연한 색 제목 띠 · 회색 판 위 실제 화면 · 아래 설명 몇 줄 + 굵은 한 줄 · "저장해 두고 꺼내 보세요".
 * 광고 티를 빼고 "보는 사람에게 쓸모 있는 정보(저장·공유할 이유)"를 먼저, 만든 사람 1인칭 이야기로.
 * 결과: promo/cards/c3-<편>-1~8.png·.jpg
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
const { SLOGAN } = await import("./store.mts");
const { chromium } = (() => { try { return req("playwright"); } catch { return req("/opt/node-tools/node_modules/playwright"); } })();

const root = resolve(import.meta.dirname, "..");
const bird = (id: string, size: number, letter = false) => renderToStaticMarkup(React.createElement(BirdIcon as any, { id, size, letter }));
const shot = (f: string) => "file://" + resolve(root, "promo/store", f);
const icon = "file://" + resolve(root, "promo/store/play-icon-512.png");
const FONT = "file://" + resolve(root, "src/app/fonts/PretendardSub.woff2");
const N = 8;
const C = { lime: "#EEF6C9", peach: "#FCE6D8", lav: "#E8E3FA", sky: "#E0ECFB", yellow: "#FBF2C6", mint: "#DDF2EA" };

const CSS = `@font-face { font-family: P; src: url(${FONT}); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; } html, body { width: 1080px; height: 1350px; }
body { font-family: P, sans-serif; color: #17171A; background: #fff; position: relative; overflow: hidden; letter-spacing: -0.8px; word-break: keep-all; }
svg { overflow: visible; display: block; }
.bar { position: absolute; left: 88px; right: 88px; top: 72px; border: 2px solid #17171A; padding: 22px 30px; font-size: 52px; font-weight: 800; line-height: 1.25; letter-spacing: -1.6px; }
.count { position: absolute; right: 44px; top: 66px; width: 100px; height: 64px; border-radius: 32px; background: #6E6E73; color: #fff; font-size: 27px; font-weight: 700; display: flex; align-items: center; justify-content: center; }
.panel { position: absolute; left: 88px; right: 88px; top: 210px; height: 590px; background: #F4F4F6; border: 1px solid #ECECEF; display: flex; align-items: center; justify-content: center; gap: 36px; }
.ph { width: 236px; height: 520px; border-radius: 30px; overflow: hidden; border: 2px solid #E2E2E6; background: #fff; box-shadow: 0 6px 18px rgba(0,0,0,.06); position: relative; }
.ph img { width: 100%; display: block; }
.ph.big { width: 270px; height: 540px; }
.cap { position: absolute; left: 50%; transform: translateX(-50%); bottom: 22px; padding: 10px 22px; border-radius: 999px; background: #17171A; color: #fff; font-size: 24px; font-weight: 700; white-space: nowrap; }
.pill { padding: 8px 20px; border-radius: 999px; background: #E9E9EC; color: #555; font-size: 24px; font-weight: 600; margin-top: 16px; display: inline-block; }
.txt { position: absolute; left: 100px; right: 100px; top: 850px; font-size: 33px; line-height: 1.62; color: #2A2A2E; }
.txt p + p { margin-top: 30px; }
.txt b { font-weight: 800; color: #111; }
.arrow { font-size: 46px; color: #9A9AA0; }
`;
const page = (i: number, body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}</style></head><body>${body}${i > 1 ? `<div class="count">${i}/${N}</div>` : ""}</body></html>`;
const bar = (t: string, c: string) => `<div class="bar" style="background:${c}">${t}</div>`;
const ph = (f: string, shift = 0, cls = "", cap = "") => `<div style="text-align:center"><div class="ph ${cls}"><img src="${shot(f)}" style="margin-top:-${shift}px"></div>${cap ? `<span class="pill">${cap}</span>` : ""}</div>`;
const txt = (h: string) => `<div class="txt">${h}</div>`;

// 편지지(두루마리 펼친 모습)
const letterPaper = (lines: string[], from: string) => `<div style="width:300px;height:420px;background:#FFF9EC;border-radius:10px;box-shadow:0 8px 20px rgba(80,50,20,.12);position:relative;padding:44px 30px;background-image:repeating-linear-gradient(#FFF9EC 0 43px,#EADBC0 43px 44px);">
  <div style="position:absolute;left:-8px;right:-8px;top:-14px;height:28px;border-radius:14px;background:linear-gradient(#E9D3AA,#D6B985)"></div>
  <div style="position:absolute;left:-8px;right:-8px;bottom:-14px;height:28px;border-radius:14px;background:linear-gradient(#E9D3AA,#D6B985)"></div>
  ${lines.map((l) => `<div style="font-size:23px;line-height:44px;color:#3A2C1E">${l}</div>`).join("")}
  <div style="font-size:21px;color:#8A6E50;text-align:right;margin-top:6px">${from}</div></div>`;
const kakao = (t: string) => `<div style="width:300px;height:420px;background:#B2C7D9;border-radius:10px;padding:30px 22px;display:flex;flex-direction:column;justify-content:flex-end;gap:10px">
  <div style="align-self:flex-end;background:#FEE500;border-radius:16px;padding:14px 18px;font-size:24px">${t}</div>
  <div style="align-self:flex-end;font-size:18px;color:#5A6B7A">1 · 오후 9:12</div>
  <div style="align-self:flex-start;background:#fff;border-radius:16px;padding:14px 18px;font-size:24px">ㅇㅇ 고마워</div></div>`;


// 펜팔 카드(이름 대신 펜팔 이름·도시·관심사)
const ppCard = (birdId: string, name: string, city: string, intro: string, tags: string[]) => `<div style="width:330px;background:#fff;border-radius:26px;box-shadow:0 6px 18px rgba(0,0,0,.07);padding:30px 26px;text-align:center">
  <div style="width:120px;height:120px;border-radius:60px;background:#FBF3E4;margin:0 auto;display:flex;align-items:center;justify-content:center">${bird(birdId, 96)}</div>
  <div style="font-size:32px;font-weight:800;margin-top:16px">${name}</div>
  <div style="font-size:24px;color:#77777D;margin-top:6px">📍 ${city}</div>
  <div style="font-size:23px;color:#3A3A40;margin-top:16px;line-height:1.45">“${intro}”</div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;margin-top:16px">${tags.map((t) => `<span style="padding:6px 14px;border-radius:999px;background:#F1EEE6;font-size:20px">${t}</span>`).join("")}</div></div>`;
const chip = (t: string, on = false) => `<span style="display:inline-block;padding:14px 24px;border-radius:999px;font-size:27px;font-weight:700;margin:7px;${on ? "background:#C1481F;color:#fff" : "background:#fff;border:2px solid #E2E2E6;color:#3A3A40"}">${t}</span>`;

type Slide = string;
const slides: Slide[] = [
  // 1. 표지
  `<div style="position:absolute;left:88px;right:88px;top:120px">
     <div style="display:inline-block;border:2px solid #17171A;background:${C.yellow};padding:12px 22px;font-size:30px;font-weight:800">펜팔, 기억나세요?</div>
     <div style="font-size:88px;font-weight:900;line-height:1.18;letter-spacing:-3px;margin-top:34px">새 편지로<br>새 친구를 만나요</div>
     <div style="font-size:36px;color:#55555B;margin-top:26px;line-height:1.5">모르는 누군가와 천천히 친해지는 법</div>
   </div>
   <div style="position:absolute;left:88px;right:88px;top:660px;height:580px;background:#F4F4F6;border:1px solid #ECECEF;display:flex;align-items:center;justify-content:center;gap:34px">
     ${ppCard("magpie", "부산 사는 까치", "부산", "바다 보이는 동네 이야기 나눠요", ["여행", "음악"])}
     <span class="arrow">✉</span>
     ${ppCard("pigeon", "서울 사는 비둘기", "서울", "퇴근길 노을 좋아해요", ["책", "사진"])}
   </div>
   <div style="position:absolute;right:96px;bottom:40px;font-size:26px;color:#8A8A90">넘겨 보세요 →</div>`,
  // 2. 문제
  `${bar("요즘 새 친구, 어디서 만나세요?", C.lime)}
   <div class="panel" style="gap:40px">
     <div style="width:340px;background:#fff;border-radius:24px;padding:34px 30px;box-shadow:0 4px 14px rgba(0,0,0,.05)">
       <div style="font-size:26px;color:#8A8A90;font-weight:700">빠른 메시지</div>
       ${["팔로우 한 번", "DM 한 줄", "읽씹", "그대로 잊힘"].map((t) => `<div style="font-size:32px;font-weight:700;margin-top:22px">· ${t}</div>`).join("")}
     </div>
     <span class="arrow">→</span>
     <div style="width:340px;background:#FFF9EC;border-radius:24px;padding:34px 30px;box-shadow:0 4px 14px rgba(80,50,20,.08)">
       <div style="font-size:26px;color:#C1481F;font-weight:700">느린 편지</div>
       ${["어딘가로 한 통", "새가 날아가는 동안 설렘", "답장이 오면 펜팔", "한 통씩 쌓이는 이야기"].map((t) => `<div style="font-size:32px;font-weight:700;margin-top:22px">· ${t}</div>`).join("")}
     </div>
   </div>
   ${txt(`<p>요즘은 사람을 만나는 게 너무 빨라요.<br>팔로우하고, 한 줄 보내고, 금방 잊혀요.</p><p>옛날 펜팔은 달랐어요. 편지 한 통에<br>며칠을 기다렸고, 그래서 더 소중했어요.</p><p><b>그 펜팔을 핸드폰으로 다시 만들었어요.</b></p>`)}`,
  // 3. 1
  `${bar("1. 어딘가로 새를 날려 보내요", C.peach)}
   <div class="panel" style="flex-direction:column;gap:18px">
     <div style="font-size:34px;font-weight:800">어디로 날려 보낼까요?</div>
     <div style="width:760px;text-align:center">${chip("🎲 어디든", true)}${["서울", "부산", "제주", "강릉", "전주", "대구", "여수", "춘천"].map((c) => chip(c)).join("")}</div>
     <div style="margin-top:20px">${bird("magpie", 120, true)}</div>
   </div>
   ${txt(`<p>도시를 고르거나 '어디든'을 누르면<br>펜팔을 받겠다고 한 누군가에게 새가 날아가요.</p><p>새가 실제 거리만큼 날아가니까<br>도착할 때까지 누구에게 갈지 두근거려요.</p><p><b>답장이 오면, 그때부터 펜팔 친구예요.</b></p>`)}`,
  // 4. 2
  `${bar("2. 이름 대신 펜팔 이름과 도시만", C.sky)}
   <div class="panel" style="gap:44px">
     ${ppCard("hawk", "제주 사는 매", "제주", "귤밭 옆에서 편지 써요", ["바다", "요리", "산책"])}
     <div style="font-size:30px;line-height:1.9;color:#3A3A40">
       <div>✅ 펜팔 이름 · 도시 · 관심사</div>
       <div>🚫 진짜 이름</div>
       <div>🚫 사진 · 동네</div>
       <div>🚫 전화번호 · 아이디</div>
     </div>
   </div>
   ${txt(`<p>상대에게는 '제주 사는 매'처럼<br>펜팔 이름과 도시까지만 보여요.</p><p>편지에 전화번호나 아이디를 쓰면<br>자동으로 가려져요.</p><p><b>나를 다 드러내지 않아도, 마음은 전할 수 있어요.</b></p>`)}`,
  // 5. 3
  `${bar("3. 한 통씩, 천천히 친해져요", C.lav)}
   <div class="panel" style="gap:46px">
     ${letterPaper(["안녕하세요!", "부산 사는 까치예요.", "오늘 광안리 노을이", "정말 예뻤어요.", "서울은 어땠나요?"], "— 부산에서")}
     ${ph("phone-4-map.png", 0, "big", "편지가 날아오는 중")}
   </div>
   ${txt(`<p>편지는 도착해야 열려요.<br>기다리는 동안 지도에서 새가 날아오는 걸 봐요.</p><p>모르는 사람인데도<br>답장을 기다리는 시간이 즐거워져요.</p><p><b>빨리 친해지지 않아도 괜찮아요. 그게 펜팔이니까요.</b></p>`)}`,
  // 6. 4 안전
  `${bar("4. 싫으면 넘기고, 신고도 바로", C.mint)}
   <div class="panel" style="flex-direction:column;gap:26px">
     <div style="width:700px;background:#fff;border-radius:22px;padding:26px 30px;font-size:27px;color:#55555B;box-shadow:0 4px 14px rgba(0,0,0,.05)">모르는 누군가와의 펜팔이에요. 사진·연락처는 보내지 않아요
       <div style="margin-top:18px">${chip("넘기기")}${chip("🚩 신고·차단")}</div></div>
     <div style="font-size:30px;line-height:1.8;color:#3A3A40;text-align:center">답장하기 싫으면 안 해도 돼요<br>펜팔 받기는 설정에서 언제든 끌 수 있어요</div>
   </div>
   ${txt(`<p>답장은 내가 하고 싶을 때만.<br>불편한 편지는 넘기기, 신고·차단 한 번이면 끝이에요.</p><p>펜팔은 만 14세 이상만 쓸 수 있어요.</p><p><b>편하게 시작하고, 편하게 그만둘 수 있어요.</b></p>`)}`,
  // 7. 정리
  `<div style="position:absolute;left:88px;right:88px;top:84px;font-size:54px;font-weight:900;letter-spacing:-1.8px">이런 분께 추천해요.</div>
   <div style="position:absolute;left:88px;right:88px;top:200px;background:#F4F4F6;border:1px solid #ECECEF;padding:20px 44px">
     ${[["새 친구", "SNS 말고 천천히 친해지고 싶을 때"], ["다른 도시", "다른 동네 사는 사람 이야기가 궁금할 때"], ["손편지 감성", "옛날 펜팔이 그리울 때"], ["혼자인 밤", "누군가의 편지를 기다리고 싶을 때"]].map(([a, b], i) => `<div style="display:flex;padding:30px 0;${i < 3 ? "border-bottom:1px solid #E4E4E8;" : ""}font-size:34px"><span style="width:250px;color:#77777D">${a}</span><b style="font-weight:800">${b}</b></div>`).join("")}
   </div>
   <div class="txt" style="top:780px"><p>오늘 밤, 모르는 누군가에게<br>한 통 날려 보세요.</p><p><b>그 한 통이 새 친구의 시작이 될지도 몰라요.</b></p></div>`,
  // 8. 마무리
  `<div style="position:absolute;left:0;right:0;top:150px;text-align:center">
     <img src="${icon}" style="width:200px;height:200px;border-radius:44px;box-shadow:0 10px 24px rgba(0,0,0,.12)">
     <div style="font-size:72px;font-weight:900;margin-top:34px;letter-spacing:-2.4px">새 편지</div>
     <div style="font-size:38px;color:#C1481F;font-weight:800;margin-top:14px">새 편지로 새 친구를 만나요</div>
     <div style="display:inline-block;margin-top:44px;padding:22px 42px;border-radius:20px;background:#17171A;color:#fff;font-size:36px;font-weight:800">앱스토어에서 '새 편지' 검색 · 무료</div>
     <div style="font-size:28px;color:#8A8A90;margin-top:22px">링크는 프로필에 있어요 · 안드로이드는 곧 · 펜팔은 만 14세 이상</div>
     <div style="font-size:40px;font-weight:800;margin-top:64px">${SLOGAN}</div>
   </div>
   <div style="position:absolute;left:100px;right:100px;bottom:90px;display:flex;align-items:center;gap:22px">
     <span style="flex:1;font-size:30px;color:#77777D">@saepyeonji</span>
     <span style="padding:18px 34px;border-radius:18px;background:#5B8DEF;color:#fff;font-size:32px;font-weight:800;box-shadow:0 5px 0 #3E6FD0">팔로우 +</span>
     <span style="width:76px;height:76px;border-radius:38px;border:2px solid #D8D8DC;display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 4px 0 #E2E2E6">🔖</span>
     <span style="width:76px;height:76px;border-radius:38px;border:2px solid #D8D8DC;display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 4px 0 #E2E2E6">♡</span>
   </div>`,
];

const KEY = "penpal";
const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c4");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `${KEY}-${i + 1}.html`);
  writeFileSync(html, page(i + 1, slides[i]));
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c4-${KEY}-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c4", KEY, i + 1);
}
await browser.close();
