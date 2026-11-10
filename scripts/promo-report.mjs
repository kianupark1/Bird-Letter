// 홍보 성적표(2026-11-10 대표님: "탕탕특공대처럼 숫자 보고 잘된 것만"): 최근 글마다 본 사람·좋아요·댓글을 모아 잘된 순서로.
//   node scripts/promo-report.mjs [일수=7]  → 화면과 promo-report.md
// 스레드·인스타만(무료). X는 글 성적 읽기에 돈이 들어서 뺐어요.
import { writeFileSync } from "node:fs";
import { call, igHost, igAccount, env } from "./auto-post.mjs";

const days = Number(process.argv[2] || 7);
const since = Date.now() - days * 86400000;
const rows = [];
const first = (t = "") => t.split("\n")[0].slice(0, 40);
const num = (v) => (typeof v === "number" ? v : 0);

// 스레드
const tt = env("THREADS_ACCESS_TOKEN");
if (tt) {
  try {
    const me = await call(`https://graph.threads.net/v1.0/me?fields=id&access_token=${encodeURIComponent(tt)}`, { method: "GET" });
    const list = await call(`https://graph.threads.net/v1.0/${me.id}/threads?fields=id,text,timestamp,permalink&limit=50&access_token=${encodeURIComponent(tt)}`, { method: "GET" });
    for (const t of list.data ?? []) {
      if (Date.parse(t.timestamp) < since) continue;
      const m = {};
      try {
        const ins = await call(`https://graph.threads.net/v1.0/${t.id}/insights?metric=views,likes,replies,reposts,shares&access_token=${encodeURIComponent(tt)}`, { method: "GET" });
        for (const d of ins.data ?? []) m[d.name] = d.values?.[0]?.value ?? d.total_value?.value;
      } catch (e) { m.err = e.message.slice(0, 80); }
      rows.push({ ch: "스레드", at: t.timestamp, title: first(t.text), url: t.permalink, views: num(m.views), likes: num(m.likes), comments: num(m.replies), shares: num(m.reposts) + num(m.shares) });
    }
  } catch (e) { console.log("스레드 읽기 실패: " + e.message.slice(0, 150)); }
}

// 인스타
const it = env("IG_ACCESS_TOKEN");
if (it) {
  try {
    const host = igHost(), id = await igAccount(host, it);
    const list = await call(`${host}/v21.0/${id}/media?fields=id,caption,timestamp,permalink,media_type,like_count,comments_count&limit=50&access_token=${encodeURIComponent(it)}`, { method: "GET" });
    for (const p of list.data ?? []) {
      if (Date.parse(p.timestamp) < since) continue;
      const m = {};
      try {
        const ins = await call(`${host}/v21.0/${p.id}/insights?metric=reach,views,saved,shares&access_token=${encodeURIComponent(it)}`, { method: "GET" });
        for (const d of ins.data ?? []) m[d.name] = d.values?.[0]?.value ?? d.total_value?.value;
      } catch {
        try { const ins = await call(`${host}/v21.0/${p.id}/insights?metric=reach,saved&access_token=${encodeURIComponent(it)}`, { method: "GET" }); for (const d of ins.data ?? []) m[d.name] = d.values?.[0]?.value; } catch {}
      }
      rows.push({ ch: "인스타", at: p.timestamp, title: first(p.caption), url: p.permalink, views: num(m.views) || num(m.reach), likes: num(p.like_count), comments: num(p.comments_count), shares: num(m.shares) + num(m.saved) });
    }
  } catch (e) { console.log("인스타 읽기 실패: " + e.message.slice(0, 150)); }
}

rows.sort((a, b) => b.views - a.views);
const kst = (s) => new Date(s).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "numeric", minute: "2-digit" });
const total = rows.reduce((n, r) => n + r.views, 0);
const md = [`# 새편지 홍보 성적표 (최근 ${days}일, 글 ${rows.length}개, 본 횟수 합 ${total.toLocaleString("ko-KR")})`, "",
  "| 순위 | 곳 | 올린 때 | 첫 줄 | 본 횟수 | 좋아요 | 댓글 | 공유·저장 |", "|---|---|---|---|---|---|---|---|",
  ...rows.map((r, i) => `| ${i + 1} | ${r.ch} | ${kst(r.at)} | [${r.title.replace(/\|/g, "/")}](${r.url}) | ${r.views} | ${r.likes} | ${r.comments} | ${r.shares} |`),
  "", rows.length ? `**가장 잘된 첫 줄:** ${rows[0].title}` : "아직 글이 없어요"].join("\n");
writeFileSync("promo-report.md", md);
console.log(md);
