#!/usr/bin/env node
/**
 * Claude ↔ ChatGPT 협업(2026-11-17 대표님: "서로 협업하게, 저절로"):
 * Claude Code가 만든 초안(광고 문구·기획)을 ChatGPT(OpenAI API)에게 보내 검토 의견을 받아요.
 * ChatGPT는 매번 docs/chatgpt-handoff.md(새편지 원칙·현황)를 함께 받아서 같은 기준으로 봐요.
 *
 *   node scripts/ask-gpt.mjs "검토해 줘: ..."        글로 바로
 *   node scripts/ask-gpt.mjs --file 초안.md            파일 내용으로
 *   OPENAI_MODEL=모델이름 node scripts/ask-gpt.mjs ...  모델 직접 고르기
 *
 * 열쇠: 클라우드 환경의 네트워크 비밀(api.openai.com)로 넣으면 프록시가 요청에 붙여 줘요(여기 코드·저장소엔 없음).
 * 비용은 ChatGPT 구독과 따로, 쓴 만큼(OpenAI API).
 */
import { readFileSync } from "node:fs";

const args = process.argv.slice(2);
const fi = args.indexOf("--file");
const ask = fi >= 0 ? readFileSync(args[fi + 1], "utf8") : args.join(" ");
if (!ask.trim()) { console.error('사용법: node scripts/ask-gpt.mjs "물어볼 내용"  또는  --file 파일'); process.exit(2); }

const handoff = readFileSync(new URL("../docs/chatgpt-handoff.md", import.meta.url), "utf8");
const API = "https://api.openai.com/v1";
// 프록시가 진짜 열쇠로 바꿔 넣어요. 이 값은 자리만 채우는 가짜예요.
const headers = { Authorization: `Bearer ${process.env.OPENAI_API_KEY || "sk-proxy-injected"}`, "Content-Type": "application/json" };

async function pickModel() {
  if (process.env.OPENAI_MODEL) return process.env.OPENAI_MODEL;
  const r = await fetch(`${API}/models`, { headers });
  if (!r.ok) throw new Error(`모델 목록을 못 받았어요 (${r.status}) ${(await r.text()).slice(0, 200)}`);
  const ids = (await r.json()).data.map((m) => m.id);
  const prefer = ["gpt-5.5", "gpt-5.1", "gpt-5", "gpt-4.1", "gpt-4o"];
  return prefer.find((p) => ids.includes(p)) ?? ids.filter((i) => /^gpt-\d/.test(i) && !/audio|realtime|transcribe|tts|image|search/.test(i)).sort().pop();
}

const model = await pickModel();
const system = `너는 '새편지' 팀의 검토 담당(ChatGPT)이다. 아래 인수인계 문서의 원칙을 반드시 지킨다.
Claude Code(개발·홍보 담당)가 보낸 초안을 검토해서:
1) 좋은 점 한 줄 2) 고칠 점(원칙 위반·법무 위험·어색한 말) 3) 더 나은 대안 문구(그대로 쓸 수 있게)
를 한국어로 짧게 답한다. 사실을 지어내지 말고, 확실하지 않으면 「미확인」.

----- 인수인계 문서 -----
${handoff}`;

const r = await fetch(`${API}/chat/completions`, { method: "POST", headers, body: JSON.stringify({ model, messages: [{ role: "system", content: system }, { role: "user", content: ask }] }) });
if (!r.ok) { console.error(`ChatGPT 요청 실패 (${r.status}) ${(await r.text()).slice(0, 300)}`); process.exit(1); }
const j = await r.json();
console.log(`── ChatGPT(${model}) 의견 ──\n${j.choices?.[0]?.message?.content ?? "(답 없음)"}`);
