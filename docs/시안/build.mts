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
const KMH: Record<string, number> = { hawk: 90, pigeon: 65, bungbungi: 60, crane: 55, swallow: 40, magpie: 35 };
/** 새 한 줄: 이름 / 시속(km/h) / (유료 새는 체험 표시) / 걸리는 시간 */
const pk = (id: string, name: string, time: string, tag = "", sel = false) =>
  `<div class="pick ${sel ? "sel" : ""}" style="min-height:82px"><div style="width:68px;flex:none">${bird(id, 66)}</div><div><b>${name}</b><span class="d" style="font-size:15px;color:var(--namsaek);font-weight:700">시속 ${KMH[id]}km${tag ? ` <i style="font-style:normal;background:var(--dahong);color:#fff;font-size:14px;border-radius:9px;padding:2px 8px;margin-left:4px;white-space:nowrap">${tag}</i>` : ""}</span></div><div class="tm">${time}<small>걸려요</small></div></div>`;
add("06-새고르기", "⑥ 새 고르기 (편지 쓰기 1단계)", "받는 사람은 이미 정해져 있어요. 시간이 제일 크게 보여요.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>어떤 새로 보낼까요?</b><span>지민에게 · 서울 → 부산 325km</span></div></div>
<div class="body" style="gap:8px">
  ${pk("hawk", "매", "약 3시간 37분", "체험 5회")}
  ${pk("pigeon", "비둘기", "약 5시간", "", true)}
  ${pk("bungbungi", "붕붕이", "약 5시간 25분", "체험 5회")}
  ${pk("crane", "두루미", "약 5시간 55분")}
  ${pk("swallow", "제비", "약 8시간 8분")}
  ${pk("magpie", "까치", "약 9시간 17분")}
  <div class="st" style="text-align:center;font-size:15px">바람에 따라 시속·시간이 조금 달라져요</div>
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

// 09 친구 추가 (코드 없이: 카카오톡 초대가 맨 위)
add("09-친구추가", "⑨ 친구 추가 (코드 없음)", "친구 코드는 화면에서 없앴어요. 카카오톡으로 초대 링크를 보내면 끝.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>친구 초대</b><span>링크를 받은 친구가 시작하면 자동으로 친구가 돼요</span></div></div>
<div class="body">
  <div class="warn" style="background:#FCEBE2;border-color:var(--dahong);color:#7a2a0f">🎁 친구가 첫 편지를 보내면 <b>둘 다 유료 새 체험 3회</b>를 드려요</div>
  <div class="cta" style="background:#FEE500;color:#2a211b;height:72px">💬 카카오톡으로 초대하기</div>
  <div class="st" style="text-align:center">친구가 링크를 누르고 카카오로 시작하면<br>바로 편지를 주고받을 수 있어요</div>
  <div class="opt"><div class="ic">📇</div><div><b>연락처에서 초대하기</b><span>문자로 초대 링크를 보내요</span></div></div>
  <div class="opt"><div class="ic">🔗</div><div><b>초대 링크 복사하기</b><span>다른 앱에 붙여 넣어 보낼 수 있어요</span></div></div>
  <div class="opt" style="opacity:.7"><div class="ic">👥</div><div><b>카카오톡 친구 중에서 찾기 <span class="tag" style="font-size:13px;background:#F6E9CF;border-radius:8px;padding:1px 6px">준비 중</span></b><span>이미 새 편지를 쓰는 친구가 자동으로 나와요</span></div></div>
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
  <div class="row" style="min-height:76px"><div class="mid"><div class="nm" style="font-size:20px">로그인 방법</div><div class="st">카카오로 로그인 중 · 구글·애플·네이버 추가 가능</div></div><div style="font-size:28px">›</div></div>
  <div class="row" style="min-height:76px"><div class="mid"><div class="nm" style="font-size:20px">도움말 · 문의</div></div><div style="font-size:28px">›</div></div>
</div>
${tabs(2)}`, "11"));

// 14 시작(로그인)
add("14-로그인", "⑫ 처음 열었을 때 (로그인)", "로그인이 곧 시작이에요. 코드·가입 양식 없음. 버튼 하나로 끝.", wrap(`
<div class="body" style="justify-content:center">
  <div class="center">
    ${bird("magpie", 200, true)}
    <h1 style="font-size:36px">새 편지</h1>
    <p>새가 날아서 전하는<br>천천히 도착하는 편지</p>
  </div>
</div>
<div class="dock" style="padding-bottom:20px;gap:12px">
  <div class="cta" style="background:#FEE500;color:#2a211b;height:68px">💬 카카오로 시작하기</div>
  <div class="ghost" style="height:62px">구글로 시작하기</div>
  <div class="cta" style="background:#111;height:62px">  애플로 시작하기</div>
  <div class="st" style="text-align:center;font-size:15px">네이버는 곧 추가돼요<br>시작하면 이용약관과 개인정보 처리방침에 동의한 것으로 봐요 · 만 14세 이상</div>
</div>`));

// 15 초대 받은 사람
add("15-초대받음", "⑬ 친구가 보낸 초대 링크를 눌렀을 때", "누가 초대했는지 먼저 보여 주고, 로그인하면 자동으로 친구가 돼요.", wrap(`
<div class="body" style="justify-content:center">
  <div class="center">
    <div class="av g" style="width:96px;height:96px;font-size:44px">지</div>
    <h2>지민님이<br>편지 친구로 초대했어요</h2>
    <p>새가 날아서 전하는 편지.<br>시작하면 지민님과 바로 연결돼요</p>
  </div>
</div>
<div class="dock" style="padding-bottom:20px;gap:12px">
  <div class="cta" style="background:#FEE500;color:#2a211b;height:68px">💬 카카오로 시작하고 친구 되기</div>
  <div class="ghost" style="height:62px">구글로 시작하기</div>
  <div class="st" style="text-align:center;font-size:15px">앱이 없으면 먼저 설치 화면으로 이동해요</div>
</div>`));

// 16 연결됨
add("16-친구연결됨", "⑭ 친구가 됐어요 (로그인 직후)", "코드 입력 없이 자동 연결. 다음 할 일은 첫 편지 하나.", wrap(`
<div class="body" style="justify-content:center">
  <div class="center">
    <div style="display:flex;align-items:center;gap:14px"><div class="av n" style="width:80px;height:80px;font-size:36px">나</div><div style="font-size:30px">💌</div><div class="av g" style="width:80px;height:80px;font-size:36px">지</div></div>
    <h2>지민님과<br>편지 친구가 되었어요!</h2>
    <p>첫 편지를 써서<br>새에게 맡겨 보세요</p>
  </div>
</div>
<div class="dock" style="padding-bottom:30px"><div class="cta">지민에게 첫 편지 쓰기</div></div>`));

// 17 가입 선물
add("17-가입선물", "⑮ 가입 선물 (로그인 직후)", "유료 새 두 종을 5번씩 써 볼 수 있어요. 보내기는 원래 무료.", wrap(`
<div class="body" style="justify-content:center">
  <div class="center">
    <h2>🎁 가입 선물이<br>도착했어요!</h2>
    <p>유료 새를 <b>5번씩</b> 무료로 써 보세요</p>
    <div style="display:flex;gap:12px;width:100%">
      <div class="pick" style="flex:1;flex-direction:column;text-align:center;gap:4px;padding:16px 8px">${bird("bungbungi", 104)}<b>붕붕이</b><span class="d" style="color:var(--dahong);font-weight:700;font-size:18px">체험 5회</span></div>
      <div class="pick" style="flex:1;flex-direction:column;text-align:center;gap:4px;padding:16px 8px">${bird("hawk", 104)}<b>매</b><span class="d" style="color:var(--dahong);font-weight:700;font-size:18px">체험 5회</span></div>
    </div>
    <p style="font-size:16px">기본 새(비둘기·까치·제비·두루미)는<br>계속 무료예요</p>
  </div>
</div>
<div class="dock" style="padding-bottom:30px"><div class="cta">받고 시작하기</div></div>`));

// 18 체험 끝
add("18-체험끝", "⑯ 체험 5회를 다 썼을 때", "강요하지 않아요. 사거나, 기본 새로 계속 보내거나.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>어떤 새로 보낼까요?</b><span>지민에게 · 서울 → 부산 325km</span></div></div>
<div class="body" style="gap:8px;opacity:.35;pointer-events:none">${pk("hawk", "매", "약 3시간 37분", "체험 끝")}${pk("pigeon", "비둘기", "약 5시간")}${pk("bungbungi", "붕붕이", "약 5시간 25분", "체험 끝", true)}</div>
<div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-radius:28px 28px 0 0;box-shadow:0 -8px 30px rgba(0,0,0,.25);padding:22px 20px 30px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center">
  ${bird("bungbungi", 120)}
  <div style="font-size:26px;font-weight:700">붕붕이 체험 5회를<br>다 썼어요</div>
  <div class="st" style="font-size:18px">계속 쓰려면 <b style="color:var(--text)">₩1,500</b> · 한 번만 사면 계속 써요</div>
  <div class="cta" style="width:100%">붕붕이 구매하기 ₩1,500</div>
  <div class="ghost" style="width:100%;height:56px">붕붕이+매 묶음 ₩2,500</div>
  <div class="st" style="font-size:17px;font-weight:700;color:var(--namsaek)">비둘기로 그냥 보낼게요 (무료)</div>
  <div class="st" style="font-size:14px">카카오 로그인 중이라 폰을 바꿔도 구매가 유지돼요 · 가격은 예시</div>
</div>`));

// 19 내 새 꾸미기
const itm = (ico: string, name: string, price: string, on = false) => `<div class="pick ${on ? "sel" : ""}" style="flex-direction:column;justify-content:center;text-align:center;gap:2px;padding:12px 6px;min-height:112px"><div style="font-size:38px;line-height:1">${ico}</div><b style="font-size:19px">${name}</b><span class="d" style="${on ? "color:var(--dahong);font-weight:700" : ""}">${price}</span></div>`;
add("19-새꾸미기", "⑰ 내 새 꾸미기 (옷장)", "내 새에게 옷을 입혀요. 친구에게도 이 모습으로 보여요. 그림은 예시예요.", wrap(`
<div class="hd"><div class="back">‹</div><div class="t"><b>내 새 꾸미기</b><span>친구에게도 이 모습으로 보여요</span></div></div>
<div class="body" style="gap:10px">
  <div class="eta" style="display:flex;flex-direction:column;align-items:center;padding:14px;background:linear-gradient(#FFF8E8,#F6E9CF)">
    <div style="position:relative;width:230px;height:184px">${bird("pigeon", 230)}
      <svg viewBox="0 0 200 160" width="230" height="184" style="position:absolute;left:0;top:0"><path d="M112 84 Q131 100 152 82" fill="none" stroke="#C1481F" stroke-width="11" stroke-linecap="round"/><path d="M121 90 l-1 8 M132 94 l0 8 M143 90 l2 7" stroke="#FBF3E4" stroke-width="3" stroke-linecap="round"/><path d="M121 99 l-4 20 l11 -2 z" fill="#C1481F"/></svg></div>
    <div class="nm" style="margin-top:4px">비둘기 · 빨간 목도리</div>
  </div>
  <div class="seg"><div class="on">옷·소품</div><div>편지지</div><div>도착 연출</div></div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
    ${itm("🐦", "기본", "무료")}${itm("🧣", "목도리", "착용 중", true)}${itm("🎉", "생일 모자", "₩1,000")}
    ${itm("👘", "한복", "설날 한정")}${itm("🌸", "꽃 장식", "₩1,000")}${itm("🎩", "신사 모자", "₩1,500")}
  </div>
  <div class="st" style="text-align:center;font-size:15px">그림과 가격은 예시예요 · 직접 골라서 사요 (랜덤 뽑기 없음)</div>
</div>
<div class="dock"><div class="cta">이 모습으로 저장</div></div>`));

/* ───────── 보드(목표·벤치마크·디자인 규칙) ───────── */
const boardCss = `.board{width:1200px;padding:40px 44px;background:var(--bg)}.board h1{font-size:38px;margin-bottom:6px}.board .lead{font-size:20px;color:var(--sub);margin-bottom:26px}
.grid{display:grid;gap:18px}.g2{grid-template-columns:1fr 1fr}.g3{grid-template-columns:1fr 1fr 1fr}.g4{grid-template-columns:repeat(4,1fr)}
.bx{background:#fff;border:1px solid var(--line);border-radius:20px;padding:22px}.bx h3{font-size:23px;margin-bottom:8px}.bx p,.bx li{font-size:18px;line-height:1.55}.bx ul{padding-left:20px}
.tag{display:inline-block;font-size:14px;font-weight:700;border-radius:10px;padding:2px 9px;background:#F6E9CF;color:#6a4400;margin-right:6px}
table{border-collapse:collapse;width:100%}th,td{border:1px solid var(--line);padding:12px 14px;font-size:17px;vertical-align:top;text-align:left;line-height:1.5}th{background:#F6E9CF}
.sw2{display:flex;gap:10px;margin-top:10px}.sw2 i{display:block;width:70px;height:70px;border-radius:16px}.sw2 span{font-size:14px;display:block;margin-top:4px;color:var(--sub)}`;
const swatch = (c: string, n: string) => `<div><i style="background:${c}"></i><span>${n}<br>${c}</span></div>`;

const goal = `<div class="board"><h1>목표와 원칙</h1><div class="lead">대상: 20~30대부터 할아버지·할머니, 아이들까지 누구나. 앞의 그림 17장이 이 원칙으로 만든 화면이에요.</div>
<div class="grid g3">
<div class="bx"><h3>① 한 화면에 하나만</h3><p>화면마다 눌러야 할 큰 버튼은 <b>단 하나</b>. 목록은 사람 단위로 한 줄.</p></div>
<div class="bx"><h3>② 크고 또렷하게</h3><ul><li>글씨 본문 18px 이상, 제목 24~28px</li><li>버튼 높이 56~64px (손가락 큰 분도 OK)</li><li>색에만 기대지 않고 글로 상태를 말함</li></ul></div>
<div class="bx"><h3>③ 메신저처럼 익숙하게</h3><p>로그인=시작(카카오·구글·애플), 친구 코드 없음. 하단 탭 3개(편지·친구·내 정보). 사람을 누르면 대화방. 카톡·라인·왓츠앱에서 쓰던 방식 그대로.</p></div>
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
<div class="bx"><h3>처음 쓰는 사람의 길</h3><p>로그인(⑫) → 친구 초대(⑨, 코드 없음) → 편지 쓰기 → 새 고르기(⑥) → 글쓰기(⑦) → 날려 보냄(⑧) → 대화방 지도(②). 받는 사람은 초대 링크(⑬) → 카카오로 시작 → 친구 연결(⑭), 편지가 오면 푸시 → 도착(④) → 편지 읽기(⑤) → 답장.</p></div></div></div>`;

const tokens = `<div class="board"><h1>디자인 규칙(색·글씨·크기)</h1><div class="lead">앱의 오방색을 그대로 쓰고, 글씨와 버튼만 더 크게 키웠어요. 다크 모드도 앱에서 지원해요.</div>
<div class="grid g2"><div class="bx"><h3>색</h3><div class="sw2">${swatch("#C1481F", "다홍(주요 버튼)")}${swatch("#1E3A5C", "남색(보조)")}${swatch("#E0A83C", "황토(진행바)")}${swatch("#1B6E5C", "청록(아바타)")}${swatch("#FBF3E4", "한지(배경)")}</div></div>
<div class="bx"><h3>글씨(Pretendard)</h3><p style="font-size:30px;font-weight:700">제목 28px 굵게</p><p style="font-size:22px;font-weight:700">이름·핵심 시간 22~26px</p><p style="font-size:18px">본문 18px / 보조 설명 16~17px</p><p style="font-size:15px;color:var(--sub)">작은 글씨는 15px 아래로 쓰지 않아요</p></div>
<div class="bx"><h3>크기</h3><ul><li>큰 버튼 높이 60~64px</li><li>목록 한 줄 높이 92px 이상</li><li>아바타 60px, 하단 탭 아이콘 30px + 글자 16px</li></ul></div>
<div class="bx"><h3>글씨 크기 설정(★ 신규)</h3><p>보통 / 크게(+15%) / 아주 크게(+30%). 모든 화면에 적용. 어르신이 직접 켜기 쉽게 "내 정보" 맨 위에 둬요.</p></div></div></div>`;

/* ───────── 그림으로 굽기 ───────── */
const page = (body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}${boardCss}${body.startsWith("<div class=\"board\"") ? "body{background:#FBF3E4}" : ""}</style></head><body>${body}</body></html>`;
const shoot = (name: string, body: string, w: number, h: number) => {
  const f = resolve(OUT, `${name}.html`);
  writeFileSync(f, page(body));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${w},${h + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, name + ".png")}`, "file://" + f], { stdio: "ignore" });
  // 크로미움이 창 크기보다 아래쪽을 더 찍어서, 정확한 크기로 잘라 줘요
  const png = resolve(OUT, name + ".png");
  execFileSync("convert", [png, "-crop", `${w * 2}x${h * 2}+0+0`, "+repage", png]);
};
for (const s of screens) shoot(s.file, s.html, 390, 844);
shoot("00-목표와원칙", goal, 1200, 560);
shoot("12-벤치마킹", bench, 1200, 930);
shoot("13-디자인규칙", tokens, 1200, 620);

// 전체 한눈에 보기(화면 11장을 한 장에)
const sheet = `<div style="padding:30px;background:#d9d2c4;width:${4 * 420 + 30}px"><div style="display:grid;grid-template-columns:repeat(4,390px);gap:30px 30px">${screens.map((s) => `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${s.title}</div>${s.html}<div style="font-size:15px;color:#4a3f35;margin-top:6px;line-height:1.4">${s.note}</div></div>`).join("")}</div></div>`;
shoot("전체-한눈에", sheet, 4 * 420 + 30, 5 * 960 + 60);
console.log("만든 그림:", screens.length + 4);

/* ═════════ 2차 시안(v2): 더 귀엽고, 더 단순하게 ═════════ */
const CSS2 = `
body{background:#d9d2c4}
.v2{width:390px;height:844px;position:relative;overflow:hidden;display:flex;flex-direction:column;font-family:P,sans-serif;color:#2A2118;
 background:radial-gradient(120px 60px at 12% 6%,#FFFDF6 60%,transparent 62%),radial-gradient(160px 70px at 88% 11%,#FFFDF6 60%,transparent 62%),radial-gradient(90px 44px at 70% 3%,#FFFDF6 60%,transparent 62%),linear-gradient(#FFF7E6 0,#FBF3E4 300px)}
.v2 .sb{height:44px;display:flex;justify-content:space-between;align-items:center;padding:6px 26px 0;font-size:15px;font-weight:700;flex:none}
.v2 .body{flex:1;overflow:hidden;padding:0 16px;display:flex;flex-direction:column;gap:12px}
.v2 .hello{display:flex;align-items:center;gap:10px;padding:6px 18px 10px}
.v2 .hello b{font-size:28px}
.v2 .hello small{display:block;font-size:16px;opacity:.7;margin-top:1px}
.v2 .row2{display:flex;align-items:center;gap:14px;background:#fff;border-radius:26px;padding:14px 16px;min-height:96px;box-shadow:0 3px 0 rgba(42,33,24,.08),0 8px 18px rgba(42,33,24,.07)}
.v2 .row2.fly{background:linear-gradient(#FFFBEF,#FBEBC4)}
.v2 .row2.hot{background:linear-gradient(#FFF3EC,#F7D9CA);box-shadow:0 3px 0 rgba(193,72,31,.25),0 8px 18px rgba(193,72,31,.12)}
.v2 .face{width:64px;height:64px;border-radius:50%;display:grid;place-items:center;flex:none;box-shadow:inset 0 0 0 3px #fff,0 2px 0 rgba(42,33,24,.12)}
.v2 .f0{background:rgba(27,110,92,.16)}.v2 .f1{background:rgba(30,58,92,.14)}.v2 .f2{background:rgba(224,168,60,.28)}.v2 .f3{background:rgba(193,72,31,.14)}
.v2 .nm{font-size:22px;font-weight:700}
.v2 .st{font-size:17px;margin-top:2px;line-height:1.35;color:#6B5E52}
.v2 .st b{color:#C1481F}
.v2 .track{position:relative;height:12px;background:rgba(42,33,24,.1);border-radius:12px;margin-top:20px}
.v2 .track i{position:absolute;left:0;top:0;bottom:0;background:linear-gradient(90deg,#F0BC5C,#E0A83C);border-radius:12px}
.v2 .track .bd{position:absolute;top:-24px;transform:translateX(-50%)}
.v2 .pill{display:inline-block;background:#C1481F;color:#fff;font-weight:700;font-size:15px;border-radius:14px;padding:3px 10px}
.v2 .chunky{height:66px;border-radius:24px;background:#C1481F;color:#fff;font-size:22px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 5px 0 #8f3210,0 10px 18px rgba(193,72,31,.3)}
.v2 .chunky.kk{background:#FEE500;color:#2A2118;box-shadow:0 5px 0 #c9b300,0 10px 18px rgba(0,0,0,.12)}
.v2 .chunky.gg{background:#fff;color:#1E3A5C;box-shadow:0 5px 0 #c5ccd6,0 10px 18px rgba(0,0,0,.08)}
.v2 .chunky.ap{background:#111;box-shadow:0 5px 0 #000,0 10px 18px rgba(0,0,0,.2)}
.v2 .dock{padding:10px 16px 14px;display:flex;flex-direction:column;gap:12px;flex:none}
.v2 .tabs{display:flex;background:#fff;border-radius:28px 28px 0 0;box-shadow:0 -6px 18px rgba(42,33,24,.08);padding:8px 8px 16px;flex:none}
.v2 .tabs div{flex:1;text-align:center;font-size:15px;font-weight:700;color:#8a7c6f;padding-top:4px}
.v2 .tabs div.on{color:#C1481F}
.v2 .tabs div.on span{background:rgba(193,72,31,.14);border-radius:16px}
.v2 .tabs span{display:block;margin:0 auto 2px;width:56px;height:34px;border-radius:16px;display:grid;place-items:center}
.v2 .bubble{position:relative;background:#fff;border-radius:22px;padding:12px 18px;font-size:20px;font-weight:700;box-shadow:0 3px 0 rgba(42,33,24,.08);text-align:center}
.v2 .bubble::after{content:"";position:absolute;left:50%;bottom:-10px;margin-left:-10px;border:10px solid transparent;border-bottom:0;border-top-color:#fff}
.v2 .map2{border-radius:28px;overflow:hidden;border:4px solid #fff;box-shadow:0 3px 0 rgba(42,33,24,.1),0 10px 22px rgba(42,33,24,.12);flex:none}
.v2 .map2 svg{display:block}
.v2 .eta2{background:#fff;border-radius:24px;padding:14px 18px 16px;box-shadow:0 3px 0 rgba(42,33,24,.08),0 8px 18px rgba(42,33,24,.07);flex:none}
.v2 .eta2 .big{font-size:28px;font-weight:700}
.v2 .eta2 .big em{font-style:normal;color:#C1481F}
.v2 .eta2 .sm{font-size:17px;color:#6B5E52;margin-top:2px}
.v2 .sticker{display:flex;align-items:center;gap:14px;background:#fff;border-radius:24px;padding:12px 16px;min-height:80px;box-shadow:0 3px 0 rgba(42,33,24,.08)}
.v2 .sticker .ic{width:58px;height:58px;border-radius:18px;background:rgba(224,168,60,.25);display:grid;place-items:center;flex:none}
.v2 .sticker.me{background:#F9E1D4}
.v2 .sticker b{font-size:19px;display:block}.v2 .sticker span.d{font-size:16px;color:#6B5E52}
.v2 .pk{display:flex;align-items:center;gap:12px;border-radius:26px;padding:10px 16px 10px 10px;min-height:92px;box-shadow:0 3px 0 rgba(42,33,24,.08)}
.v2 .pk .pic{width:84px;display:grid;place-items:center;flex:none}
.v2 .pk b{font-size:23px;display:block}
.v2 .pk .kmh{display:inline-block;background:#fff;border-radius:12px;padding:1px 9px;font-size:15px;font-weight:700;color:#1E3A5C;margin-top:3px}
.v2 .pk .tm{margin-left:auto;text-align:right;font-size:21px;font-weight:700;color:#C1481F;white-space:nowrap}
.v2 .pk .tm small{display:block;font-size:14px;color:#6B5E52;font-weight:400}
.v2 .pk.sel{box-shadow:0 0 0 4px #C1481F,0 8px 18px rgba(193,72,31,.2)}
.v2 .pc0{background:#DFE9DD}.v2 .pc1{background:#DFE2E2}.v2 .pc2{background:#F8E6BC}.v2 .pc3{background:#F4DACB}.v2 .pc4{background:#F1E4C8}.v2 .pc5{background:#E6DECA}
.v2 .confetti i{position:absolute;width:12px;height:18px;border-radius:4px}
`;
const FACE: [string, number][] = [["magpie", 0], ["pigeon", 1], ["swallow", 2], ["crane", 3], ["bungbungi", 0], ["hawk", 1]];
const face = (name: string) => { let h = 0; for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0; const [b] = FACE[h % FACE.length]; return `<div class="face f${h % 4}">${bird(b, 54)}</div>`; };
const mini = (pct: number, id: string) => `<div class="track"><i style="width:${pct}%"></i><div class="bd" style="left:${pct}%">${bird(id, 40)}</div></div>`;
const tabs2 = (on: number) => `<div class="tabs">${[["편지", I.mail], ["친구", I.people], ["내 정보", I.me]].map(([l, ico], i) => `<div class="${i === on ? "on" : ""}"><span>${ico}</span>${l}</div>`).join("")}</div>`;
const wrap2 = (inner: string) => `<div class="v2"><div class="sb"><span>9:41</span><span>●●● ▮</span></div>${inner}</div>`;
const v2: { file: string; title: string; note: string; html: string }[] = [];
const add2 = (file: string, title: string, note: string, html: string) => v2.push({ file, title, note, html });

add2("v2-1-로그인", "로그인: 한지 하늘 + 말하는 새", "새가 말을 걸어요. 버튼은 도톰해서 누르고 싶게.", wrap2(`
<div class="body" style="justify-content:center;align-items:center;gap:16px">
  <div class="bubble">짹짹! 반가워요 🌤</div>
  <div style="margin-top:6px">${bird("hawk", 210, true)}</div>
  <div style="font-size:38px;font-weight:700;margin-top:6px">새 편지</div>
  <div style="font-size:19px;color:#6B5E52;text-align:center;line-height:1.5">새가 날아서 전하는<br>천천히 도착하는 편지</div>
</div>
<div class="dock">
  <div class="chunky kk">💬 카카오로 시작하기</div>
  <div class="chunky gg">구글로 시작하기</div>
  <div class="chunky ap">애플로 시작하기</div>
</div>`));

add2("v2-2-목록", "편지 목록: 새 얼굴 + 날아가는 막대", "친구마다 새 얼굴. 진행 막대 위를 작은 새가 날아가요.", wrap2(`
<div class="hello"><div>${bird("magpie", 56)}</div><div><b>새 편지</b><small>오늘도 편지 날리기 좋은 날 ☀</small></div></div>
<div class="body">
  <div class="row2 hot">${face("현우")}<div style="flex:1"><div class="nm">현우</div><div class="st"><b>새 편지가 도착했어요!</b></div></div><span class="pill">NEW</span></div>
  <div class="row2 fly">${face("지민")}<div style="flex:1"><div class="nm">지민</div><div class="st">내 편지가 날아가는 중 · 1시간 55분</div>${mini(62, "pigeon")}</div></div>
  <div class="row2 fly">${face("할머니")}<div style="flex:1"><div class="nm">할머니</div><div class="st">편지가 오고 있어요 · 오후 5시 20분</div>${mini(30, "crane")}</div></div>
  <div class="row2">${face("엄마")}<div style="flex:1"><div class="nm">엄마</div><div class="st"><b>출발 예정</b> · 10월 20일 아침</div></div></div>
</div>
<div class="dock"><div class="chunky">✉ 편지 쓰기</div></div>
${tabs2(0)}`));

add2("v2-3-대화방", "대화방: 지도 한 장 + 한 문장", "글을 줄이고 큰 문장 하나. 편지는 스티커처럼.", wrap2(`
<div class="hello" style="padding-bottom:4px"><span style="font-size:34px;margin-left:-6px">‹</span><div class="face f0" style="width:52px;height:52px">${bird("pigeon", 42)}</div><div><b style="font-size:24px">지민</b><small>서울 → 부산</small></div></div>
<div class="body">
  <div class="map2">${mapSvg(350, 250, 0.62, "pigeon", route)}</div>
  <div class="eta2"><div class="big">도착까지 <em>1시간 55분</em></div><div class="sm">오후 5시 20분쯤 · 시속 65km</div>${mini(62, "pigeon")}</div>
  <div class="sticker"><div class="ic">${bird("swallow", 44)}</div><div><b>지민이 보낸 편지</b><span class="d">도착했어요 · 눌러서 읽기</span></div></div>
  <div class="sticker me"><div class="ic">${bird("pigeon", 44)}</div><div><b>내가 보낸 편지</b><span class="d">도착 ✓</span></div></div>
</div>
<div class="dock"><div class="chunky">✉ 지민에게 편지 쓰기</div></div>`));

const pk2 = (id: string, name: string, time: string, c: number, sel = false, tag = "") => `<div class="pk pc${c} ${sel ? "sel" : ""}"><div class="pic">${bird(id, 78)}</div><div><b>${name}</b><span class="kmh">시속 ${KMH[id]}km</span>${tag ? ` <span class="pill" style="font-size:13px">${tag}</span>` : ""}</div><div class="tm">${time}<small>걸려요</small></div></div>`;
add2("v2-4-새고르기", "새 고르기: 오방색 카드", "새가 크게 보여요. 시속은 작은 알약으로.", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:24px">어떤 새로 보낼까요?</b><small>지민에게 · 서울 → 부산 325km</small></div></div>
<div class="body" style="gap:9px">
  ${pk2("hawk", "매", "약 3시간 37분", 5, false, "체험 5회")}
  ${pk2("pigeon", "비둘기", "약 5시간", 0, true)}
  ${pk2("bungbungi", "붕붕이", "약 5시간 25분", 2, false, "체험 5회")}
  ${pk2("crane", "두루미", "약 5시간 55분", 1)}
  ${pk2("swallow", "제비", "약 8시간 8분", 3)}
  ${pk2("magpie", "까치", "약 9시간 17분", 4)}
</div>
<div class="dock"><div class="chunky">이 새로 보낼게요</div></div>`));

add2("v2-5-도착", "도착: 폭죽과 말풍선", "도착하는 순간이 가장 신나야 해요. 버튼은 하나.", wrap2(`
<div class="confetti">${[[30,120,"#E0A83C",-20],[80,170,"#C1481F",15],[310,130,"#1B6E5C",25],[350,200,"#E0A83C",-10],[60,300,"#1E3A5C",30],[330,320,"#C1481F",-25],[200,95,"#F0BC5C",10]].map(([x,y,c,r]) => `<i style="left:${x}px;top:${y}px;background:${c};transform:rotate(${r}deg)"></i>`).join("")}</div>
<div class="body" style="justify-content:center;align-items:center;gap:14px">
  <div class="bubble">짹짹! 편지가 도착했어요!</div>
  <div>${bird("magpie", 220, true)}</div>
  <div style="font-size:30px;font-weight:700;text-align:center;line-height:1.3">지민의 편지가<br>도착했어요</div>
  <div style="font-size:18px;color:#6B5E52">서울에서 부산까지 까치가 날아왔어요</div>
</div>
<div class="dock"><div class="chunky">편지 펼치기</div></div>`));

add2("v2-6-내새", "내 정보: '내 새' 고르기", "내 얼굴이 되는 새를 골라요. 꾸미기·스킨으로 이어져요.", wrap2(`
<div class="hello"><div><b>내 정보</b></div></div>
<div class="body">
  <div class="eta2" style="text-align:center;padding:18px"><div class="face f0" style="width:120px;height:120px;margin:0 auto">${bird("magpie", 100)}</div><div class="nm" style="margin-top:8px;font-size:26px">대표님</div><div class="st" style="color:#C1481F;font-weight:700">내 새 · 까치 ✎</div></div>
  <div class="eta2"><div style="font-size:20px;font-weight:700">글씨 크기</div><div class="seg" style="margin-top:10px"><div>보통</div><div class="on">크게</div><div>아주 크게</div></div></div>
  <div class="eta2" style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-size:20px;font-weight:700">도착 알림</div><div class="sm" style="font-size:15px;color:#6B5E52">편지가 오면 짹짹! 알려 드려요</div></div><div class="sw"></div></div>
</div>
${tabs2(2)}`));


add2("v2-7-랭킹", "우리 랭킹: 누가 제일 멀리 보냈을까", "친구와 나의 편지 비행 거리를 겨뤄요. 새 얼굴로 시상대.", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:26px">우리 랭킹 🏆</b><small>편지가 날아간 거리의 합이에요</small></div></div>
<div class="body" style="gap:10px">
  <div class="seg"><div class="on">누적 거리</div><div>가장 먼 한 통</div></div>
  <div class="eta2" style="padding:16px 10px 14px">
    <div style="display:flex;align-items:flex-end;justify-content:center;gap:10px">
      <div style="text-align:center;width:104px"><div class="face f0" style="width:70px;height:70px;margin:0 auto">${bird("magpie", 58)}</div><div class="nm" style="font-size:18px;margin-top:4px">나</div><div style="font-size:15px;color:#6B5E52">1,980km</div><div style="background:#EBD9CC;border-radius:14px 14px 0 0;height:68px;margin-top:6px;display:grid;place-items:center;font-size:28px">🥈</div></div>
      <div style="text-align:center;width:112px"><div style="font-size:26px">👑</div><div class="face f2" style="width:84px;height:84px;margin:0 auto;box-shadow:inset 0 0 0 4px #E0A83C">${bird("crane", 68)}</div><div class="nm" style="font-size:20px;margin-top:4px">지민</div><div style="font-size:16px;color:#C1481F;font-weight:700">2,350km</div><div style="background:#F6E2A6;border-radius:14px 14px 0 0;height:84px;margin-top:6px;display:grid;place-items:center;font-size:30px">🥇</div></div>
      <div style="text-align:center;width:104px"><div class="face f1" style="width:70px;height:70px;margin:0 auto">${bird("hawk", 58)}</div><div class="nm" style="font-size:18px;margin-top:4px">현우</div><div style="font-size:15px;color:#6B5E52">1,200km</div><div style="background:#E8E1D0;border-radius:14px 14px 0 0;height:54px;margin-top:6px;display:grid;place-items:center;font-size:26px">🥉</div></div>
    </div>
  </div>
  <div class="sticker"><div style="font-size:24px;width:34px;text-align:center;font-weight:700">4</div><div class="face f3" style="width:52px;height:52px">${bird("swallow", 42)}</div><div style="flex:1"><b>엄마</b><span class="d">편지 6통</span></div><div style="font-weight:700;font-size:18px">650km</div></div>
  <div class="sticker"><div style="font-size:24px;width:34px;text-align:center;font-weight:700">5</div><div class="face f0" style="width:52px;height:52px">${bird("pigeon", 42)}</div><div style="flex:1"><b>할머니</b><span class="d">편지 2통</span></div><div style="font-weight:700;font-size:18px">325km</div></div>
  <div class="bubble" style="margin-top:4px;font-size:17px">내 순위 2위 · 1위 지민까지 370km 🕊</div>
</div>
${tabs2(1)}`));

add2("v2-8-내위치", "내 위치: 구 단위로만 찾아요", "정확한 위치가 아니라 '구'까지만. 좌표는 저장하지 않아요.", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:24px">내가 있는 곳</b><small>편지가 여기서 날아가요</small></div></div>
<div class="body" style="gap:14px">
  <div class="map2">${mapSvg(350, 220, 0.05, "magpie", { from: SEOUL, mid: DAEJEON, to: BUSAN })}</div>
  <div class="eta2" style="text-align:center">
    <div style="font-size:18px;color:#6B5E52">지금 이 근처예요</div>
    <div style="font-size:32px;font-weight:700;margin:4px 0">서울 강남구</div>
    <div class="st" style="font-size:15px;color:#6B5E52">정확한 위치는 저장하지 않고, 구 이름만 써요</div>
  </div>
  <div class="chunky">📍 내 위치로 다시 찾기</div>
  <div class="chunky gg" style="font-size:20px">직접 고르기 (시·구)</div>
</div>
<div class="dock"><div class="chunky" style="background:#1B6E5C;box-shadow:0 5px 0 #0f4a3d,0 10px 18px rgba(27,110,92,.3)">맞아요, 여기서 보낼게요</div></div>`));

add2("v2-9-친구초대고침", "친구 초대: '준비 중' 표시 정리", "삐뚤게 놓인 도형을 없애고 글씨가 보이는 작은 표시로.", wrap2(`
<div class="hello"><div><b>친구 초대</b><small>링크를 받은 친구가 시작하면 자동으로 친구가 돼요</small></div></div>
<div class="body">
  <div class="chunky kk" style="height:72px">💬 카카오톡으로 초대하기</div>
  <div class="sticker"><div class="ic">🔗</div><div><b>초대 링크 복사하기</b><span class="d">다른 앱에 붙여 넣어 보낼 수 있어요</span></div></div>
  <div class="sticker" style="opacity:.75"><div class="ic">👥</div><div><b>카카오톡 친구 중에서 찾기</b><span class="d">이미 새 편지를 쓰는 친구가 자동으로 나와요</span><span style="display:inline-block;background:#E0A83C;border-radius:10px;padding:2px 10px;font-size:13px;font-weight:700;margin-top:6px">준비 중</span></div></div>
  <div class="sticker" style="background:#FFF3C9"><div class="ic" style="background:#fff">🏆</div><div style="flex:1"><b>우리 랭킹 보기</b><span class="d">누가 제일 멀리 보냈을까?</span></div><span style="font-size:26px">›</span></div>
  <div style="font-size:18px;font-weight:700;margin-top:6px">내 친구 (2)</div>
  <div class="row2">${face("지민")}<div style="flex:1" class="nm">지민</div><span class="pill" style="background:#fff;color:#1E3A5C;border:2px solid #1E3A5C">끊기</span></div>
</div>
${tabs2(1)}`));

// 비교표: 지금 → 2차
const beforeAfter = `<div class="board"><h1>2차 시안: 더 귀엽고, 더 단순하게</h1><div class="lead">기준: ① 귀여움(고퀄리티) ② 단순함·쓰기 편함. 지금 앱과 비교해서 바꾼 점만 적었어요.</div>
<table><tr><th style="width:150px">화면</th><th>지금</th><th>2차 시안</th></tr>
<tr><td><b>로그인</b></td><td>새 + 글자 + 버튼</td><td>한지 배경에 구름, 새가 <b>말풍선으로 인사</b>, 도톰한 버튼(눌리는 느낌)</td></tr>
<tr><td><b>편지 목록</b></td><td>글자 동그라미 아바타, 얇은 막대</td><td>친구마다 <b>새 얼굴 아바타</b>, 막대 위를 <b>작은 새가 날아가는</b> 진행 표시, 상태별 색(도착=다홍빛, 비행=황토빛)</td></tr>
<tr><td><b>대화방</b></td><td>지도 + 글 세 줄 + 카드</td><td>지도에 흰 테두리(스티커), <b>문장 하나</b>(도착까지 N), 편지는 스티커 카드</td></tr>
<tr><td><b>새 고르기</b></td><td>흰 카드, 작은 새</td><td><b>오방색을 옅게 입힌 카드</b>, 새를 크게, 시속은 작은 알약, 선택은 굵은 테두리</td></tr>
<tr><td><b>도착</b></td><td>글 중심</td><td><b>폭죽 + "짹짹!" 말풍선</b>, 버튼 하나</td></tr>
<tr><td><b>내 정보</b></td><td>글자 아바타</td><td><b>내 새</b> 고르기(꾸미기·스킨으로 이어지는 자리)</td></tr></table>
<div class="grid g3" style="margin-top:18px">
<div class="bx"><h3>귀여움 규칙</h3><ul><li>사람 얼굴 자리는 <b>새 얼굴</b></li><li>중요한 순간(로그인·도착)에는 <b>새가 말해요</b></li><li>둥글고 도톰한 모양, 부드러운 그림자</li><li><b>색은 오방색 그대로</b>(다홍·남색·황토·청록·한지)</li></ul></div>
<div class="bx"><h3>단순함 규칙</h3><ul><li>한 화면에 <b>큰 버튼 하나</b></li><li>글은 <b>한 문장</b>이 기본</li><li>색은 상태를 알려 줌(다홍빛=새 편지, 황토빛=비행 중)</li></ul></div>
<div class="bx"><h3>지킬 것</h3><ul><li>어르신용 큰 글씨·큰 버튼 그대로</li><li>기다림의 미학(시간을 줄이는 요소 없음)</li><li>새 그림은 직접 그린 것만 사용</li></ul></div></div></div>`;

const page2 = (body: string, bg = "#d9d2c4") => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}${boardCss}${CSS2}body{background:${bg}}</style></head><body>${body}</body></html>`;
const shoot2 = (name: string, body: string, w: number, h: number, bg?: string) => {
  const f = resolve(OUT, `${name}.html`);
  writeFileSync(f, page2(body, bg));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${w},${h + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, name + ".png")}`, "file://" + f], { stdio: "ignore" });
  const png = resolve(OUT, name + ".png");
  execFileSync("convert", [png, "-crop", `${w * 2}x${h * 2}+0+0`, "+repage", png]);
};
for (const s of v2) shoot2(s.file, s.html, 390, 844);
shoot2("v2-0-바뀐점", beforeAfter, 1200, 760, "#FBF3E4");
const sheet2 = `<div style="padding:30px;background:#d9d2c4;width:${3 * 420 + 30}px"><div style="display:grid;grid-template-columns:repeat(3,390px);gap:30px"><div style="grid-column:1/-1;font-size:26px;font-weight:700">2차 시안 한눈에 보기 (더 귀엽고 더 단순하게)</div>${v2.map((s) => `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${s.title}</div>${s.html}<div style="font-size:15px;color:#4a3f35;margin-top:6px;line-height:1.4">${s.note}</div></div>`).join("")}</div></div>`;
shoot2("v2-전체-한눈에", sheet2, 3 * 420 + 30, 3 * 960 + 130);
console.log("2차 시안:", v2.length + 2);


/* ═════════ 3차 시안(v3): 모든 걸 '대화방 한 창' 안에서 ═════════ */
const CSS3 = `
.v2 .rhead{display:flex;align-items:center;gap:10px;padding:2px 14px 8px;flex:none}
.v2 .rhead b{font-size:24px}.v2 .rhead small{display:block;font-size:15px;color:#6B5E52}
.v2 .mapmini{margin:0 14px;border-radius:22px;overflow:hidden;border:3px solid #fff;box-shadow:0 3px 0 rgba(42,33,24,.1);position:relative;flex:none}
.v2 .mapmini .eta{position:absolute;left:8px;bottom:8px;background:#fff;border-radius:14px;padding:4px 12px;font-size:16px;font-weight:700}
.v2 .mapmini .eta em{font-style:normal;color:#C1481F}
.v2 .chat{flex:1;overflow:hidden;padding:10px 14px 0;display:flex;flex-direction:column;gap:10px;justify-content:flex-end}
.v2 .day{align-self:center;font-size:14px;color:#8a7c6f;background:rgba(255,255,255,.7);border-radius:12px;padding:2px 12px}
.v2 .ev{align-self:center;display:flex;align-items:center;gap:8px;background:#FFF3C9;border-radius:18px;padding:7px 14px;font-size:16px;font-weight:700;color:#5b4a1e}
.v2 .ev small{font-weight:400;color:#8a7c6f;font-size:14px}
.v2 .lt{max-width:300px;border-radius:24px;padding:12px 16px;box-shadow:0 3px 0 rgba(42,33,24,.08);font-size:18px;line-height:1.45}
.v2 .lt.me{align-self:flex-end;background:#F9E1D4;border-bottom-right-radius:8px}
.v2 .lt.you{align-self:flex-start;background:#fff;border-bottom-left-radius:8px}
.v2 .lt .top{display:flex;align-items:center;gap:10px}
.v2 .lt b{font-size:18px;display:block}.v2 .lt .d{font-size:15px;color:#6B5E52}
.v2 .lt.arrived{background:linear-gradient(#FFF3EC,#F7D9CA);box-shadow:0 0 0 3px #C1481F}
.v2 .paper{background:#FFFDF4;border:2px solid #E7D9B5;border-radius:14px;padding:12px 14px;margin-top:8px;font-size:19px;line-height:1.55}
.v2 .stamp{display:inline-block;font-size:13px;font-weight:700;color:#C1481F;border:2px solid #C1481F;border-radius:8px;padding:0 6px;transform:rotate(-6deg);margin-left:6px}
.v2 .comp{display:flex;align-items:center;gap:8px;padding:10px 12px 14px;background:#fff;box-shadow:0 -6px 18px rgba(42,33,24,.08);border-radius:24px 24px 0 0;flex:none}
.v2 .comp .bc{display:flex;flex-direction:column;align-items:center;font-size:12px;font-weight:700;color:#1E3A5C;background:#F8E6BC;border-radius:18px;padding:2px 8px;flex:none}
.v2 .comp .in{flex:1;min-height:52px;border-radius:26px;background:#F4EEDF;padding:13px 16px;font-size:19px;color:#8a7c6f}
.v2 .comp .go{width:54px;height:54px;border-radius:50%;background:#C1481F;color:#fff;display:grid;place-items:center;font-size:24px;box-shadow:0 4px 0 #8f3210;flex:none}
.v2 .sheet{background:#fff;border-radius:28px 28px 0 0;padding:14px 14px 16px;box-shadow:0 -10px 28px rgba(42,33,24,.18);flex:none}
.v2 .sheet h4{font-size:20px;text-align:center;margin-bottom:8px}
.v2 .dim{position:absolute;inset:0;background:rgba(42,33,24,.35)}
.v2 .pk.s{min-height:62px;padding:4px 14px 4px 6px;margin-bottom:6px}.v2 .pk.s .pic{width:62px}.v2 .pk.s b{font-size:20px}
`;
const chatMap = (p: number, id: string, eta: string) => `<div class="mapmini">${mapSvg(362, 158, p, id, route)}<div class="eta">${eta}</div></div>`;
const rhead = (n: string, sub: string) => `<div class="rhead"><span style="font-size:34px;margin-left:-4px">‹</span>${face(n)}<div><b>${n}</b><small>${sub}</small></div></div>`;
const comp = (txt = "지민에게 편지를 써 보세요", chip = ["pigeon", "비둘기"], go = true) => `<div class="comp"><div class="bc">${bird(chip[0], 34)}${chip[1]}</div><div class="in">${txt}</div><div class="go" style="${go ? "" : "opacity:.35"}">➤</div></div>`;

const v3: { file: string; title: string; note: string; html: string }[] = [];
const add3 = (file: string, title: string, note: string, html: string) => v3.push({ file, title, note, html });

add3("v3-1-보낸사람", "① 내가 보낸 편지: 한 창에서 쭉", "새 출발 → 중간 지점 → 도착 예정이 대화처럼 쌓여요. 내용은 도착 전까지 나만 봐요.", wrap2(`
${rhead("지민", "서울 → 부산 · 비둘기")}
${chatMap(0.62, "pigeon", "도착까지 <em>1시간 55분</em>")}
<div class="chat">
  <div class="day">오늘</div>
  <div class="lt me"><div class="top">${bird("pigeon", 46, true)}<div><b>내가 보낸 편지</b><span class="d">눌러서 내 글 보기</span></div></div></div>
  <div class="ev">🕊 비둘기가 출발했어요 <small>오전 10:00</small></div>
  <div class="ev">📍 대전을 지나고 있어요 <small>오후 12:30</small></div>
  <div class="ev" style="background:#fff">⏳ 오후 5:20쯤 도착해요 <small>지민님만 읽어요</small></div>
</div>
${comp("편지가 날아가는 중이에요", ["pigeon", "비둘기"], false)}`));

add3("v3-2-쓰기", "② 쓰기도 같은 창에서", "아래 입력줄에 쓰고, 새 알약을 누르면 새 고르기가 올라와요. 화면 이동 없음.", wrap2(`
${rhead("지민", "서울 → 부산 325km")}
<div class="chat" style="position:relative"><div class="day">오늘</div><div class="lt you"><div class="top">${bird("swallow", 46)}<div><b>지민이 보낸 편지</b><span class="d">읽었어요</span></div></div></div></div>
<div class="dim"></div>
<div class="sheet" style="position:relative;margin-top:-420px;z-index:2"><h4>어떤 새로 보낼까요?</h4>
  ${pk2("hawk", "매", "약 3시간 37분", 5, false, "체험")}${pk2("pigeon", "비둘기", "약 5시간", 0, true)}${pk2("crane", "두루미", "약 5시간 55분", 1)}
  <div class="st" style="text-align:center;font-size:15px">아래로 밀면 제비·까치·붕붕이도 있어요</div>
</div>
<div style="position:relative;z-index:2">${comp("보고 싶어서 새 편에 몇 자 적어요", ["pigeon", "비둘기"])}</div>`));

add3("v3-3-받는사람", "③ 받는 사람도 같은 창", "날아오는 모습·도착 시각은 같이 보고, 내용은 도착해야 열려요.", wrap2(`
${rhead("지민", "부산 → 서울 · 제비")}
${chatMap(0.3, "swallow", "도착까지 <em>5시간 40분</em>")}
<div class="chat">
  <div class="day">오늘</div>
  <div class="ev">🕊 제비가 출발했어요 <small>오전 9:00</small></div>
  <div class="lt you"><div class="top">${bird("swallow", 46, true)}<div><b>지민이 보낸 편지</b><span class="d">🔒 도착하면 열 수 있어요</span></div></div></div>
  <div class="ev" style="background:#fff">⏳ 오후 6:30쯤 도착해요</div>
</div>
${comp("답장은 편지가 도착한 뒤에 써요", ["pigeon", "비둘기"], false)}`));

add3("v3-4-도착", "④ 도착하면 눌러서 그 자리에서 펼침", "새 화면으로 가지 않고 말풍선이 두루마리처럼 펼쳐져요.", wrap2(`
${rhead("지민", "부산 → 서울 · 제비")}
<div class="chat">
  <div class="day">오늘</div>
  <div class="ev" style="background:#F7D9CA">🎉 제비가 도착했어요! <small>오후 6:24</small></div>
  <div class="lt you arrived"><div class="top">${bird("swallow", 46)}<div><b>지민이 보낸 편지 <span class="stamp">도착</span></b><span class="d">부산 → 서울 · 약 8시간</span></div></div>
    <div class="paper">보고 싶다 🥲<br>이번 주말에 부산 오면<br>회 먹으러 가자!<br><span style="float:right;font-size:16px;color:#6B5E52">- 지민</span></div></div>
  <div class="lt me"><div class="top">${bird("pigeon", 46)}<div><b>내가 보낸 편지</b><span class="d">도착 ✓ · 눌러서 보기</span></div></div></div>
</div>
${comp("답장 쓰기", ["pigeon", "비둘기"])}`));

const page3 = (body: string, bg = "#d9d2c4") => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}${boardCss}${CSS2}${CSS3}body{background:${bg}}</style></head><body>${body}</body></html>`;
for (const s of v3) {
  const f = resolve(OUT, `${s.file}.html`);
  writeFileSync(f, page3(s.html));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=390,${844 + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, s.file + ".png")}`, "file://" + f], { stdio: "ignore" });
  const png = resolve(OUT, s.file + ".png");
  execFileSync("convert", [png, "-crop", `${390 * 2}x${844 * 2}+0+0`, "+repage", png]);
}
const sheet3 = `<div style="padding:30px;background:#d9d2c4;width:${4 * 420 + 30}px"><div style="display:grid;grid-template-columns:repeat(4,390px);gap:30px"><div style="grid-column:1/-1;font-size:26px;font-weight:700">3차 시안: 편지 쓰기·기다림·읽기가 모두 한 대화창 안에서</div>${v3.map((s) => `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${s.title}</div>${s.html}<div style="font-size:15px;color:#4a3f35;margin-top:6px;line-height:1.4">${s.note}</div></div>`).join("")}</div></div>`;
{
  const f = resolve(OUT, "v3-전체-한눈에.html");
  writeFileSync(f, page3(sheet3));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${4 * 420 + 30},${1000 + 87}`, "--force-device-scale-factor=1", `--screenshot=${resolve(OUT, "v3-전체-한눈에.png")}`, "file://" + f], { stdio: "ignore" });
  execFileSync("convert", [resolve(OUT, "v3-전체-한눈에.png"), "-crop", `${4 * 420 + 30}x1000+0+0`, "+repage", resolve(OUT, "v3-전체-한눈에.png")]);
}
console.log("3차 시안:", v3.length + 1);

/* ═════════ 4차 시안(v4): 위치 알려 주는 범위 · 전체 랭킹 · 스탬프 도감 · 비행 중 재미 이벤트 ═════════ */
const CSS4 = `
.v2 .opt{display:flex;align-items:center;gap:12px;background:#fff;border-radius:22px;padding:12px 16px;min-height:72px;box-shadow:0 3px 0 rgba(42,33,24,.08);font-size:19px;font-weight:700}
.v2 .opt small{display:block;font-weight:400;font-size:15px;color:#6B5E52;margin-top:2px}
.v2 .opt.on{box-shadow:0 0 0 4px #C1481F}
.v2 .opt .rd{width:26px;height:26px;border-radius:50%;border:3px solid #cdbfa8;flex:none}.v2 .opt.on .rd{border-color:#C1481F;background:radial-gradient(#C1481F 45%,transparent 50%)}
.v2 .chips{display:flex;flex-wrap:wrap;gap:8px}.v2 .chips span{background:#F8E6BC;color:#1E3A5C;border-radius:20px;padding:8px 16px;font-size:18px;font-weight:700}.v2 .chips span.on{background:#C1481F;color:#fff}
.v2 .stamps{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
.v2 .stp{aspect-ratio:1;border-radius:20px;background:#EFE6D2;display:grid;place-items:center;text-align:center;font-size:16px;font-weight:700;color:#a99b86;border:3px dashed #d6c9b0;line-height:1.2}
.v2 .stp.got{background:#fff;color:#2A2118;border:3px solid #E0A83C;box-shadow:0 3px 0 rgba(224,168,60,.4);transform:rotate(-2deg)}
.v2 .stp.got:nth-child(even){transform:rotate(2deg)}.v2 .stp b{display:block;font-size:26px;margin-bottom:2px}
`;
const v4: { file: string; title: string; note: string; html: string }[] = [];
const add4 = (file: string, title: string, note: string, html: string) => v4.push({ file, title, note, html });

add4("v4-1-내동네", "① 내 동네: 알려 줄 범위를 내가 정해요", "GPS는 내 폰에서만 쓰고 구까지만 찾아요. 친구에게는 내가 고른 범위만 보여요(기본: 시·도).", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:24px">내 동네</b><small>편지가 이곳으로 날아와요</small></div></div>
<div class="body" style="gap:12px">
  <div class="eta2" style="text-align:center"><div style="font-size:17px;color:#6B5E52">내 폰이 찾은 곳</div><div style="font-size:32px;font-weight:700;margin:2px 0">서울 강남구</div><div class="chips" style="justify-content:center;margin-top:6px"><span>📍 다시 찾기</span><span>직접 고르기</span></div></div>
  <div style="font-size:19px;font-weight:700;margin-top:4px">친구에게 보이는 범위</div>
  <div class="opt on"><span class="rd"></span><div>시·도까지만<small>"서울" 정도만 보여요 (추천)</small></div></div>
  <div class="opt"><span class="rd"></span><div>구까지<small>"서울 강남구"</small></div></div>
  <div class="opt"><span class="rd"></span><div>알리지 않기<small>보내는 친구가 직접 골라요</small></div></div>
  <div class="st" style="font-size:15px;text-align:center">정확한 위치는 저장하지 않고, 이름만 써요 · 언제든 바꿀 수 있어요</div>
</div>
<div class="dock"><div class="chunky">저장</div></div>`));

add4("v4-2-받는곳", "② 받는 곳: 친구가 알려 준 곳을 자동으로", "친구가 정한 범위만큼만 쓰고, 안 알려 줬으면 큰 도시에서 골라요.", wrap2(`
${rhead("지민", "받는 곳을 정해 볼까요?")}
<div class="body" style="gap:14px;justify-content:center">
  <div class="bubble">지민이 알려 준 곳이에요</div>
  <div class="eta2" style="text-align:center"><div style="font-size:36px;font-weight:700">부산</div><div class="st">지민이 "시·도까지"만 알려 줬어요</div></div>
  <div style="font-size:18px;font-weight:700;margin-top:6px">지민이 아직 안 알려 줬다면</div>
  <div class="chips"><span>서울</span><span>인천</span><span>대전</span><span>광주</span><span>대구</span><span class="on">부산</span><span>울산</span><span>제주</span></div>
  <div class="st" style="font-size:15px">직접 고른 곳은 나만 알고, 지민의 위치를 알아내는 게 아니에요</div>
</div>
<div class="dock"><div class="chunky">서울 → 부산 · 325km</div></div>`));

add4("v4-3-전체랭킹", "③ 전체 랭킹: 친구 + 모든 새 편지 사용자", "내가 원할 때만 이름을 보여요(기본은 '익명 새'). 이번 주·전체로 겨뤄요.", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:26px">랭킹 🏆</b><small>편지가 날아간 거리의 합이에요</small></div></div>
<div class="body" style="gap:10px">
  <div class="seg"><div>친구</div><div class="on">전체</div></div>
  <div class="seg"><div class="on">이번 주</div><div>전체 기간</div></div>
  <div class="sticker" style="background:#FFF3C9"><div style="font-size:26px;width:34px;text-align:center;font-weight:700">1</div><div class="face f2" style="width:52px;height:52px">${bird("crane", 42)}</div><div style="flex:1"><b>익명의 두루미</b><span class="d">서울 · 편지 14통</span></div><b style="color:#C1481F">5,820km</b></div>
  <div class="sticker"><div style="font-size:24px;width:34px;text-align:center;font-weight:700">2</div><div class="face f0" style="width:52px;height:52px">${bird("hawk", 42)}</div><div style="flex:1"><b>지민</b><span class="d">부산 · 편지 9통</span></div><b>4,310km</b></div>
  <div class="sticker"><div style="font-size:24px;width:34px;text-align:center;font-weight:700">3</div><div class="face f1" style="width:52px;height:52px">${bird("swallow", 42)}</div><div style="flex:1"><b>익명의 제비</b><span class="d">대전 · 편지 7통</span></div><b>3,950km</b></div>
  <div class="sticker" style="background:#F9E1D4"><div style="font-size:24px;width:34px;text-align:center;font-weight:700">128</div><div class="face f3" style="width:52px;height:52px">${bird("magpie", 42)}</div><div style="flex:1"><b>나</b><span class="d">서울 · 편지 3통</span></div><b>980km</b></div>
  <div class="opt" style="min-height:60px"><span class="rd" style="border-radius:8px"></span><div style="font-size:17px">전체 랭킹에 내 이름 보이기<small>끄면 '익명의 까치'로 나와요</small></div></div>
</div>
${tabs2(1)}`));

const STP = ["서울","인천","경기","강원","충북","충남","대전","세종","전북","전남","광주","경북","대구","경남","부산","울산","제주"];
const GOT = new Set(["서울","경기","대전","충남","대구","부산","경북","제주"]);
add4("v4-4-스탬프", "④ 스탬프 도감: 편지가 지나간 곳을 모아요", "편지가 지나가면 그 지역 스탬프가 찍혀요. 17곳을 다 모으면 '전국 일주' 배지.", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:26px">스탬프 도감</b><small>편지가 지나간 곳 8 / 17</small></div></div>
<div class="body" style="gap:12px">
  <div class="track" style="margin:6px 4px 14px"><i style="width:47%"></i><div class="bd" style="left:47%">${bird("magpie", 40)}</div></div>
  <div class="stamps">${STP.map((n) => `<div class="stp ${GOT.has(n) ? "got" : ""}"><div><b>${GOT.has(n) ? "🏮" : "?"}</b>${n}</div></div>`).join("")}</div>
  <div class="bubble" style="font-size:17px">짹짹! 강원·전남·울산… 아직 안 가 본 곳이 많아요</div>
</div>
${tabs2(2)}`));

add4("v4-5-비행이벤트", "⑤ 비행 중 이야기: 날아가며 생기는 일", "편지마다 정해진 작은 사건(도착 시각은 그대로). 지날 때마다 스탬프와 이야기가 대화에 쌓여요.", wrap2(`
${rhead("지민", "서울 → 부산 · 제비")}
${chatMap(0.55, "swallow", "도착까지 <em>3시간 40분</em>")}
<div class="chat">
  <div class="ev">🕊 제비가 출발했어요 <small>오전 9:00</small></div>
  <div class="ev">📍 천안을 지났어요 <small>오전 10:20 · 🏮 충남 스탬프!</small></div>
  <div class="ev" style="background:#E4EFE8">🌦 대전 상공에 소나기! 처마 밑에서 잠깐 쉬었어요 <small>오전 11:40</small></div>
  <div class="ev" style="background:#F8E6BC">🌰 속리산에서 도토리를 주웠어요 <small>오후 12:30 · 도감에 모았어요</small></div>
  <div class="ev" style="background:#fff">⏳ 오후 5:20쯤 도착해요 <small>지민님만 읽어요</small></div>
</div>
${comp("편지가 날아가는 중이에요", ["swallow", "제비"], false)}`));

const page4 = (body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}${boardCss}${CSS2}${CSS3}${CSS4}body{background:#d9d2c4}</style></head><body>${body}</body></html>`;
for (const s of v4) {
  const f = resolve(OUT, `${s.file}.html`);
  writeFileSync(f, page4(s.html));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=390,${844 + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, s.file + ".png")}`, "file://" + f], { stdio: "ignore" });
  const png = resolve(OUT, s.file + ".png");
  execFileSync("convert", [png, "-crop", `${390 * 2}x${844 * 2}+0+0`, "+repage", png]);
}
{
  const sheet4 = `<div style="padding:30px;background:#d9d2c4;width:${5 * 420 + 30}px"><div style="display:grid;grid-template-columns:repeat(5,390px);gap:30px"><div style="grid-column:1/-1;font-size:26px;font-weight:700">4차 시안: 위치 범위 · 전체 랭킹 · 스탬프 도감 · 비행 중 이야기</div>${v4.map((s) => `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${s.title}</div>${s.html}<div style="font-size:15px;color:#4a3f35;margin-top:6px;line-height:1.4">${s.note}</div></div>`).join("")}</div></div>`;
  const f = resolve(OUT, "v4-전체-한눈에.html");
  writeFileSync(f, page4(sheet4));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${5 * 420 + 30},${1000 + 87}`, "--force-device-scale-factor=1", `--screenshot=${resolve(OUT, "v4-전체-한눈에.png")}`, "file://" + f], { stdio: "ignore" });
  execFileSync("convert", [resolve(OUT, "v4-전체-한눈에.png"), "-crop", `${5 * 420 + 30}x1000+0+0`, "+repage", resolve(OUT, "v4-전체-한눈에.png")]);
}
console.log("4차 시안:", v4.length + 1);

/* ═════════ 5차 시안(v5): 펜팔 — 모르는 누군가에게 새 날려 보내기 ═════════ */
const CSS5 = `
.v2 .pp{background:linear-gradient(135deg,#1E3A5C,#2c5680);color:#fff;border-radius:28px;padding:18px 18px 16px;box-shadow:0 5px 0 #13263d}
.v2 .pp b{font-size:24px;display:block}.v2 .pp small{display:block;font-size:16px;opacity:.85;margin-top:4px;line-height:1.4}
.v2 .rule{display:flex;gap:10px;align-items:flex-start;font-size:18px;line-height:1.4;background:#fff;border-radius:18px;padding:10px 14px}
.v2 .rule i{font-style:normal;font-size:24px;flex:none}
.v2 .tagc{display:flex;flex-wrap:wrap;gap:8px}.v2 .tagc span{border:2px solid #cdbfa8;border-radius:20px;padding:6px 14px;font-size:17px;font-weight:700;color:#4a3f35}.v2 .tagc span.on{border-color:#C1481F;background:#F9E1D4;color:#C1481F}
.v2 .warnb{background:#FFF3C9;border-radius:16px;padding:8px 12px;font-size:15px;color:#5b4a1e;line-height:1.4}
.v2 .acts{display:flex;gap:8px}.v2 .acts div{flex:1;text-align:center;border-radius:20px;padding:14px 6px;font-size:18px;font-weight:700;background:#fff;box-shadow:0 3px 0 rgba(42,33,24,.1)}
.v2 .acts .hot{background:#C1481F;color:#fff;box-shadow:0 4px 0 #8f3210}
.v2 .menu{background:#fff;border-radius:28px 28px 0 0;padding:16px;box-shadow:0 -10px 28px rgba(42,33,24,.18)}
.v2 .menu div{min-height:58px;display:flex;align-items:center;justify-content:center;font-size:19px;font-weight:700;border-radius:18px;background:#FBF3E4;margin-bottom:8px}
.v2 .menu .red{color:#C1481F}
`;
const tabs5 = (on: number) => `<div class="tabs">${[["편지", I.mail], ["친구", I.people], ["랭킹", `<span style="font-size:26px">🏆</span>`]].map(([l, ico], i) => `<div class="${i === on ? "on" : ""}"><span>${ico}</span>${l}</div>`).join("")}</div>`;
const v5: { file: string; title: string; note: string; html: string }[] = [];
const add5 = (file: string, title: string, note: string, html: string) => v5.push({ file, title, note, html });

add5("v5-1-펜팔시작", "① 펜팔 시작: 어딘가로 새 날려 보내기", "친구 탭 맨 위에 입구. 처음 한 번 '펜팔 약속'(만 14세 이상·규칙)을 보고 시작해요.", wrap2(`
<div class="hello" style="padding-bottom:2px"><div><b style="font-size:26px">친구</b><small>함께 편지 나누는 사람들</small></div></div>
<div class="body" style="gap:12px">
  <div class="pp"><div style="display:flex;align-items:center;gap:10px">${bird("crane", 64, true)}<div><b>어딘가로 새 날려 보내기</b><small>모르는 누군가에게 편지가 날아가요.<br>답장이 오면 펜팔 친구가 돼요</small></div></div></div>
  <div style="font-size:19px;font-weight:700;margin-top:4px">펜팔 약속 (처음 한 번)</div>
  <div class="rule"><i>🎂</i><div>만 14세 이상만 쓸 수 있어요</div></div>
  <div class="rule"><i>🙊</i><div>전화번호·주소·SNS 아이디는 적지 않아요<small style="display:block;font-size:15px;color:#6B5E52">적으면 자동으로 가려져요</small></div></div>
  <div class="rule"><i>📷</i><div>첫 편지에는 사진을 담지 않아요</div></div>
  <div class="rule"><i>🚩</i><div>불쾌하면 길게 눌러 신고·차단해요</div></div>
</div>
<div class="dock"><div class="chunky">약속하고 시작하기</div></div>`));

add5("v5-2-펜팔쓰기", "② 쓰기: 받는 사람은 새가 정해요", "관심사를 고르면 비슷한 사람에게 날아가요(선택). 받는 곳은 상대가 정한 시·도까지만 알아요.", wrap2(`
<div class="hello" style="padding-bottom:2px"><span style="font-size:34px;margin-left:-6px">‹</span><div><b style="font-size:24px">누군가에게 쓰는 편지</b><small>두루미가 어딘가로 데려다줘요</small></div></div>
<div class="body" style="gap:12px">
  <div style="font-size:18px;font-weight:700">이런 사람에게 닿았으면 (고르지 않아도 돼요)</div>
  <div class="tagc"><span class="on">📚 책</span><span>🎵 음악</span><span class="on">✈️ 여행</span><span>🍳 요리</span><span>🐶 동물</span><span>🎮 게임</span><span>🌱 식물</span><span>⚽ 운동</span></div>
  <div class="paper" style="min-height:230px;color:#2A2118">안녕하세요, 처음 보는 누군가에게 편지를 써 보는 건 처음이에요. 요즘 읽고 있는 책은…</div>
  <div class="warnb">🙊 전화번호·주소·아이디처럼 보이는 글은 보내기 전에 가려져요 · 📷 첫 편지는 사진 없이</div>
</div>
<div class="dock"><div class="chunky">${bird("crane", 36)} 어딘가로 날려 보내기</div></div>`));

add5("v5-3-받음", "③ 받는 사람: 모르는 누군가의 편지가 날아와요", "날아오는 동안 함께 기다리고, 도착하면 펼쳐요. 답장하면 펜팔 시작, 넘기면 끝.", wrap2(`
${rhead("부산 사는 두루미", "모르는 누군가 · 📚 책 ✈️ 여행")}
${chatMap(1, "crane", "도착했어요! <em>💌</em>")}
<div class="chat">
  <div class="ev">🕊 서울 어딘가에서 두루미가 출발했어요 <small>어제 오후 8:10</small></div>
  <div class="lt you arrived"><div class="top">${bird("crane", 46, true)}<div><b>모르는 누군가의 편지</b><span class="d">오늘 오전 2:05 도착</span></div></div>
    <div class="paper">안녕하세요, 처음 보는 누군가에게 편지를 써 보는 건 처음이에요. 요즘 읽고 있는 책은…</div></div>
</div>
<div style="padding:10px 14px 16px;background:#fff;border-radius:24px 24px 0 0;box-shadow:0 -6px 18px rgba(42,33,24,.08)"><div class="acts"><div class="hot">✉ 답장하기</div><div>넘기기</div><div>🚩 신고</div></div><div class="st" style="text-align:center;font-size:14px;margin-top:6px">답장하면 펜팔 친구가 돼요 · 넘기면 다시 오지 않아요</div></div>`));

add5("v5-4-펜팔목록", "④ 편지 탭: 펜팔은 따로 모아요", "친구 편지와 섞이지 않게 '펜팔' 묶음. 이름 대신 상대가 정한 펜팔 이름(지역은 시·도까지).", wrap2(`
<div class="hello" style="padding-bottom:2px"><div><b style="font-size:26px">새 편지</b><small>기다림이 즐거운 편지</small></div></div>
<div class="body" style="gap:10px">
  <div style="font-size:17px;font-weight:700;color:#6B5E52">친구</div>
  <div class="sticker">${face("석영")}<div style="flex:1"><b>석영</b><span class="d">내가 보낸 편지가 도착했어요</span></div><span class="d">10월 17일</span></div>
  <div style="font-size:17px;font-weight:700;color:#6B5E52;margin-top:6px">펜팔 🌏</div>
  <div class="sticker" style="background:#EAF0F7"><div class="face f1">${bird("crane", 54)}</div><div style="flex:1"><b>부산 사는 두루미</b><span class="d">편지가 날아오는 중 · 내일 오전 도착</span>${mini(58, "crane")}</div></div>
  <div class="sticker" style="background:#EAF0F7"><div class="face f2">${bird("swallow", 54)}</div><div style="flex:1"><b>제주 사는 제비</b><span class="d">답장을 기다리는 중</span></div><span class="d">10월 15일</span></div>
  <div class="pp" style="padding:12px 16px;margin-top:6px"><div style="display:flex;align-items:center;gap:8px">${bird("crane", 40)}<b style="font-size:19px">또 다른 누군가에게 날려 보내기</b></div></div>
</div>
${tabs5(0)}`));

add5("v5-5-안전", "⑤ 안전: 길게 누르면 신고·차단", "신고가 쌓이면 그 사람은 펜팔을 잠시 쉬어요. 차단하면 서로 다시 만나지 않아요.", wrap2(`
${rhead("제주 사는 제비", "펜팔 · 🎵 음악")}
<div class="chat" style="position:relative"><div class="lt you"><div class="top">${bird("swallow", 46)}<div><b>제비가 보낸 편지</b><span class="d">읽었어요</span></div></div></div></div>
<div class="dim"></div>
<div class="menu" style="position:relative;z-index:2"><h4 style="text-align:center;font-size:20px;margin-bottom:10px">제주 사는 제비</h4>
  <div>✎ 내가 부를 이름 정하기</div><div>👥 친구로 맺기 (서로 동의하면)</div><div class="red">🚩 신고하기</div><div class="red">⛔ 차단하기</div><div style="background:transparent;color:#8a7c6f">취소</div>
</div>`));

const page5 = (body: string) => `<!doctype html><html lang="ko"><head><meta charset="utf-8"><style>${CSS}${boardCss}${CSS2}${CSS3}${CSS4}${CSS5}body{background:#d9d2c4}</style></head><body>${body}</body></html>`;
for (const s of v5) {
  const f = resolve(OUT, `${s.file}.html`);
  writeFileSync(f, page5(s.html));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=390,${844 + 87}`, "--force-device-scale-factor=2", `--screenshot=${resolve(OUT, s.file + ".png")}`, "file://" + f], { stdio: "ignore" });
  const png = resolve(OUT, s.file + ".png");
  execFileSync("convert", [png, "-crop", `${390 * 2}x${844 * 2}+0+0`, "+repage", png]);
}
{
  const sheet5 = `<div style="padding:30px;background:#d9d2c4;width:${5 * 420 + 30}px"><div style="display:grid;grid-template-columns:repeat(5,390px);gap:30px"><div style="grid-column:1/-1;font-size:26px;font-weight:700">5차 시안: 펜팔 — 모르는 누군가에게 새 날려 보내기</div>${v5.map((s) => `<div><div style="font-size:20px;font-weight:700;margin-bottom:8px">${s.title}</div>${s.html}<div style="font-size:15px;color:#4a3f35;margin-top:6px;line-height:1.4">${s.note}</div></div>`).join("")}</div></div>`;
  const f = resolve(OUT, "v5-전체-한눈에.html");
  writeFileSync(f, page5(sheet5));
  execFileSync("/opt/pw-browsers/chromium", ["--headless", "--no-sandbox", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files", `--window-size=${5 * 420 + 30},${1000 + 87}`, "--force-device-scale-factor=1", `--screenshot=${resolve(OUT, "v5-전체-한눈에.png")}`, "file://" + f], { stdio: "ignore" });
  execFileSync("convert", [resolve(OUT, "v5-전체-한눈에.png"), "-crop", `${5 * 420 + 30}x1000+0+0`, "+repage", resolve(OUT, "v5-전체-한눈에.png")]);
}
console.log("5차 시안:", v5.length + 1);
