// 오늘(한국 시간) 올릴 홍보 글을 스레드·인스타그램·X에 올려요: node scripts/auto-post.mjs [--send] [--date 2026-10-02]
// 기본은 "미리보기"예요(실제로 올리지 않고 무엇을 올릴지만 보여 줌). --send 를 붙여야 진짜로 올라가요.
// 일정은 promo/schedule.json, 매일 자동 실행은 .github/workflows/auto-post.yml, 열쇠 자동 갱신은 refresh-tokens.yml 이에요.
//
// 필요한 비밀값(GitHub 레포 Settings → Secrets and variables → Actions 에 넣기, 코드에 적지 마세요):
//   THREADS_USER_ID, THREADS_ACCESS_TOKEN                     스레드(Threads API)
//   IG_USER_ID, IG_ACCESS_TOKEN                               인스타그램(비즈니스 계정, Graph API)
//   X_API_KEY, X_API_SECRET, X_ACCESS_TOKEN, X_ACCESS_SECRET  X(쓴 만큼 내는 요금, 글 1개 약 0.015달러·링크가 있으면 0.2달러 「미확인」)
// 선택: IG_LOGIN=instagram  인스타 열쇠를 "인스타그램 로그인"으로 받았으면(기본은 페이스북 페이지 연결)
//       MEDIA_BASE_URL       그림·영상이 올라가 있는 공개 주소(기본: 이 레포 main 브랜치의 promo 폴더)
// 글의 image는 promo/cards 안 파일, video는 promo 아래 경로(예: video/saepyeonji-15s.mp4 → 인스타 릴스·스레드 영상, X는 표지 사진)
import { readFileSync } from "node:fs";
import { createHmac, randomBytes } from "node:crypto";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const dateArg = args.includes("--date") ? args[args.indexOf("--date") + 1] : null;
const today = dateArg ?? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date()); // YYYY-MM-DD
const MEDIA_BASE = (process.env.MEDIA_BASE_URL ?? "https://raw.githubusercontent.com/kianupark1/Bird-Letter/main/promo").replace(/\/$/, "");
const env = (k) => (process.env[k] ?? "").trim().replace(/^﻿/, "");
const promoFile = (rel) => new URL(`../promo/${rel}`, import.meta.url);
const imageRel = (p) => (p.image ? `cards/${p.image}` : p.video ? p.video.replace(/\.mp4$/, "-cover.png") : null);

// 글마다 날짜(date) 대신 출시일 기준 며칠째(day: -3 = 출시 3일 전, 0 = 출시일)를 쓸 수 있어요.
// 출시일(launch)이 정해지기 전(null)에는 day 글은 하나도 올라가지 않아요.
const { launch, posts } = JSON.parse(readFileSync(promoFile("schedule.json"), "utf8"));
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

async function postThreads(p) {
  const id = env("THREADS_USER_ID"), token = env("THREADS_ACCESS_TOKEN");
  if (!id || !token) throw new Error("THREADS_USER_ID / THREADS_ACCESS_TOKEN 이 없어요");
  const base = `https://graph.threads.net/v1.0/${id}`;
  const media = p.video ? { media_type: "VIDEO", video_url: `${MEDIA_BASE}/${p.video}` }
    : p.image ? { media_type: "IMAGE", image_url: `${MEDIA_BASE}/cards/${p.image}` } : { media_type: "TEXT" };
  const c = await call(`${base}/threads`, { params: { text: p.text, access_token: token, ...media } });
  if (p.video) await waitReady(`https://graph.threads.net/v1.0/${c.id}?fields=status&access_token=${encodeURIComponent(token)}`, "status");
  else await sleep(p.image ? 8000 : 2000); // 이미지는 처리 시간이 필요해요
  return call(`${base}/threads_publish`, { params: { creation_id: c.id, access_token: token } });
}

async function postInstagram(p) {
  const id = env("IG_USER_ID"), token = env("IG_ACCESS_TOKEN");
  if (!id || !token) throw new Error("IG_USER_ID / IG_ACCESS_TOKEN 이 없어요");
  if (!p.image && !p.video) throw new Error("인스타그램은 사진이나 영상이 꼭 필요해요");
  const host = env("IG_LOGIN") === "instagram" ? "https://graph.instagram.com" : "https://graph.facebook.com";
  const base = `${host}/v21.0/${id}`;
  const media = p.video ? { media_type: "REELS", video_url: `${MEDIA_BASE}/${p.video}`, share_to_feed: "true" } : { image_url: `${MEDIA_BASE}/cards/${p.image}` };
  const c = await call(`${base}/media`, { params: { caption: p.text, access_token: token, ...media } });
  if (p.video) await waitReady(`${host}/v21.0/${c.id}?fields=status_code&access_token=${encodeURIComponent(token)}`, "status_code");
  else await sleep(8000);
  return call(`${base}/media_publish`, { params: { creation_id: c.id, access_token: token } });
}

// ── X ──────────────────────────────────────────────────────────────
// X는 글자 수를 한글·이모지 2칸, 영문·숫자 1칸으로 세서 280칸까지예요. 링크가 있으면 글값이 13배라서 링크 줄은 빼요(앱 주소는 프로필에).
const xWeight = (s) => [...s].reduce((n, ch) => n + (/[\u0000-ჿ -‍‐-‟′-‷]/.test(ch) ? 1 : 2), 0);
export function xText(p) {
  if (p.xText) return p.xText;
  const lines = p.text.split("\n").filter((l) => !/https?:\/\//.test(l) && !/^(안드로이드|아이폰):/.test(l.trim()));
  const tags = lines.length && lines[lines.length - 1].trim().startsWith("#") ? lines.pop() : "";
  let body = lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  const join = () => (tags ? `${body}\n\n${tags}` : body);
  while (xWeight(join()) > 280 && body.includes("\n")) body = body.slice(0, body.lastIndexOf("\n")).trim(); // 넘치면 뒤 줄부터 덜어내요
  return xWeight(join()) > 280 ? [...body].slice(0, 130).join("") + "…" : join();
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

export const POSTERS = { threads: postThreads, instagram: postInstagram, x: postX };

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  if (!launch) console.log("출시일(launch)이 아직 비어 있어서 출시 일정 글은 쉬어요");
  const todays = posts.filter((p) => dateOf(p) === today);
  console.log(`${today} 올릴 글: ${todays.length}개 ${SEND ? "(실제로 올림)" : "(미리보기: 올리지 않음)"}`);
  let failed = 0;
  for (const p of todays) {
    for (const to of p.to) {
      const media = p.video ? ` (+영상 ${p.video})` : p.image ? ` (+${p.image})` : "";
      const label = `[${to}] ${p.text.split("\n")[0].slice(0, 30)}…${media}${to === "x" ? ` · X ${xWeight(xText(p))}/280칸` : ""}`;
      if (!SEND) { console.log("  미리보기 " + label); if (to === "x") console.log(xText(p).replace(/^/gm, "      │ ")); continue; }
      try {
        if (!POSTERS[to]) throw new Error(`모르는 곳: ${to}`);
        await POSTERS[to](p);
        console.log("  ✓ 올림 " + label);
      } catch (e) {
        failed++;
        console.log("  ✗ 실패 " + label + " → " + e.message);
      }
    }
  }
  process.exit(failed ? 1 : 0);
}
