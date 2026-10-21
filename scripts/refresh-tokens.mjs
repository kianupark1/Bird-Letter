// 홍보 자동 게시 열쇠(토큰)가 약 60일 만에 만료되지 않게, 일주일에 한 번 새 열쇠로 바꿔요: node scripts/refresh-tokens.mjs <저장할 폴더>
// 매주 자동 실행은 .github/workflows/refresh-tokens.yml. 새 열쇠는 화면에 찍지 않고 폴더 안 파일로만 남겨요(작업이 GitHub 비밀 값에 다시 넣음).
// - 스레드: Threads API의 열쇠 연장(th_refresh_token)
// - 인스타: "인스타그램 로그인"으로 받은 열쇠(IG_LOGIN=instagram)만 연장(ig_refresh_token).
//   페이스북 페이지로 받은 페이지 열쇠는 만료되지 않는 열쇠라 연장이 필요 없어요 「미확인」(docs/자동게시-설정.md)
// - X: 사용자 열쇠(OAuth 1.0a)는 만료되지 않아요.
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const out = process.argv[2];
if (!out) { console.error("저장할 폴더를 적어 주세요"); process.exit(2); }
const env = (k) => (process.env[k] ?? "").trim();
const mask = (v) => { if (process.env.GITHUB_ACTIONS) console.log(`::add-mask::${v}`); }; // 작업 기록에 열쇠가 보이지 않게

async function refresh(name, url) {
  const res = await fetch(url);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !json.access_token) throw new Error(`${name} 연장 실패 → ${res.status} ${JSON.stringify(json.error ?? json)}`);
  mask(json.access_token);
  writeFileSync(join(out, name), json.access_token, { mode: 0o600 });
  console.log(`✓ ${name} 연장(앞으로 약 ${Math.round((json.expires_in ?? 0) / 86400)}일)`);
}

let failed = 0;
const jobs = [];
if (env("THREADS_ACCESS_TOKEN")) jobs.push(["THREADS_ACCESS_TOKEN", `https://graph.threads.net/refresh_access_token?grant_type=th_refresh_token&access_token=${encodeURIComponent(env("THREADS_ACCESS_TOKEN"))}`]);
else console.log("- 스레드 열쇠가 아직 없어요(건너뜀)");
if (env("IG_ACCESS_TOKEN") && env("IG_LOGIN") === "instagram") jobs.push(["IG_ACCESS_TOKEN", `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(env("IG_ACCESS_TOKEN"))}`]);
else console.log("- 인스타: 페이지 열쇠(만료 없음)이거나 열쇠가 없어서 건너뜀");
for (const [name, url] of jobs) { try { await refresh(name, url); } catch (e) { failed++; console.log("✗ " + e.message); } }
process.exit(failed ? 1 : 0);
