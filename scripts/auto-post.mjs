// 오늘(한국 시간) 올릴 홍보 글을 스레드·인스타그램에 올려요: node scripts/auto-post.mjs [--send] [--date 2026-10-02]
// 기본은 "미리보기"예요(실제로 올리지 않고 무엇을 올릴지만 보여 줌). --send 를 붙여야 진짜로 올라가요.
// 일정은 promo/schedule.json, 매일 자동 실행은 .github/workflows/auto-post.yml 이에요.
//
// 필요한 비밀값(GitHub 레포 Settings → Secrets and variables → Actions 에 넣기, 코드에 적지 마세요):
//   THREADS_USER_ID, THREADS_ACCESS_TOKEN         스레드(Threads API)
//   IG_USER_ID, IG_ACCESS_TOKEN                   인스타그램(비즈니스/크리에이터 계정, Graph API)
// 선택: IMAGE_BASE_URL  카드 이미지가 올라가 있는 공개 주소(기본: 이 레포의 main 브랜치 raw 주소)
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const SEND = args.includes("--send");
const dateArg = args.includes("--date") ? args[args.indexOf("--date") + 1] : null;
const today = dateArg ?? new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Seoul" }).format(new Date()); // YYYY-MM-DD
const IMAGE_BASE = (process.env.IMAGE_BASE_URL ?? "https://raw.githubusercontent.com/kianupark1/Bird-Letter/main/promo/cards").replace(/\/$/, "");
const env = (k) => (process.env[k] ?? "").trim().replace(/^﻿/, "");

const { posts } = JSON.parse(readFileSync(new URL("../promo/schedule.json", import.meta.url), "utf8"));
const todays = posts.filter((p) => p.date === today);
console.log(`${today} 올릴 글: ${todays.length}개 ${SEND ? "(실제로 올림)" : "(미리보기: 올리지 않음)"}`);

async function api(url, params) {
  const res = await fetch(url, { method: "POST", body: new URLSearchParams(params) });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) throw new Error(`${url.split("?")[0]} → ${res.status} ${JSON.stringify(json.error ?? json)}`);
  return json;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function postThreads(p) {
  const id = env("THREADS_USER_ID"), token = env("THREADS_ACCESS_TOKEN");
  if (!id || !token) throw new Error("THREADS_USER_ID / THREADS_ACCESS_TOKEN 이 없어요");
  const base = `https://graph.threads.net/v1.0/${id}`;
  const params = { text: p.text, access_token: token, ...(p.image ? { media_type: "IMAGE", image_url: `${IMAGE_BASE}/${p.image}` } : { media_type: "TEXT" }) };
  const c = await api(`${base}/threads`, params);
  await sleep(p.image ? 8000 : 2000); // 이미지는 처리 시간이 필요해요
  return api(`${base}/threads_publish`, { creation_id: c.id, access_token: token });
}

async function postInstagram(p) {
  const id = env("IG_USER_ID"), token = env("IG_ACCESS_TOKEN");
  if (!id || !token) throw new Error("IG_USER_ID / IG_ACCESS_TOKEN 이 없어요");
  if (!p.image) throw new Error("인스타그램은 이미지가 꼭 필요해요");
  const base = `https://graph.facebook.com/v21.0/${id}`;
  const c = await api(`${base}/media`, { image_url: `${IMAGE_BASE}/${p.image}`, caption: p.text, access_token: token });
  await sleep(8000);
  return api(`${base}/media_publish`, { creation_id: c.id, access_token: token });
}

let failed = 0;
for (const p of todays) {
  for (const to of p.to) {
    const label = `[${to}] ${p.text.split("\n")[0].slice(0, 30)}…${p.image ? ` (+${p.image})` : ""}`;
    if (!SEND) { console.log("  미리보기 " + label); continue; }
    try {
      await (to === "threads" ? postThreads(p) : postInstagram(p));
      console.log("  ✓ 올림 " + label);
    } catch (e) {
      failed++;
      console.log("  ✗ 실패 " + label + " → " + e.message);
    }
  }
}
process.exit(failed ? 1 : 0);
