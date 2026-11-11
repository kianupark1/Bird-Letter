// 오늘(한국 시간) 올릴 홍보 글을 스레드·인스타그램·X에 올려요: node scripts/auto-post.mjs [--send] [--date 2026-10-02] [--slot noon|evening]
// 기본은 "미리보기"예요(실제로 올리지 않고 무엇을 올릴지만 보여 줌). --send 를 붙여야 진짜로 올라가요.
// 일정은 promo/schedule.json, 매일 자동 실행은 .github/workflows/auto-post.yml, 열쇠 자동 갱신은 refresh-tokens.yml 이에요.
//
// 필요한 비밀값(GitHub 레포 Settings → Secrets and variables → Actions 에 넣기, 코드에 적지 마세요):
//   THREADS_ACCESS_TOKEN                                      스레드(Threads API). THREADS_USER_ID는 없어도 됨(없으면 열쇠로 알아냄)
//   IG_ACCESS_TOKEN                                           인스타그램(인스타그램 로그인으로 받은 열쇠). IG_USER_ID는 없어도 됨(없으면 열쇠로 알아냄)
//   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET  X(쓴 만큼 내는 요금, 글 1개 약 0.015달러·링크가 있으면 0.2달러 「미확인」)
//   YT_CLIENT_ID, YT_CLIENT_SECRET, YT_REFRESH_TOKEN          유튜브 쇼츠(영상 글만, scripts/youtube-login.mjs 로 받음)
// 선택: YT_PRIVACY=public  유튜브 API 심사를 통과한 뒤에만(심사 전 프로젝트는 유튜브가 "비공개"로만 올려 줘요 → 기본 private)
// 선택: IG_LOGIN=facebook   인스타 열쇠를 "페이스북 페이지 연결"로 받았을 때만(2026-11-09부터 기본은 인스타그램 로그인)
// 열쇠 확인: node scripts/auto-post.mjs --check  (스레드·인스타 열쇠가 맞는지 계정 이름만 확인, 아무것도 안 올림)
//       MEDIA_BASE_URL       그림·영상이 올라가 있는 공개 주소(기본: 이 레포 main 브랜치의 promo 폴더)
// 글의 image는 promo/cards 안 파일, video는 promo 아래 경로(예: video/saepyeonji-15s.mp4 → 인스타 릴스·스레드 영상, X는 표지 사진)
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { createHmac, randomBytes } from "node:crypto";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const dateArg = args.includes("--date") ? args[args.indexOf("--date") + 1] : null;
const today = dateArg ?? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date()); // YYYY-MM-DD
// 하루 두 번(2026-11-04 대표님: "매번 똑같이보다 다르게 자주"): 아침 8시 30분(2026-11-09부터, 예전 낮 12시) = slot 없는 글(귀여운 그림), 저녁 6시(예전 8시) = slot "evening" 글(클래식 그림)
let SLOT = args.includes("--slot") ? args[args.indexOf("--slot") + 1] : "noon";
// 예약 실행이 몇 시간씩 늦게 도는 일이 있어서(2026-11-10: 저녁 6시 글이 새벽 4시 반에 올라감) "auto"는 지금 한국 시각으로 정해요:
// 8시 이후면 아침 글, 17시 30분 이후면 저녁 글 중 아직 안 올린 것 하나. 0~7시엔 아무것도 안 올려요. 올린 기록은 LOG_FILE(한 줄에 "날짜 slot")
// 밤 10시 30분 글(2026-11-10 대표님: "밤 10시 30분에도 한 번") = slot "night", 22시 30분 이후
export function autoSlot(hm, done) {
  if (hm < 800) return null;
  if (hm >= 2230 && !done.has("night")) return "night";
  if (hm >= 1730 && !done.has("evening")) return "evening";
  if (!done.has("noon")) return hm < 1730 || done.has("evening") ? "noon" : null;
  return null;
}
export const slotOf = (p) => (p.slot === "evening" || p.slot === "night" ? p.slot : "noon");
const MEDIA_BASE = (process.env.MEDIA_BASE_URL ?? "https://raw.githubusercontent.com/kianupark1/Bird-Letter/main/promo").replace(/\/$/, "");
const env = (k) => (process.env[k] ?? "").trim().replace(/^﻿/, "");
const promoFile = (rel) => new URL(`../promo/${rel}`, import.meta.url);
const imageRel = (p) => (p.image ? `cards/${p.image}` : p.video ? (p.cover ?? p.video.replace(/\.mp4$/, "-cover.png")) : null);

// 업그레이드 영상(힉스필드 등으로 다시 만든 것): promo/video/v2/ 에 같은 이름으로 넣으면, 그날부터 올라가는 글은 새 영상을 써요.
// 이미 올라간 글은 그대로예요(지우거나 바꾸지 않음). 표지(-cover.png)가 v2에 없으면 예전 표지를 써요.
export function upgraded(p, exists = (rel) => existsSync(promoFile(rel))) {
  if (!p.video || p.video.startsWith("video/v2/")) return p;
  const v2 = p.video.replace(/^video\//, "video/v2/");
  if (!exists(v2)) return p;
  const cover = v2.replace(/\.mp4$/, "-cover.png");
  return { ...p, video: v2, cover: exists(cover) ? cover : p.video.replace(/\.mp4$/, "-cover.png") };
}

// 글마다 날짜(date) 대신 출시일 기준 며칠째(day: -3 = 출시 3일 전, 0 = 출시일)를 쓸 수 있어요.
// 출시일(launch)이 정해지기 전(null)에는 day 글은 하나도 올라가지 않아요.
// 안드로이드가 나오기 전에는 첫 장에 "안드로이드는 곧 출시" 띠를 붙인 사본을 써요(2026-11-10 대표님, 사본은 promo/build-soon.mts가 만듦)
export function soonify(p, android, exists = (rel) => existsSync(promoFile(rel))) {
  if (android) return p;
  if (p.carousel?.length) {
    const first = `soon/${p.carousel[0]}`;
    return exists(`cards/${first}`) ? { ...p, image: first, carousel: [first, ...p.carousel.slice(1)] } : p;
  }
  if (p.image) return exists(`cards/soon/${p.image}`) ? { ...p, image: `soon/${p.image}` } : p;
  if (p.video) {
    const v = `video/soon/${p.video.split("/").pop()}`;
    if (!exists(v)) return p;
    const cover = v.replace(/\.mp4$/, "-cover.png");
    return { ...p, video: v, cover: exists(cover) ? cover : p.cover };
  }
  return p;
}
// 영상 글도 넘겨 보는 여러 장으로(2026-11-10 대표님: "광고 여러 카드로, 어디든"): 1장 영상(4:5, promo/video/card/) → 이렇게 써요·시작이 쉬워요·첫 편지
export const STORY_TAIL = ["story/how.png", "story/easy.png", "story/cta.png"];
export const isVid = (f) => /\.mp4$/i.test(f);
export function storyfy(p, exists = (rel) => existsSync(promoFile(rel))) {
  if (!p.video || p.carousel?.length) return p;
  const card = `video/card/${p.video.split("/").pop()}`;
  return exists(card) ? { ...p, carousel: [card, ...STORY_TAIL] } : p;
}
const itemUrl = (f, jpg = (x) => x) => (isVid(f) ? `${MEDIA_BASE}/${f}` : `${MEDIA_BASE}/cards/${jpg(f)}`);
const { launch, posts, stores = {}, channels, igUserId } = JSON.parse(readFileSync(promoFile("schedule.json"), "utf8"));
// 지금 집중하는 채널만 올림(schedule.json channels, 없으면 글에 적힌 곳 전부). 2026-11-09 대표님: 인스타·스레드·틱톡에 집중.
export const targetsOf = (p, ch = channels) => (Array.isArray(ch) ? p.to.filter((t) => ch.includes(t)) : p.to);

// 글 속 {{받기}} 자리: 나온 스토어 주소만 넣어요(아이폰 먼저 출시). 인스타는 글 속 링크가 눌리지 않아서 프로필 링크로 안내해요.
export function storeLines(st, to) {
  if (!st.ios && !st.android) throw new Error("schedule.json의 stores에 스토어 주소가 없어요(출시 날 ios 주소를 넣어 주세요)");
  // 모든 채널 글에 스토어 바로 가기 주소(2026-11-10 대표님: "글에 앱스토어 바로 가기 넣어 줘야 함").
  // 인스타는 글 속 링크가 눌리지 않아서 프로필 링크 안내를 한 줄 더 붙여요(주소는 복사해 쓸 수 있게 그대로 둠).
  const out = [];
  if (st.ios) out.push(`👉 앱스토어 바로 가기 ${st.ios}`);
  if (st.android) out.push(`👉 구글 플레이 바로 가기 ${st.android}`);
  // 플레이 전에는 갤럭시 스토어(삼성 폰)로, 플레이는 곧(2026-11-11 대표님)
  else if (st.galaxy) out.push(`👉 갤럭시 스토어 바로 가기 ${st.galaxy}`, "구글 플레이는 곧 출시돼요");
  else out.push("안드로이드 앱은 곧 나와요");
  if (to === "instagram") out.push("(링크가 안 눌리면 프로필 링크로 🕊)");
  return out.join("\n");
}
// 슬로건은 모든 글에 꼭 들어가요(promo/store.mts SLOGAN과 같은 글자, 2026-10-26 대표님: "무조건적으로"). 해시태그 줄 바로 위에 넣어요.
export const SLOGAN = "기다림도 소통의 일부입니다.";
export function withSlogan(text) {
  if (text.includes(SLOGAN)) return text;
  const lines = text.trimEnd().split("\n");
  if (lines.length > 1 && lines[lines.length - 1].trim().startsWith("#")) {
    const tags = lines.pop();
    return `${lines.join("\n").trimEnd()}\n\n${SLOGAN}\n\n${tags}`;
  }
  return `${lines.join("\n")}\n\n${SLOGAN}`;
}
export const fillText = (p, to, st = stores) => {
  const text = p.text.includes("{{받기}}") ? p.text.replaceAll("{{받기}}", storeLines(st, to)) : p.text;
  return { ...p, text: withSlogan(text) };
};
const dateOf = (p) => {
  if (p.date) return p.date;
  if (typeof p.day !== "number" || !/^\d{4}-\d{2}-\d{2}$/.test(launch ?? "")) return null;
  const d = new Date(launch + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + p.day);
  return d.toISOString().slice(0, 10);
};

async function call(url, { method = "POST", params, headers, body } = {}) {
  const res = await fetch(url, { method, headers, body: body ?? (params ? new URLSearchParams(params) : undefined) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error || json.errors) throw new Error(`${url.split("?")[0]} → ${res.status} ${JSON.stringify(json.error ?? json.errors ?? json)}`);
  return json;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
/** 영상은 서버가 처리할 때까지 기다렸다가 올려요(최대 5분) */
async function waitReady(url, field, ok = "FINISHED") {
  for (let i = 0; i < 30; i++) {
    const s = await call(url, { method: "GET" });
    if (s[field] === ok) return;
    if (s[field] === "ERROR" || s[field] === "EXPIRED") throw new Error(`영상 처리 실패: ${JSON.stringify(s)}`);
    await sleep(10000);
  }
  throw new Error("영상 처리가 5분 넘게 안 끝났어요");
}

// 열쇠 종류: "EAA…"로 시작하면 페이스북식(통합 로그인·시스템 사용자 열쇠, 만료 없음) → graph.facebook.com
export const igHostFor = (token, login) => (login === "facebook" || /^EAA/.test(token || "") ? "https://graph.facebook.com" : "https://graph.instagram.com");
const igHost = () => igHostFor(env("IG_ACCESS_TOKEN"), env("IG_LOGIN"));
/** 게시할 인스타 계정 번호: IG_USER_ID > (페이스북식 열쇠면) schedule.json igUserId > 열쇠로 알아냄 */
async function igAccount(host, token) {
  if (env("IG_USER_ID")) return env("IG_USER_ID");
  if (host.includes("facebook") && igUserId) return igUserId;
  const me = await call(`${host}/v21.0/me?fields=user_id,id&access_token=${encodeURIComponent(token)}`, { method: "GET" });
  return me.user_id ?? me.id;
}

/** 열쇠 확인(--check): 계정 이름만 읽어 봐요. 아무것도 올리지 않아요. */
async function checkKeys() {
  let bad = 0;
  const t = env("THREADS_ACCESS_TOKEN");
  if (!t) { bad++; console.log("✗ 스레드: THREADS_ACCESS_TOKEN 이 아직 없어요"); }
  else try { const me = await call(`https://graph.threads.net/v1.0/me?fields=id,username&access_token=${encodeURIComponent(t)}`, { method: "GET" }); console.log(`✓ 스레드 열쇠 OK → @${me.username}`); }
  catch (e) { bad++; console.log("✗ 스레드 열쇠가 맞지 않아요 → " + e.message.slice(0, 200)); }
  const g = env("IG_ACCESS_TOKEN");
  if (!g) { bad++; console.log("✗ 인스타: IG_ACCESS_TOKEN 이 아직 없어요"); }
  else try { const h = igHost(); const id = await igAccount(h, g); const me = await call(`${h}/v21.0/${id}?fields=id,username&access_token=${encodeURIComponent(g)}`, { method: "GET" }); console.log(`✓ 인스타 열쇠 OK → @${me.username} (${h.includes("facebook") ? "통합 로그인 열쇠" : "인스타 로그인 열쇠"})`); }
  catch (e) { bad++; console.log("✗ 인스타 열쇠가 맞지 않아요 → " + e.message.slice(0, 200)); }
  if (!Array.isArray(channels) || channels.includes("x")) {
    const k = { key: env("X_API_KEY"), secret: env("X_API_SECRET"), token: env("X_ACCESS_TOKEN"), tokenSecret: env("X_ACCESS_SECRET") };
    const miss = Object.entries({ X_API_KEY: k.key, X_API_SECRET: k.secret, X_ACCESS_TOKEN: k.token, X_ACCESS_SECRET: k.tokenSecret }).filter(([, v]) => !v).map(([n]) => n);
    if (miss.length) { bad++; console.log("✗ X: 아직 없는 열쇠 → " + miss.join(", ")); }
    else try { const u = "https://api.x.com/2/users/me"; const me = await call(u, { method: "GET", headers: { Authorization: oauthHeader("GET", u, k) } }); console.log(`✓ X 열쇠 OK → @${me.data?.username}`); }
    catch (e) { bad++; console.log("✗ X 열쇠 확인 실패(크레딧이 0이면 이렇게 나올 수 있어요) → " + e.message.slice(0, 200)); }
  }
  return bad;
}

async function postThreads(p) {
  const token = env("THREADS_ACCESS_TOKEN");
  if (!token) throw new Error("THREADS_ACCESS_TOKEN 이 없어요");
  const id = env("THREADS_USER_ID") || (await call(`https://graph.threads.net/v1.0/me?fields=id&access_token=${encodeURIComponent(token)}`, { method: "GET" })).id;
  const base = `https://graph.threads.net/v1.0/${id}`;
  // 넘겨 보는 글(carousel: 카드 2~10장): 장마다 먼저 올려 두고 한 글로 묶어요
  if (p.carousel?.length > 1) {
    const kids = [];
    for (const f of p.carousel.slice(0, 10)) {
      const m = isVid(f) ? { media_type: "VIDEO", video_url: itemUrl(f) } : { media_type: "IMAGE", image_url: itemUrl(f) };
      const k = (await call(`${base}/threads`, { params: { ...m, is_carousel_item: "true", access_token: token } })).id;
      if (isVid(f)) await waitReady(`https://graph.threads.net/v1.0/${k}?fields=status&access_token=${encodeURIComponent(token)}`, "status");
      kids.push(k);
    }
    await sleep(10000);
    const c = await call(`${base}/threads`, { params: { media_type: "CAROUSEL", children: kids.join(","), text: p.text, access_token: token } });
    await sleep(8000);
    return call(`${base}/threads_publish`, { params: { creation_id: c.id, access_token: token } });
  }
  const media = p.video ? { media_type: "VIDEO", video_url: `${MEDIA_BASE}/${p.video}` }
    : p.image ? { media_type: "IMAGE", image_url: `${MEDIA_BASE}/cards/${p.image}` } : { media_type: "TEXT" };
  const c = await call(`${base}/threads`, { params: { text: p.text, access_token: token, ...media } });
  if (p.video) await waitReady(`https://graph.threads.net/v1.0/${c.id}?fields=status&access_token=${encodeURIComponent(token)}`, "status");
  else await sleep(p.image ? 8000 : 2000); // 이미지는 처리 시간이 필요해요
  return call(`${base}/threads_publish`, { params: { creation_id: c.id, access_token: token } });
}

// 인스타 자동 게시는 JPG 사진만 받아요 → 카드마다 같은 이름의 .jpg를 같이 둠(promo/cards/*.jpg)
export const igJpg = (f) => f.replace(/\.png$/i, ".jpg");
async function postInstagram(p) {
  const token = env("IG_ACCESS_TOKEN");
  if (!token) throw new Error("IG_ACCESS_TOKEN 이 없어요");
  if (!p.image && !p.video) throw new Error("인스타그램은 사진이나 영상이 꼭 필요해요");
  const host = igHost();
  // 인스타그램 로그인 열쇠: user_id = 게시용 인스타 프로페셔널 계정 번호(id는 앱 전용 번호라 쓰지 않음)
  const id = await igAccount(host, token);
  const base = `${host}/v21.0/${id}`;
  if (p.carousel?.length > 1) {
    const kids = [];
    for (const f of p.carousel.slice(0, 10)) {
      const m = isVid(f) ? { media_type: "VIDEO", video_url: itemUrl(f) } : { image_url: itemUrl(f, igJpg) };
      const k = (await call(`${base}/media`, { params: { ...m, is_carousel_item: "true", access_token: token } })).id;
      if (isVid(f)) await waitReady(`${host}/v21.0/${k}?fields=status_code&access_token=${encodeURIComponent(token)}`, "status_code");
      kids.push(k);
    }
    await sleep(8000);
    const c = await call(`${base}/media`, { params: { media_type: "CAROUSEL", children: kids.join(","), caption: p.text, access_token: token } });
    await sleep(8000);
    return call(`${base}/media_publish`, { params: { creation_id: c.id, access_token: token } });
  }
  const media = p.video ? { media_type: "REELS", video_url: `${MEDIA_BASE}/${p.video}`, share_to_feed: "true" } : { image_url: `${MEDIA_BASE}/cards/${igJpg(p.image)}` };
  const c = await call(`${base}/media`, { params: { caption: p.text, access_token: token, ...media } });
  if (p.video) await waitReady(`${host}/v21.0/${c.id}?fields=status_code&access_token=${encodeURIComponent(token)}`, "status_code");
  else await sleep(8000);
  return call(`${base}/media_publish`, { params: { creation_id: c.id, access_token: token } });
}

// ── X ──────────────────────────────────────────────────────────────
// X는 글자 수를 한글·이모지 2칸, 영문·숫자 1칸으로 세서 280칸까지예요. 링크가 있으면 글값이 13배라서 링크 줄은 빼요(앱 주소는 프로필에).
// X는 주소를 길이와 상관없이 23칸으로 셈
const xWeight = (s) => [...s.replace(/https?:\/\/\S+/g, "x".repeat(23))].reduce((n, ch) => n + (/[\u0000-ჿ -‍‐-‟′-‷]/.test(ch) ? 1 : 2), 0);
export function xText(p) {
  if (p.xText) return p.xText.includes(SLOGAN) || xWeight(`${p.xText}\n\n${SLOGAN}`) > 280 ? p.xText : `${p.xText}\n\n${SLOGAN}`;
  // 슬로건은 줄일 때도 남겨요(해시태그처럼 끝에 따로 붙임)
  // 스토어 바로 가기 줄은 줄일 때도 남겨요(슬로건 바로 위)
  const links = p.text.split("\n").filter((l) => /https?:\/\//.test(l)).map((l) => l.trim());
  const lines = p.text.split("\n").filter((l) => !/https?:\/\//.test(l) && !/^(안드로이드|아이폰):/.test(l.trim()) && l.trim() !== SLOGAN);
  const tags = lines.length && lines[lines.length - 1].trim().startsWith("#") ? lines.pop() : "";
  let body = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const head = links.length ? `${links.join("\n")}\n\n` : "";
  const tail = head + (tags ? `${SLOGAN}\n\n${tags}` : SLOGAN);
  const join = () => `${body}\n\n${tail}`;
  while (xWeight(join()) > 280 && body.includes("\n")) body = body.slice(0, body.lastIndexOf("\n")).trim(); // 넘치면 뒤 줄부터 덜어내요
  // 그래도 넘치면 본문만 줄이고 슬로건은 끝까지 온전히 남겨요(2026-11-09 대표님: "완전한 슬로건으로")
  while (xWeight(join()) > 280 && body.length > 1) body = [...body].slice(0, -2).join("").trimEnd() + "…";
  return join();
}
const pct = (s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
/** OAuth 1.0a 서명(X 공식 방식). 본문(JSON·사진)은 서명에 넣지 않아요 */
export function oauthHeader(method, url, keys, extra = {}, nonce = randomBytes(16).toString("hex"), ts = Math.floor(Date.now() / 1000).toString()) {
  const o = { oauth_consumer_key: keys.key, oauth_nonce: nonce, oauth_signature_method: "HMAC-SHA1", oauth_timestamp: ts, oauth_token: keys.token, oauth_version: "1.0" };
  const all = { ...o, ...extra };
  const paramStr = Object.keys(all).sort().map((k) => `${pct(k)}=${pct(all[k])}`).join("&");
  const base = [method.toUpperCase(), pct(url), pct(paramStr)].join("&");
  const sig = createHmac("sha1", `${pct(keys.secret)}&${pct(keys.tokenSecret)}`).update(base).digest("base64");
  return "OAuth " + Object.entries({ ...o, oauth_signature: sig }).map(([k, v]) => `${pct(k)}="${pct(v)}"`).join(", ");
}
async function postX(p) {
  const keys = { key: env("X_API_KEY"), secret: env("X_API_SECRET"), token: env("X_ACCESS_TOKEN"), tokenSecret: env("X_ACCESS_SECRET") };
  if (Object.values(keys).some((v) => !v)) throw new Error("X_API_KEY / X_API_SECRET / X_ACCESS_TOKEN / X_ACCESS_SECRET 이 없어요");
  let mediaId;
  const img = imageRel(p);
  if (p.carousel?.length > 1) { // X는 사진 4장까지
    const ids = [];
    for (const f of p.carousel.slice(0, 4)) {
      const up = "https://api.x.com/2/media/upload";
      const form = new FormData();
      const rel = isVid(f) ? (p.cover ?? p.video.replace(/\.mp4$/, "-cover.png")) : `cards/${f}`; // X는 영상 대신 표지
      form.append("media", new Blob([readFileSync(promoFile(rel))], { type: "image/png" }), "card.png");
      form.append("media_category", "tweet_image");
      const r = await call(up, { headers: { Authorization: oauthHeader("POST", up, keys) }, body: form });
      ids.push(r.data?.id ?? r.media_id_string);
    }
    const url = "https://api.x.com/2/tweets";
    return call(url, { headers: { Authorization: oauthHeader("POST", url, keys), "Content-Type": "application/json" }, body: JSON.stringify({ text: xText(p), media: { media_ids: ids } }) });
  }
  if (img) {
    const up = "https://api.x.com/2/media/upload";
    const form = new FormData();
    form.append("media", new Blob([readFileSync(promoFile(img))], { type: "image/png" }), "card.png");
    form.append("media_category", "tweet_image");
    const r = await call(up, { headers: { Authorization: oauthHeader("POST", up, keys) }, body: form });
    mediaId = r.data?.id ?? r.media_id_string;
    if (!mediaId) throw new Error("X 사진 올리기 결과에 번호가 없어요: " + JSON.stringify(r));
  }
  const url = "https://api.x.com/2/tweets";
  return call(url, { headers: { Authorization: oauthHeader("POST", url, keys), "Content-Type": "application/json" },
    body: JSON.stringify({ text: xText(p), ...(mediaId ? { media: { media_ids: [mediaId] } } : {}) }) });
}

// ── 유튜브 쇼츠 ─────────────────────────────────────────────────────
// 세로 60초 이하 영상은 쇼츠로 올라가요. 심사(무료) 전에는 유튜브가 비공개로만 올려 줘서, 대표님이 스튜디오 앱에서 "공개"만 눌러요.
export function ytMeta(p, privacy = "private") {
  const lines = p.text.split("\n").map((l) => l.trim());
  const tags = (lines.find((l) => l.startsWith("#")) ?? "").split(/\s+/).filter((t) => t.startsWith("#")).map((t) => t.slice(1));
  const head = lines.find((l) => l && !l.startsWith("#")) ?? "새 편지";
  const title = [...`${head} #Shorts`].length <= 100 ? `${head} #Shorts` : [...head].slice(0, 90).join("") + "… #Shorts";
  return { snippet: { title, description: p.text, tags: [...new Set(["새편지", ...tags])].slice(0, 15), categoryId: "22", defaultLanguage: "ko" },
    status: { privacyStatus: privacy, selfDeclaredMadeForKids: false } };
}
async function postYouTube(p) {
  if (!p.video) throw new Error("유튜브는 영상 글만 올려요");
  const id = env("YT_CLIENT_ID"), secret = env("YT_CLIENT_SECRET"), refresh = env("YT_REFRESH_TOKEN");
  if (!id || !secret || !refresh) throw new Error("YT_CLIENT_ID / YT_CLIENT_SECRET / YT_REFRESH_TOKEN 이 없어요");
  const tok = await call("https://oauth2.googleapis.com/token", { params: { client_id: id, client_secret: secret, refresh_token: refresh, grant_type: "refresh_token" } });
  const file = readFileSync(promoFile(p.video));
  const start = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST", body: JSON.stringify(ytMeta(p, env("YT_PRIVACY") || "private")),
    headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(file.length) },
  });
  const where = start.headers.get("location");
  if (!start.ok || !where) throw new Error(`유튜브 올리기 시작 실패 → ${start.status} ${await start.text()}`);
  return call(where, { method: "PUT", headers: { "Content-Type": "video/mp4" }, body: file });
}

export const POSTERS = { threads: postThreads, instagram: postInstagram, x: postX, youtube: postYouTube };

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href && args.includes("--check")) {
  process.exit((await checkKeys()) ? 1 : 0);
}
if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href && !args.includes("--check")) {
  if (!launch) console.log("출시일(launch)이 아직 비어 있어서 출시 일정 글은 쉬어요");
  const LOG = process.env.LOG_FILE;
  const logged = new Set(LOG && existsSync(LOG) ? readFileSync(LOG, "utf8").split("\n").filter((l) => l.startsWith(today + " ")).map((l) => l.split(" ")[1]) : []);
  if (SLOT === "auto") {
    const hm = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date()).replace(":", ""));
    SLOT = autoSlot(hm, logged);
    if (!SLOT) { console.log(`지금(한국 ${String(hm).padStart(4, "0")})은 올릴 차례가 아니거나 이미 올렸어요`); process.exit(0); }
  } else if (SEND && logged.has(SLOT)) { console.log(`${today} ${SLOT} 글은 이미 올렸어요`); process.exit(0); }
  const todays = posts.filter((p) => dateOf(p) === today && slotOf(p) === SLOT).map((p) => storyfy(soonify(upgraded(p), stores.android)));
  console.log(`${today} ${SLOT === "evening" ? "저녁" : SLOT === "night" ? "밤" : "아침"} 올릴 글: ${todays.length}개 ${SEND ? "(실제로 올림)" : "(미리보기: 올리지 않음)"}`);
  let failed = 0;
  for (const p of todays) {
    for (const to of targetsOf(p)) {
      let q;
      try { q = fillText(p, to); } catch (e) { failed++; console.log(`  ✗ [${to}] ${e.message}`); continue; }
      const media = p.carousel ? ` (+넘겨 보는 ${p.carousel.length}장${p.video ? ", 첫 장 영상" : ""})` : p.video ? ` (+영상 ${p.video})` : p.image ? ` (+${p.image})` : "";
      const label = `[${to}] ${q.text.split("\n")[0].slice(0, 30)}…${media}${to === "x" ? ` · X ${xWeight(xText(q))}/280칸` : ""}`;
      if (!SEND) { console.log("  미리보기 " + label); console.log((to === "x" ? xText(q) : q.text).replace(/^/gm, "      │ ")); continue; }
      try {
        if (!POSTERS[to]) throw new Error(`모르는 곳: ${to}`);
        await POSTERS[to](q);
        console.log("  ✓ 올림 " + label);
      } catch (e) {
        failed++;
        console.log("  ✗ 실패 " + label + " → " + e.message);
      }
    }
  }
  // 하나라도 올라갔으면 기록(같은 글이 두 번 올라가지 않게)
  if (SEND && LOG && todays.length && failed < todays.reduce((n, p) => n + targetsOf(p).length, 0)) appendFileSync(LOG, `${today} ${SLOT}\n`);
  process.exit(failed ? 1 : 0);
}
export { call, igHost, igAccount, env };
