/**
 * 메신저형 화면 시안을 그림(PNG)으로 만드는 스크립트.
 * 실행: npx tsx docs/시안/build.mts   (크로미움이 /opt/pw-browsers/chromium 에 있어야 해요)
 * 결과: docs/시안/images/*.png, docs/시안/index.html(전체 화면 한눈에 보기)
 * 시안 전용이에요. 앱 코드에는 영향이 없고, 새 그림(BirdIcon)과 해안선(core/koreaGeo)은 앱 것을 그대로 써요.
 */
import { renderToStaticMarkup } from "react-dom/server";
import * as ReactNS from "react";
const React: any = (ReactNS as any).default ?? ReactNS;
(globalThis as any).React = React;
const h = React.createElement;
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import * as BI from "../../src/components/BirdIcon";
const BirdIcon: any = (BI as any).default?.default ?? (BI as any).default ?? BI;
import { LAND, decodeRing } from "../../core/koreaGeo";

const here = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(here, "images");
mkdirSync(OUT, { recursive: true });
const FONT = resolve(here, "../../node_modules/pretendard/dist/web/static/woff2");

const bird = (id: string, size = 44, letter = false) => renderToStaticMarkup(h(BirdIcon, { id, size, letter }));

/* ───────── 공통 스타일(앱 globals.css 색과 같음 + 어르신도 보기 쉬운 큰 글씨) ───────── */
const CSS = `
@font-face{font-family:P;font-weight:400;src:url(file://${FONT}/Pretendard-Regular.woff2)}
@font-face{font-family:P;font-weight:600;src:url(file://${FONT}/Pretendard-SemiBold.woff2)}
@font-face{font-family:P;font-weight:700;src:url(file://${FONT}/Pretendard-Bold.woff2)}
:root{--dahong:#C1481F;--namsaek:#1E3A5C;--hwangto:#E0A83C;--cheongrok:#1B6E5C;--bg:#FBF3E4;--text:#2A2118;--sub:#6B5E52;--card:#fff;--line:rgba(42,33,24,.14);--on-dahong:#fff;--hwangto-text:#8A5A06;
--b-cream:#FBF3E4;--b-ink:#2A2118;--b-brown:#8A5A3C;--b-brown2:#5B3A29;--b-grey:#9AA8B8;--b-grey2:#6F8094;--b-edge:rgba(42,33,24,.35);--sea:#D5E5EB;--land:#EFE3CC;--coast:#B3A27C;--map-text:#3A2F25}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:P,sans-serif;background:#d9d2c4;color:var(--text);font-size:18px}
.phone{width:390px;height:844px;background:var(--bg);position:relative;overflow:hidden;display:flex;flex-direction:column}
.sb{height:44px;display:flex;justify-content:space-between;align-items:center;padding:6px 26px 0;font-size:15px;font-weight:700;flex:none}
.hd{display:flex;align-items:center;gap:10px;padding:8px 14px 12px;flex:none;min-height:64px}
.hd h1{font-size:28px;font-weight:700}
.hd .back{width:56px;height:56px;display:grid;place-items:center;font-size:34px;margin-left:-8px}
.hd .t{flex:1}
.hd .t b{display:block;font-size:24px}
.hd .t span{font-size:16px;color:var(--sub)}
.body{flex:1;overflow:hidden;padding:0 16px;display:flex;flex-direction:column;gap:12px}
.row{background:var(--card);border-radius:18px;padding:14px;display:flex;gap:14px;align-items:center;min-height:92px;border:1px solid var(--line)}
.av{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;font-size:26px;font-weight:700;color:#fff;flex:none}
.g{background:var(--cheongrok)}.n{background:var(--namsaek)}.b{background:#8A5A2B}.p{background:#7b3f61}
.mid{flex:1;min-width:0}
.nm{font-size:22px;font-weight:700}
.st{font-size:17px;color:var(--sub);margin-top:2px;line-height:1.35}
.st b{color:var(--dahong);font-weight:700}
.bar{height:8px;background:rgba(42,33,24,.1);border-radius:8px;margin-top:8px;overflow:hidden}
.bar i{display:block;height:100%;background:var(--hwangto);border-radius:8px}
.meta{text-align:right;font-size:15px;color:var(--sub);flex:none}
.new{display:inline-block;background:var(--dahong);color:#fff;font-weight:700;font-size:15px;border-radius:12px;padding:3px 10px;margin-top:4px}
.cta{height:64px;border-radius:20px;background:var(--dahong);color:var(--on-dahong);font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;flex:none}
.ghost{height:60px;border-radius:20px;border:2px solid var(--namsaek);color:var(--namsaek);font-size:20px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;flex:none;background:transparent}
.dock{padding:10px 16px 12px;display:flex;flex-direction:column;gap:10px;flex:none}
.tabs{display:flex;border-top:1px solid var(--line);background:var(--card);flex:none;padding-bottom:14px}
.tabs div{flex:1;text-align:center;padding:10px 0 4px;font-size:16px;color:var(--sub);font-weight:600}
.tabs div.on{color:var(--dahong)}
.tabs svg{display:block;margin:0 auto 4px}
.map{border-radius:20px;overflow:hidden;border:1px solid var(--line);background:var(--sea);flex:none}
.map svg{display:block}
.eta{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px 16px;flex:none}
.eta .big{font-size:26px;font-weight:700}
.eta .big em{font-style:normal;color:var(--dahong)}
.eta .sm{font-size:17px;color:var(--sub);margin-top:2px}
.warn{background:#FFF1CC;border:1px solid var(--hwangto);border-radius:14px;padding:12px 14px;font-size:17px;font-weight:600;color:#5a3d00;flex:none}
.day{text-align:center;font-size:15px;color:var(--sub)}
.env{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:14px;display:flex;align-items:center;gap:14px;min-height:84px}
.env .ic{width:56px;height:56px;border-radius:14px;background:#F6E9CF;display:grid;place-items:center;flex:none}
.env b{font-size:19px;display:block}
.env span{font-size:16px;color:var(--sub)}
.env.me{background:#FCEBE2;border-color:rgba(193,72,31,.35)}
.lock{opacity:.9}
.paper{background:#FFFDF6;border-radius:18px;border:1px solid var(--line);padding:20px;font-size:20px;line-height:1.7;flex:none}
.scroll{background:linear-gradient(#F4E4C3,#FFFDF6 14%,#FFFDF6 86%,#F4E4C3);border-radius:10px;border:1px solid #d9c79c;padding:30px 22px;font-size:21px;line-height:1.75;position:relative;box-shadow:0 6px 18px rgba(0,0,0,.12)}
.rod{height:22px;border-radius:12px;background:linear-gradient(#C9A06A,#8A5A3C);margin:0 -10px}
.polaroid{background:#fff;padding:10px 10px 28px;box-shadow:0 4px 12px rgba(0,0,0,.2);width:150px;transform:rotate(-3deg)}
.polaroid i{display:block;height:110px;background:linear-gradient(160deg,#9cc5d6,#e7d8b0 60%,#c9a06a)}
.pick{border:2px solid var(--line);background:var(--card);border-radius:18px;padding:12px 14px;display:flex;align-items:center;gap:12px;min-height:84px}
.pick.sel{border-color:var(--dahong);background:#FCEBE2}
.pick .tm{margin-left:auto;text-align:right;white-space:nowrap;font-size:20px;font-weight:700;color:var(--dahong)}
.pick .tm small{display:block;font-size:14px;color:var(--sub);font-weight:400}
.pick b{font-size:22px}
.pick span.d{display:block;font-size:15px;color:var(--sub)}
.opt{background:var(--card);border:1px solid var(--line);border-radius:18px;padding:16px;display:flex;gap:14px;align-items:center;min-height:88px}
.opt .ic{width:56px;height:56px;border-radius:50%;background:#F6E9CF;display:grid;place-items:center;font-size:28px;flex:none}
.opt b{font-size:21px;display:block}
.opt span{font-size:16px;color:var(--sub)}
.code{font-size:34px;font-weight:700;letter-spacing:6px;text-align:center;background:var(--card);border:2px dashed var(--hwangto);border-radius:18px;padding:16px}
.seg{display:flex;gap:8px}
.seg div{flex:1;text-align:center;border:2px solid var(--line);border-radius:14px;padding:12px 0;font-weight:700;background:var(--card)}
.seg div.on{border-color:var(--dahong);color:var(--dahong);background:#FCEBE2}
.sw{width:64px;height:38px;border-radius:20px;background:var(--cheongrok);position:relative;flex:none}
.sw::after{content:"";position:absolute;right:4px;top:4px;width:30px;height:30px;border-radius:50%;background:#fff}
.center{display:flex;flex-direction:column;align-items:center;text-align:center;gap:14px}
.center h2{font-size:28px;line-height:1.35}
.center p{font-size:19px;color:var(--sub);line-height:1.5}
.no{position:absolute;top:50px;right:12px;background:var(--namsaek);color:#fff;width:34px;height:34px;border-radius:50%;display:grid;place-items:center;font-weight:700;font-size:16px}
`;

/* ───────── 한국 지도(앱과 같은 해안선 자료) ───────── */
type Pt = { name: string; lat: number; lng: number };
const SEOUL: Pt = { name: "서울", lat: 37.5665, lng: 126.978 };
const DAEJEON: Pt = { name: "대전", lat: 36.3739, lng: 127.3845 };
const BUSAN: Pt = { name: "부산", lat: 35.1, lng: 129.07 };

function mapSvg(w: number, h: number, p: number, birdId: string, opts: { from: Pt; mid: Pt; to: Pt; hideBird?: boolean; sent?: boolean }) {
  const cx = (opts.from.lng + opts.to.lng) / 2, cy = (opts.from.lat + opts.to.lat) / 2;
  const kx = Math.cos((cy * Math.PI) / 180);
  const spanLat = Math.abs(opts.from.lat - opts.to.lat) * 1.45 + 0.4;
  const sc = h / spanLat; // 위도 1도가 몇 px
  const proj = (lng: number, lat: number): [number, number] => [w / 2 + (lng - cx) * kx * sc, h / 2 - (lat - cy) * sc];
  const paths = Object.values(LAND)
    .flat()
    .map((ring) => "M" + decodeRing(ring as number[]).map(([lo, la]) => proj(lo, la).map((v) => v.toFixed(1)).join(",")).join("L") + "Z")
    .join("");
  const pts = [opts.from, opts.mid, opts.to].map((q) => proj(q.lng, q.lat));
  const seg = [Math.hypot(pts[1][0] - pts[0][0], pts[1][1] - pts[0][1]), Math.hypot(pts[2][0] - pts[1][0], pts[2][1] - pts[1][1])];
  const total = seg[0] + seg[1];
  const at = (f: number): [number, number] => {
    let d = f * total;
    if (d <= seg[0]) return [pts[0][0] + ((pts[1][0] - pts[0][0]) * d) / seg[0], pts[0][1] + ((pts[1][1] - pts[0][1]) * d) / seg[0]];
    d -= seg[0];
    return [pts[1][0] + ((pts[2][0] - pts[1][0]) * d) / seg[1], pts[1][1] + ((pts[2][1] - pts[1][1]) * d) / seg[1]];
  };
  const b = at(p);
  const donePts = p <= seg[0] / total ? `${pts[0]} ${b}` : `${pts[0]} ${pts[1]} ${b}`;
  const lbl = (q: Pt, [x, y]: [number, number], dy = 28) =>
    `<circle cx="${x}" cy="${y}" r="7" fill="#fff" stroke="#1E3A5C" stroke-width="3"/><text x="${x}" y="${y + dy}" text-anchor="middle" font-size="19" font-weight="700" fill="#3A2F25" stroke="#FBF3E4" stroke-width="4" paint-order="stroke">${q.name}</text>`;
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="#D5E5EB"/>
  <path d="${paths}" fill="#EFE3CC" stroke="#B3A27C" stroke-width="1.4" stroke-linejoin="round"/>
  <polyline points="${pts.map((q) => q.join(",")).join(" ")}" fill="none" stroke="#1E3A5C" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round" opacity=".55"/>
  <polyline points="${donePts}" fill="none" stroke="#C1481F" stroke-width="5" stroke-linecap="round"/>
  ${lbl(opts.from, pts[0])}${lbl(opts.mid, pts[1], -16)}${lbl(opts.to, pts[2])}
  ${opts.hideBird ? "" : `<g transform="translate(${b[0] - 36},${b[1] - 48})">${bird(birdId, 72, true)}</g>`}</svg>`;
}

/* ───────── 아이콘 ───────── */
const ic = (d: string, color = "currentColor") => `<svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const I = {
  mail: ic('<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="m4 7 8 6 8-6"/>'),
  people: ic('<circle cx="9" cy="9" r="3"/><path d="M3.5 19c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5M16 6.5a3 3 0 0 1 0 5.5M18 14.8c1.7.5 2.7 1.9 3 4.2"/>'),
  me: ic('<circle cx="12" cy="9" r="3.5"/><path d="M5 20c.8-4 3.4-5.5 7-5.5s6.2 1.5 7 5.5"/>'),
  cam: ic('<rect x="3" y="7" width="18" height="12" rx="2"/><circle cx="12" cy="13" r="3.5"/><path d="M9 7l1.5-2h3L15 7"/>'),
  clock: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  lock: ic('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'),
};
const tabs = (on: number) =>
  `<div class="tabs">${[["편지", I.mail], ["친구", I.people], ["내 정보", I.me]].map(([l, ico], i) => `<div class="${i === on ? "on" : ""}">${ico}${l}</div>`).join("")}</div>`;
const sb = `<div class="sb"><span>9:41</span><span>●●● ▮</span></div>`;
const wrap = (inner: string, no?: string) => `<div class="phone">${sb}${inner}</div>`;

/* ───────── 화면 ───────── */
const screens: { file: string; title: string; note: string; html: string }[] = [];
const add = (file: string, title: string, note: string, html: string) => screens.push({ file, title, note, html });

const route = { from: SEOUL, mid: DAEJEON, to: BUSAN };

// 01 목록(홈)
add("01-편지목록", "① 편지 목록 (첫 화면)", "사람 한 줄 = 대화방 하나. 상태는 말로 보여줘요.", wrap(`
<div class="hd"><div style="width:52px">${bird("magpie", 52)}</div><h1>새 편지</h1></div>
<div class="body">
  <div class="row"><div class="av g">지</div><div class="mid"><div class="nm">지민</div><div class="st"><b>내 편지가 날아가는 중</b><br>서울 → 부산 · 1시간 55분 남음</div><div class="bar"><i style="width:62%"></i></div></div></div>
  <div class="row"><div class="av n">현</div><div class="mid"><div class="nm">현우</div><div class="st"><b>새 편지가 도착했어요!</b><br>눌러서 열어 보세요</div></div><div class="meta">오늘<br><span class="new">새 편지</span></div></div>
  <div class="row"><div class="av b">할</div><div class="mid"><div class="nm">할머니</div><div class="st">편지가 오고 있어요<br>오후 5시 20분 도착</div><div class="bar"><i style="width:30%"></i></div></div></div>
  <div class="row"><div class="av p">엄</div><div class="mid"><div class="nm">엄마</div><div class="st"><b>출발 예정</b> · 10월 20일 아침</div></div><div class="meta">예약</div></div>
</div>
<div class="dock"><div class="cta">${I.mail} 편지 쓰기</div></div>
${tabs(0)}`));

// 02 대화방 - 보내는 사람
add("02-대화방-보낸사람", "② 지민 대화방 (내가 보낸 편지가 날아가는 중)", "사람을 누르면 지도가 바로 보여요. 편지 목록은 그 아래에 쌓여요.", wrap(`
<div class="hd"><div class="back">‹</div><div class="av g" style="width:48px;height:48px;font-size:22px">지</div><div class="t"><b>지민</b><span>서울 → 부산 · 비둘기</span></div></div>
<div class="body">
  <div class="map">${mapSvg(358, 250, 0.62, "pigeon", route)}</div>
  <div class="eta"><div class="big">도착까지 <em>1시간 55분</em></div><div class="sm">오늘 오후 5시 20분쯤 도착해요 · 내용은 지민만 읽어요</div><div class="bar"><i style="width:62%"></i></div></div>
  <div class="day">어제</div>
  <div class="env"><div class="ic">${bird("swallow", 44)}</div><div><b>지민이 보낸 편지</b><span>도착했어요 · 눌러서 읽기</span></div></div>
  <div class="env me"><div class="ic">${bird("pigeon", 44)}</div><div><b>내가 보낸 편지</b><span>도착 ✓ · 눌러서 보기</span></div></div>
</div>
<div class="dock"><div class="cta">${I.mail} 지민에게 편지 쓰기</div></div>`, "2"));

// 03 대화방 - 받는 사람(사고 안내 포함)
add("03-대화방-받는사람", "③ 지민 대화방 (받는 사람 화면: 편지가 오는 중)", "받는 사람도 똑같이 지도로 기다려요. 내용은 봉인, 사고(길 잃음)도 같이 보여요.", wrap(`
<div class="hd"><div class="back">‹</div><div class="av g" style="width:48px;height:48px;font-size:22px">지</div><div class="t"><b>지민</b><span>서울 → 부산 · 까치</span></div></div>
<div class="body">
  <div class="map">${mapSvg(358, 250, 0.48, "magpie", route)}</div>
  <div class="warn">🌳 까치가 나무에 걸렸어요! 조금 늦어지지만 편지는 꼭 도착해요.</div>
  <div class="eta"><div class="big">도착까지 <em>4시간 10분</em></div><div class="sm">오늘 밤 9시 30분쯤 도착해요</div><div class="bar"><i style="width:48%"></i></div></div>
  <div class="env lock"><div class="ic">${I.lock}</div><div><b>지민이 보낸 편지</b><span>도착하면 열어 볼 수 있어요</span></div></div>
</div>
<div class="dock"><div class="ghost">${I.mail} 지민에게 답장 미리 쓰기</div></div>`, "3"));

// 04a 도착
add("04-도착", "④ 편지가 도착했어요 (받는 사람)", "푸시를 누르면 바로 이 화면. 버튼은 하나뿐이에요.", wrap(`
<div class="body" style="justify-content:center">
  <div class="center">
    <div style="position:relative;width:200px;height:140px;display:grid;place-items:center">${bird("magpie", 190, true)}</div>
    <h2>지민의 편지가<br>도착했어요!</h2>
    <p>서울에서 부산까지<br>까치가 날아왔어요</p>
    <div style="width:100%;padding:0 8px"><div class="rod"></div><div style="background:#F1DFB8;height:54px;border:1px solid #d9c79c;border-radius:6px;margin:0 6px;display:grid;place-items:center;color:var(--sub);font-size:16px">돌돌 말린 편지</div><div class="rod"></div></div>
  </div>
</div>
<div class="dock" style="padding-bottom:30px"><div class="cta">편지 펼치기</div></div>`, "4"));

// 04b 펼친 편지
add("05-편지읽기", "⑤ 편지 읽기 (두루마리가 펼쳐진 모습)", "글자는 크게. 사진은 폴라로이드. 버튼은 답장 하나가 가장 크게.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>지민의 편지</b><span>10월 14일 도착</span></div></div>
<div class="body" style="gap:0">
  <div class="rod"></div>
  <div class="scroll" style="margin-top:-2px">할머니, 부산에 잘 도착했어요.<br>바다가 정말 예뻐서 사진 보내요.<br>건강하게 지내세요. 사랑해요 ♥
    <div style="display:flex;justify-content:center;margin-top:18px"><div class="polaroid"><i></i></div></div>
  </div>
  <div class="rod" style="margin-top:-2px"></div>
</div>
<div class="dock"><div class="cta">답장하기</div><div class="ghost">${I.cam} 사진 저장하기</div></div>`, "5"));

// 06 새 고르기
const pk = (id: string, name: string, time: string, d: string, sel = false) => `<div class="pick ${sel ? "sel" : ""}"><div style="width:68px">${bird(id, 66)}</div><div><b>${name}</b><span class="d">${d}</span></div><div class="tm">${time}<small>걸려요</small></div></div>`;
add("06-새고르기", "⑥ 새 고르기 (편지 쓰기 1단계)", "받는 사람은 이미 정해져 있어요. 시간이 제일 크게 보여요.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>어떤 새로 보낼까요?</b><span>지민에게 · 서울 → 부산 325km</span></div></div>
<div class="body" style="gap:8px">
  ${pk("hawk", "매", "약 3시간 37분", "가장 빨라요")}
  ${pk("pigeon", "비둘기", "약 5시간", "믿음직한 기본 새", true)}
  ${pk("bungbungi", "붕붕이", "약 5시간 25분", "드론 새 마스코트")}
  ${pk("crane", "두루미", "약 5시간 55분", "귀한 소식용")}
  ${pk("swallow", "제비", "약 8시간 8분", "봄 소식")}
  ${pk("magpie", "까치", "약 9시간 17분", "특별한 도착 연출")}
  <div class="st" style="text-align:center;font-size:15px">바람에 따라 시간이 조금 달라질 수 있어요</div>
</div>
<div class="dock"><div class="cta">이 새로 보낼게요</div></div>`, "6"));

// 07 글쓰기
add("07-편지쓰기", "⑦ 편지 쓰기 (2단계)", "큰 종이, 큰 글씨. 사진·나중에 보내기는 눈에 띄는 큰 버튼 두 개.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>지민에게 쓰는 편지</b><span>비둘기 · 약 5시간 뒤 도착</span></div></div>
<div class="body">
  <div class="paper" style="height:250px">지민아, 잘 지내니?<br>오늘 날씨가 참 좋구나.<span style="border-left:3px solid var(--dahong);margin-left:2px"></span></div>
  <div style="display:flex;gap:16px;align-items:center;padding-left:6px"><div class="polaroid" style="width:104px;flex:none;padding:6px 6px 16px;transform:rotate(-4deg)"><i style="height:68px"></i></div><div style="flex:1;display:flex;flex-direction:column;gap:10px"><div class="ghost" style="height:56px">${I.cam} 사진 넣기</div><div class="ghost" style="height:56px;border-color:var(--sub);color:var(--sub)">${I.clock} 나중에 보내기</div></div></div>
</div>
<div class="dock"><div class="cta">날려 보내기</div></div>`, "7"));

// 08 보낸 직후
add("08-보낸직후", "⑧ 날려 보냈어요 (보낸 직후)", "보내는 순간의 설렘. 다음 행동은 대화방 보기 하나.", wrap(`
<div class="body" style="justify-content:center">
  <div class="center">
    <h2>비둘기가<br>편지를 물고 날아갔어요!</h2>
    <div class="map" style="width:100%">${mapSvg(358, 230, 0.06, "pigeon", route)}</div>
    <p style="font-size:22px;color:var(--text);font-weight:700">약 5시간 뒤 <span style="color:var(--dahong)">오후 5시 20분</span> 도착</p>
    <p>도착하면 알려 드릴게요</p>
  </div>
</div>
<div class="dock" style="padding-bottom:30px"><div class="cta">지민 대화방 보기</div></div>`, "8"));

// 09 친구 추가
add("09-친구추가", "⑨ 친구 추가", "방법은 세 가지만. 코드를 몰라도 카카오톡이나 연락처로 초대해요.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>친구 추가</b><span>친구가 있어야 편지를 보낼 수 있어요</span></div></div>
<div class="body">
  <div class="opt"><div class="ic">💬</div><div><b>카카오톡으로 초대하기</b><span>링크를 보내면 바로 연결돼요</span></div></div>
  <div class="opt"><div class="ic">📇</div><div><b>연락처에서 초대하기</b><span>문자로 초대 링크를 보내요</span></div></div>
  <div class="st" style="margin-top:6px">내 친구 코드를 알려 주세요</div>
  <div class="code">K7M2 9QXA</div>
  <div class="ghost">코드 복사하기</div>
  <div class="opt"><div class="ic">⌨️</div><div><b>친구 코드 입력하기</b><span>친구가 알려 준 코드를 적어요</span></div></div>
</div>
${tabs(1)}`, "9"));

// 10 빈 첫 화면
add("10-처음화면", "⑩ 처음 쓰는 사람 (친구가 아직 없을 때)", "빈 화면에도 할 일은 하나. 친구 초대.", wrap(`
<div class="hd"><div style="width:52px">${bird("magpie", 52)}</div><h1>새 편지</h1></div>
<div class="body" style="justify-content:center">
  <div class="center">
    ${bird("magpie", 190, true)}
    <h2>친구를 초대하면<br>편지를 보낼 수 있어요</h2>
    <p>새가 실제 거리만큼 날아가서<br>천천히 도착해요</p>
  </div>
</div>
<div class="dock"><div class="cta">친구 초대하기</div></div>
${tabs(0)}`, "10"));

// 11 내 정보
add("11-내정보", "⑪ 내 정보 / 설정", "★ 새로 넣을 것: 글씨 크기(보통·크게·아주 크게). 어르신용.", wrap(`
<div class="hd"><h1>내 정보</h1></div>
<div class="body">
  <div class="row" style="min-height:84px"><div class="av g">나</div><div class="mid"><div class="nm">대표님</div><div class="st">카카오 연결됨</div></div></div>
  <div class="eta"><div class="nm" style="font-size:20px">★ 글씨 크기</div><div class="seg" style="margin-top:10px"><div>보통</div><div class="on">크게</div><div>아주 크게</div></div></div>
  <div class="row" style="min-height:76px"><div class="mid"><div class="nm" style="font-size:20px">도착 알림</div><div class="st">편지가 오면 짹짹! 알려 드려요</div></div><div class="sw"></div></div>
  <div class="row" style="min-height:76px"><div class="mid"><div class="nm" style="font-size:20px">계정 연결</div><div class="st">카카오 · 구글 · 네이버 · 애플 · 라인</div></div><div style="font-size:28px">›</div></div>
  <div class="row" style="min-height:76px"><div class="mid"><div class="nm" style="font-size:20px">도움말 · 문의</div></div><div style="font-size:28px">›</div></div>
</div>
${tabs(2)}`, "11"));

/* ───────── 보드(목표·벤치마크·디자인 규칙) ───────── */
const boardCss = `.board{width:1200px;padding:40px 44px;background:var(--bg)}.board h1{font-size:38px;margin-bottom:6px}.board .lead{font-size:20px;color:var(--sub);margin-bottom:26px}
.grid{display:grid;gap:18px}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}.g4{grid-template-columns:repeat(4,1fr)}
.bx{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px}.bx h3{font-size:23px;margin-bottom:8px}.bx p,.bx li{font-size:18px;line-height:1.55}.bx ul{padding-left:20px}
.tag{display:inline-block;font-size:14px;font-weight:700;border-radius:10px;padding:2px 9px;background:#F6E9CF;color:#6a4400;margin-right:6px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--line);padding:12px 14px;font-size:17px;vertical-align:top;text-align:left;line-height:1.5}th{background:#F6E9CF}
.sw2{display:flex;gap:10px;margin-top:10px}.sw2 i{display:block;width:70px;height:70px;border-radius:16px}.sw2 span{font-size:14px;display:block;margin-top:4px;color:var(--sub)}`;
const swatch = (c: string, n: string) => `<div><i style="background:${c}"></i><span>${n}<br>${c}</span></div>`;

const goal = `<div class="board"><h1>목표와 원칙</h1><div class="lead">대상: 20~30대부터 할아버지·할머니, 아이들까지 누구나. 앞의 그림 11장이 이 원칙으로 만든 화면이에요.</div>
<div class="grid g3">
<div class="bx"><h3>① 한 화면에 하나만</h3><p>화면마다 눌러야 할 큰 버튼은 <b>단 하나</b>. 목록은 사람 단위로 한 줄.</p></div>
<div class="bx"><h3>② 크고 또렷하게</h3><ul><li>글씨 본문 18px 이상, 제목 24~28px</li><li>버튼 높이 56~64px (손가락 큰 분도 OK)</li><li>색에만 기대지 않고 글로 상태를 말함</li></ul></div>
<div class="bx"><h3>③ 메신저처럼 익숙하게</h3><p>하단 탭 3개(편지·친구·내 정보). 사람을 누르면 대화방. 카톡·라인·왓츠앱에서 쓰던 방식 그대로.</p></div>
<div class="bx"><h3>④ 새편지만의 것: 지도</h3><p>대화방에 들어가면 <b>지도가 먼저</b>. 보낸 사람도 받는 사람도 같은 지도로 기다려요.</p></div>
<div class="bx"><h3>⑤ 기다림의 미학</h3><p>도착 시각과 날아가는 모습이 가장 눈에 띄게. 시간을 줄이는 버튼은 없음. 내용은 도착 전까지 봉인.</p></div>
<div class="bx"><h3>⑥ 어르신 배려</h3><p>★ 글씨 크기 설정(크게·아주 크게), 용어는 쉬운 말(예: "예약" → "나중에 보내기").</p></div>
</div></div>`;

const bench = `<div class="board"><h1>벤치마킹: 무엇을 가져오고 무엇이 다른가</h1><div class="lead"><span class="tag">「미확인」</span>실제 앱 화면 캡처로 나란히 비교한 것은 아니고, 널리 알려진 구성을 정리한 것이에요. 대표님 폰의 카카오톡·라인 화면과 이 시안을 나란히 놓고 한 번 비교해 주세요.</div>
<table><tr><th style="width:150px">서비스</th><th>익숙한 구조(가져올 것)</th><th>새편지에 적용</th><th>따라 하지 않을 것</th></tr>
<tr><td><b>카카오톡</b></td><td>하단 탭, 사람별 대화 목록(프로필·마지막 내용·시간·안 읽음 숫자), 대화방 안에 말풍선</td><td>① 목록: 사람 한 줄 + "새 편지" 숫자 배지<br>② 대화방: 편지가 말풍선 자리에 쌓임</td><td>탭이 많고 광고·부가기능이 많은 점</td></tr>
<tr><td><b>LINE</b></td><td>친구 목록과 대화 목록 분리, 스티커로 감정 표현</td><td>새 6종을 "스티커"처럼 고르게 함(⑥ 새 고르기)</td><td>스티커샵 등 복잡한 메뉴</td></tr>
<tr><td><b>WhatsApp</b></td><td>아주 단순한 목록, 읽음 확인 표시(✓)</td><td>"도착 ✓" 표시, 군더더기 없는 목록</td><td>—</td></tr>
<tr><td><b>Carrier Pidge</b></td><td>지도 위에서 비둘기가 날아가고 도착 시각이 정해지는 느낌</td><td>지도를 <b>대화방 맨 위</b>에 고정(②③), 사람마다 지도</td><td>새가 죽어 편지가 사라지는 규칙(우리는 늦어질 뿐 꼭 도착)</td></tr>
</table>
<div class="grid g2" style="margin-top:18px"><div class="bx"><h3>일반 메신저와 우리가 다른 점</h3><p>메신저는 메시지가 <b>바로</b> 가요. 새편지는 <b>날아가는 시간</b>이 있어요. 그래서 대화방에 <b>지도 + 남은 시간</b>이 있고, 내용은 도착 전까지 봉인돼요.</p></div>
<div class="bx"><h3>처음 쓰는 사람의 길</h3><p>친구 초대(⑩) → 편지 쓰기 → 새 고르기(⑥) → 글쓰기(⑦) → 날려 보냄(⑧) → 대화방 지도(②). 받는 사람은 푸시 → 도착(④) → 편지 읽기(⑤) → 답장.</p></div></div></div>`;

const tokens = `<div class="board"><h1>디자인 규칙(색·글씨·크기)</h1><div class="lead">앱의 오방색을 그대로 쓰고, 글씨와 버튼만 더 크게 키웠어요. 다크 모드도 앱에서 지원해요.</div>
<div class="grid g2"><div class="bx"><h3>색</h3><div class="sw2">${swatch("#C1481F", "다홍(주요 버튼)")}${swatch("#1E3A5C", "남색(보조)")}${swatch("#E0A83C", "황토(진행바)")}${swatch("#1B6E5C", "청록(아바타)")}${swatch("#FBF3E4", "한지(배경)")}</div></div>
<div class="bx"><h3>글씨(Pretendard)</h3><p style="font-size:30px;font-weight:700">제목 28px 굵게</p><p style="font-size:22px;font-weight:700">이름·핵심 시간 22~26px</p><p style="font-size:18px">본문 18px / 보조 설명 16~17px</p><p style="font-size:15px;color:var(--sub)">작은 글씨는 15px 아래로 쓰지 않아요</p></div>
<div class="bx"><h3>크기</h3><ul><li>큰 버튼 높이 60~64px</li><li>목록 한 줄 높이 92px 이상</li><li>아바타 60px, 하단 탭 아이콘 30px + 글자 16px</li></ul></div>
<div class="bx"><h3>글씨 크기 설정(★ 신규)</h3><p>보통 / 크게(+15%) / 아주 크게(+30%). 모든 화면에 적용. 어르신이 직접 켜기 쉽게 "내 정보" 맨 위에 둬요.</p></div></div></div>`;

/* ───────── 그림으로 굽기 ───────── */
const page = (body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}${boardCss}</style></head><body>${body}</body></html>`;
const shoot = (name: string, body: string, w: number, h: number) => {
  const f = resolve(OUT, `${name}.html`);
  writeFileSync(f, page(body));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${w},${h + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, name + ".png")}`, "file://" + f], { stdio: "ignore" });
};
for (const s of screens) shoot(s.file, s.html, 390, 844);
shoot("00-목표와원칙", goal, 1200, 760);
shoot("12-벤치마킹", bench, 1200, 720);
shoot("13-디자인규칙", tokens, 1200, 700);

// 전체 한눈에 보기(화면 11장을 한 장에)
const sheet = `<div style="padding:30px;background:#d9d2c4;width:${4 * 420 + 30}px"><div style="display:grid;grid-template-columns:repeat(4,390px);gap:30px 30px">${screens.map((s) => `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${s.title}</div>${s.html}<div style="font-size:15px;color:#4a3f35;margin-top:6px;line-height:1.4">${s.note}</div></div>`).join("")}</div></div>`;
shoot("전체-한눈에", sheet, 4 * 420 + 30, 3 * 960 + 60);
console.log("만든 그림:", screens.length + 4);
