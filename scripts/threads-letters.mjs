#!/usr/bin/env node
/**
 * 스레드 댓글 → 편지 배달 이벤트(2026-11-17). 우리 글 중 MARK가 들어간 글의 댓글마다
 * 사이트(/api/campaign/letter, GitHub OIDC)로 비둘기 편지를 만들고, 그 댓글에 편지 링크로 답글을 달아요.
 * 한 사람에게 한 번만(STATE_FILE에 "u:아이디"·"r:댓글번호"), 한 번 돌 때 최대 MAX통.
 *   SEND=true 면 실제로, 아니면 미리보기만.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { campaignReplyText, shouldSend } from "../core/campaign.ts";

export const MARK = "🕊 댓글 편지 배달";
const MAX = Number(process.env.MAX ?? 25);
const SEND = process.env.SEND === "true";
const token = (process.env.THREADS_ACCESS_TOKEN ?? "").trim();
const STATE = process.env.STATE_FILE;
const SITE = (process.env.SITE ?? "https://bird-letter.vercel.app").replace(/\/$/, "");
const G = "https://graph.threads.net/v1.0";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function call(url, { method = "GET", params } = {}) {
  const r = await fetch(url, { method, body: params ? new URLSearchParams(params) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.error) throw new Error(`${url.split("?")[0]} → ${r.status} ${JSON.stringify(j.error ?? j).slice(0, 200)}`);
  return j;
}
const q = (o) => new URLSearchParams({ ...o, access_token: token }).toString();

if (!token) { console.log("THREADS_ACCESS_TOKEN 이 없어요"); process.exit(0); }
const done = new Set(STATE && existsSync(STATE) ? readFileSync(STATE, "utf8").split("\n").map((x) => x.trim()).filter(Boolean) : []);
const me = await call(`${G}/me?${q({ fields: "id,username" })}`);
const mine = (await call(`${G}/me/threads?${q({ fields: "id,text,timestamp", limit: "25" })}`)).data ?? [];
const posts = mine.filter((p) => (p.text ?? "").includes(MARK) && Date.now() - Date.parse(p.timestamp) < 7 * 864e5);
console.log(`이벤트 글 ${posts.length}개 (최근 7일)`);
let sent = 0, failed = 0;
for (const p of posts) {
  let url = `${G}/${p.id}/replies?${q({ fields: "id,username,text,timestamp", reverse: "false" })}`;
  const replies = [];
  for (let i = 0; url && i < 5; i++) { const j = await call(url); replies.push(...(j.data ?? [])); url = j.paging?.next; }
  for (const rep of replies) {
    if (sent >= MAX) break;
    if (!shouldSend(rep, me.username, done)) continue;
    const u = String(rep.username).replace(/^@+/, "");
    if (!SEND) { console.log(`  미리보기: @${u}에게 편지 → 답글`); sent++; continue; }
    try {
      const r = await fetch(`${SITE}/api/campaign/letter`, { method: "POST", headers: { Authorization: `Bearer ${process.env.CAMPAIGN_OIDC}`, "Content-Type": "application/json" }, body: JSON.stringify({ username: u, seed: rep.id }) });
      const L = await r.json().catch(() => ({}));
      if (!r.ok || !L.link) throw new Error(`편지 만들기 ${r.status} ${JSON.stringify(L).slice(0, 160)}`);
      // 편지는 만들어졌으니 먼저 기록(답글이 실패해도 같은 사람에게 두 통 가지 않게)
      for (const k of ["u:" + u.toLowerCase(), "r:" + rep.id]) { done.add(k); if (STATE) appendFileSync(STATE, k + "\n"); }
      const c = await call(`${G}/${me.id}/threads`, { method: "POST", params: { media_type: "TEXT", text: campaignReplyText(u, L.link, L.minutes), reply_to_id: rep.id, access_token: token } });
      await sleep(3000);
      await call(`${G}/${me.id}/threads_publish`, { method: "POST", params: { creation_id: c.id, access_token: token } });
      console.log(`  ✓ @${u} 편지 보냄·답글 달음 (${L.minutes}분)`);
      sent++;
      await sleep(4000);
    } catch (e) { failed++; console.log(`  ✗ @${u} → ${e.message}`); }
  }
}
console.log(`끝: ${SEND ? "보냄" : "미리보기"} ${sent}통, 실패 ${failed}`);
process.exit(failed && !sent ? 1 : 0);
