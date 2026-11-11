/**
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

type Slide = string;
const slides: Slide[] = [
  // 1. 표지
  `<div style="position:absolute;left:88px;right:88px;top:120px">
     <div style="display:inline-block;border:2px solid #17171A;background:${C.yellow};padding:12px 22px;font-size:30px;font-weight:800">저장해 두고 꺼내 보세요</div>
     <div style="font-size:84px;font-weight:900;line-height:1.2;letter-spacing:-3px;margin-top:34px">카톡으로 못 한 말,<br>이렇게 전해 보세요</div>
     <div style="font-size:36px;color:#55555B;margin-top:26px;line-height:1.5">느린 편지 앱을 만들면서 알게 된 4가지</div>
   </div>
   <div style="position:absolute;left:88px;right:88px;top:640px;height:600px;background:#F4F4F6;border:1px solid #ECECEF;display:flex;align-items:flex-start;justify-content:center;gap:30px;padding-top:44px;overflow:hidden">
     <div class="ph" style="height:640px"><img src="${shot("phone-2-room.png")}"></div>
     <div class="ph" style="height:640px;margin-top:40px"><img src="${shot("phone-4-map.png")}"></div>
     <div class="ph" style="height:640px"><img src="${shot("phone-1-list.png")}"></div>
   </div>
   <div style="position:absolute;right:96px;bottom:40px;font-size:26px;color:#8A8A90">넘겨 보세요 →</div>`,
  // 2. 문제
  `${bar("왜 카톡으로는 어려울까요?", C.lime)}
   <div class="panel" style="flex-direction:column;gap:0">
     <div style="display:flex;gap:22px">${[["이렇게 진지해도<br>되나?", "쓸 때"], ["1이 안 없어져", "보내자마자"], ["ㅇㅇ 고마워", "답장"], ["아무 일<br>없던 듯", "다음 날"]].map(([q]) => `<div style="width:186px;height:150px;background:#fff;border-radius:22px;box-shadow:0 4px 14px rgba(0,0,0,.05);display:flex;align-items:center;justify-content:center;text-align:center;font-size:29px;font-weight:700;line-height:1.35">${q}</div>`).join("")}</div>
     <div style="display:flex;gap:22px;margin-top:0">${[0, 1, 2, 3].map(() => `<div style="width:186px;height:90px;display:flex;justify-content:center"><div style="width:2px;background:#C9C9CE"></div></div>`).join("")}</div>
     <div style="position:relative;width:812px;height:24px"><div style="position:absolute;left:93px;right:93px;top:11px;height:2px;background:#C9C9CE"></div>${[0, 1, 2, 3].map((k) => `<div style="position:absolute;left:${93 + k * 208 - 12}px;top:0;width:24px;height:24px;border-radius:12px;background:#17171A"></div>`).join("")}</div>
     <div style="display:flex;gap:22px;margin-top:18px">${["쓸 때", "보내자마자", "답장", "다음 날"].map((t) => `<div style="width:186px;text-align:center;font-size:28px;color:#77777D">${t}</div>`).join("")}</div>
   </div>
   ${txt(`<p>엄마한테 고맙다는 말 한 줄,<br>카톡으로 쓰다가 지운 적 있으세요?</p><p>바로 읽히고 바로 답장이 오니까<br>진심을 꺼내기가 더 부담스러워요.</p><p><b>그래서 '천천히 가는 편지'를 만들었고, 써 보며 알게 된 4가지를 정리했어요.</b></p>`)}`,
  // 3. 팁 1
  `${bar("1. 바로 안 가도 괜찮아요", C.peach)}
   <div class="panel">${ph("phone-3-birds.png", 0, "big")}<span class="arrow">→</span>${ph("phone-1-list.png", 0, "big")}<div class="cap">새를 고르면 거리만큼 날아가요</div></div>
   ${txt(`<p>새 편지는 새를 골라 보내요.<br>서울→부산은 매 약 3시간 반, 까치 9시간쯤.</p><p>바로 도착하지 않으니까<br>답장을 기다리는 조급함 대신 설렘이 생겨요.</p><p><b>쓰는 사람은 마음을 정리할 시간이, 받는 사람은 기대할 시간이 생겨요.</b></p>`)}`,
  // 4. 팁 2
  `${bar("2. 받는 사람도 같이 기다려요", C.sky)}
   <div class="panel">${ph("phone-2-room.png", 0, "big", "대화방")}${ph("phone-4-map.png", 0, "big", "지도 크게 보기")}</div>
   ${txt(`<p>보낸 사람도, 받는 사람도<br>편지가 지금 어디쯤 날고 있는지 지도로 봐요.</p><p>"대전 근처를 지나요" 알림이 오면<br>내용을 몰라도 괜히 기다려져요.</p><p><b>내용은 도착해야 열려요. 기다리는 동안 둘이 같은 지도를 봐요.</b></p>`)}`,
  // 5. 팁 3
  `${bar("3. 같은 말도 편지지에 담기면 달라요", C.lav)}
   <div class="panel" style="gap:46px">
     <div style="text-align:center"><span class="pill" style="margin:0 0 18px;background:#EDEDF0">BEFORE · 카톡</span>${kakao("엄마 사랑해 ㅎㅎ")}</div>
     <span class="arrow">→</span>
     <div style="text-align:center"><span class="pill" style="margin:0 0 18px;background:#DFF2E7;color:#1B6E5C">AFTER · 새 편지</span>${letterPaper(["엄마, 요즘 자꾸", "엄마 밥 생각이 나요.", "이번 주말엔 꼭", "내려갈게요.", "늘 고마워요."], "— 막내가")}</div>
   </div>
   ${txt(`<p>도착하면 돌돌 말린 편지가 펼쳐지고,<br>사진은 폴라로이드처럼 천천히 선명해져요.</p><p>짧은 말도 편지지 위에서는<br>한 번 더 읽게 돼요.</p><p><b>'사랑해' 세 글자도, 편지지 위에서는 더 오래 남아요.</b></p>`)}`,
  // 6. 팁 4
  `${bar("4. 시작은 버튼 한 번이면 돼요", C.mint)}
   <div class="panel">${ph("phone-5-welcome.png", 0, "big", "처음 열면")}${ph("phone-1-list.png", 0, "big", "바로 편지 쓰기")}</div>
   ${txt(`<p>카카오·구글·애플 버튼 한 번이면 가입 끝.<br>카카오 이름과 사진을 그대로 가져와요.</p><p>상대가 앱이 없어도 괜찮아요.<br>링크 하나로 날아오는 모습을 보고, 도착하면 열어 봐요.</p><p><b>부모님께도 링크 하나만 보내면 돼요.</b></p>`)}`,
  // 7. 정리
  `<div style="position:absolute;left:88px;right:88px;top:84px;font-size:54px;font-weight:900;letter-spacing:-1.8px">이런 날 보내 보세요.</div>
   <div style="position:absolute;left:88px;right:88px;top:200px;background:#F4F4F6;border:1px solid #ECECEF;padding:20px 44px">
     ${[["생일", "직접 말하긴 쑥스러운 고마움"], ["다툰 뒤", "카톡으론 감정이 앞설 때"], ["멀리 사는 가족", "'밥은 먹었어?' 말고 진짜 안부"], ["그냥 생각날 때", "아무 일 없어도 괜찮아요"]].map(([a, b]) => `<div style="display:flex;padding:30px 0;border-bottom:1px solid #E4E4E8;font-size:34px"><span style="width:280px;color:#77777D">${a}</span><b style="font-weight:800">${b}</b></div>`).join("").replace(/border-bottom:1px solid #E4E4E8;([^"]*)"([^<]*<span[^>]*>그냥)/, '$1"$2')}
   </div>
   ${txt(`<p style="margin-top:-250px">꼭 특별한 날이 아니어도 괜찮아요.<br>기다리는 시간까지 선물이 되니까요.</p><p><b>저장해 두시고, 그날 한 통 보내 보세요.</b></p>`)}`,
  // 8. 마무리
  `<div style="position:absolute;left:0;right:0;top:170px;text-align:center">
     <img src="${icon}" style="width:200px;height:200px;border-radius:44px;box-shadow:0 10px 24px rgba(0,0,0,.12)">
     <div style="font-size:72px;font-weight:900;margin-top:34px;letter-spacing:-2.4px">새 편지</div>
     <div style="font-size:36px;color:#55555B;margin-top:14px">새가 실제 거리만큼 날아가 전해 주는 편지</div>
     <div style="display:inline-block;margin-top:46px;padding:22px 42px;border-radius:20px;background:#17171A;color:#fff;font-size:36px;font-weight:800">앱스토어에서 '새 편지' 검색 · 무료</div>
     <div style="font-size:28px;color:#8A8A90;margin-top:22px">링크는 프로필에 있어요 · 안드로이드는 곧</div>
     <div style="font-size:40px;font-weight:800;margin-top:70px">${SLOGAN}</div>
   </div>
   <div style="position:absolute;left:100px;right:100px;bottom:90px;display:flex;align-items:center;gap:22px">
     <span style="flex:1;font-size:30px;color:#77777D">@saepyeonji</span>
     <span style="padding:18px 34px;border-radius:18px;background:#5B8DEF;color:#fff;font-size:32px;font-weight:800;box-shadow:0 5px 0 #3E6FD0">팔로우 +</span>
     <span style="width:76px;height:76px;border-radius:38px;border:2px solid #D8D8DC;display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 4px 0 #E2E2E6">🔖</span>
     <span style="width:76px;height:76px;border-radius:38px;border:2px solid #D8D8DC;display:flex;align-items:center;justify-content:center;font-size:34px;box-shadow:0 4px 0 #E2E2E6">♡</span>
   </div>`,
];

const KEY = "tips";
const out = resolve(root, "promo/cards");
const tmp = resolve(root, "promo/cards-src/c3");
mkdirSync(tmp, { recursive: true });
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1080, height: 1350 }, deviceScaleFactor: 1 });
for (let i = 0; i < slides.length; i++) {
  const html = resolve(tmp, `${KEY}-${i + 1}.html`);
  writeFileSync(html, page(i + 1, slides[i]));
  const p = await ctx.newPage();
  await p.goto("file://" + html);
  await p.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
  const png = resolve(out, `c3-${KEY}-${i + 1}.png`);
  await p.screenshot({ path: png });
  execFileSync("ffmpeg", ["-loglevel", "error", "-y", "-i", png, "-q:v", "3", png.replace(/\.png$/, ".jpg")]);
  await p.close();
  console.log("c3", KEY, i + 1);
}
await browser.close();
