// 유튜브 쇼츠 자동 게시용 "로그인 열쇠"(refresh token)를 한 번만 받아요: node scripts/youtube-login.mjs <저장할 폴더>
// 폰으로 할 수 있어요: GitHub Actions의 "유튜브 로그인" 작업을 실행하면 기록에 주소와 코드가 나와요 →
// 폰에서 https://www.google.com/device 를 열고 코드 입력 → 새 편지 유튜브 채널의 구글 계정으로 허락 → 끝.
// 받은 열쇠는 화면·기록에 찍지 않고 <폴더>/YT_REFRESH_TOKEN 파일에만 써요(작업이 GitHub 비밀 값으로 옮겨 넣음).
// 필요한 값: YT_CLIENT_ID, YT_CLIENT_SECRET (Google Cloud의 "TV 및 입력이 제한된 기기" OAuth 클라이언트, docs/자동게시-설정.md)
import { writeFileSync } from "node:fs";
import { join } from "node:path";

const env = (k) => (process.env[k] ?? "").trim();
const id = env("YT_CLIENT_ID"), secret = env("YT_CLIENT_SECRET"), out = process.argv[2] ?? ".";
if (!id || !secret) { console.log("YT_CLIENT_ID / YT_CLIENT_SECRET 이 없어요(docs/자동게시-설정.md)"); process.exit(1); }

const post = async (url, params) => {
  const r = await fetch(url, { method: "POST", body: new URLSearchParams(params) });
  return { ok: r.ok, json: await r.json().catch(() => ({})) };
};
// 기기용 로그인은 youtube 범위만 허락돼요(업로드 포함)
const dev = await post("https://oauth2.googleapis.com/device/code", { client_id: id, scope: "https://www.googleapis.com/auth/youtube" });
if (!dev.ok) { console.log("코드를 받지 못했어요:", JSON.stringify(dev.json)); process.exit(1); }
const { device_code, user_code, verification_url, interval = 5, expires_in = 900 } = dev.json;
console.log(`\n① 폰에서 ${verification_url} 열기\n② 코드 입력: ${user_code}\n③ 새 편지 유튜브 채널의 구글 계정 고르기 → 허용\n(${Math.round(expires_in / 60)}분 안에 해 주세요)\n`);

let wait = interval * 1000;
const until = Date.now() + expires_in * 1000;
while (Date.now() < until) {
  await new Promise((r) => setTimeout(r, wait));
  const t = await post("https://oauth2.googleapis.com/token", { client_id: id, client_secret: secret, device_code, grant_type: "urn:ietf:params:oauth:grant-type:device_code" });
  if (t.ok && t.json.refresh_token) {
    writeFileSync(join(out, "YT_REFRESH_TOKEN"), t.json.refresh_token);
    console.log("✓ 허락 완료! 열쇠를 저장했어요");
    process.exit(0);
  }
  const e = t.json.error;
  if (e === "slow_down") wait += 5000;
  else if (e !== "authorization_pending") { console.log("로그인 실패:", e, t.json.error_description ?? ""); process.exit(1); }
}
console.log("시간이 지났어요. 작업을 다시 실행해 주세요");
process.exit(1);
