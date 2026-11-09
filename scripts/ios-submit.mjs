/**
 * 앱스토어 심사 제출 자동화(2026-11-09 대표님: "다 자동화로"). GitHub Actions(.github/workflows/ios-submit.yml)에서 씀.
 *  1) package.json 버전(1.2.0 → 1.2)의 앱스토어 버전을 만들거나 찾고(수동 출시)
 *  2) 한국어 "이번 버전의 새로운 기능" 글을 넣고
 *  3) TestFlight에 올라간 그 버전의 가장 최근 빌드(처리 끝난 것)를 붙이고
 *  4) SUBMIT=yes 이면 심사에 제출해요(아니면 준비만 하고 멈춰요).
 * 필요한 값: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH(.p8). 열쇠 내용은 화면에 찍지 않아요.
 */
import { createPrivateKey, sign } from "node:crypto";
import { readFileSync } from "node:fs";

const BUNDLE = "com.saepyeonji.app";
const API = "https://api.appstoreconnect.apple.com/v1";
const env = (k) => { const v = process.env[k]; if (!v) throw new Error(`${k} 이 없어요`); return v; };
const b64url = (b) => Buffer.from(b).toString("base64url");
function token() {
  const now = Math.floor(Date.now() / 1000);
  const head = b64url(JSON.stringify({ alg: "ES256", kid: env("ASC_KEY_ID"), typ: "JWT" }));
  const body = b64url(JSON.stringify({ iss: env("ASC_ISSUER_ID"), iat: now, exp: now + 1100, aud: "appstoreconnect-v1" }));
  const key = createPrivateKey(readFileSync(env("ASC_KEY_PATH")));
  const sig = sign("sha256", Buffer.from(`${head}.${body}`), { key, dsaEncoding: "ieee-p1363" });
  return `${head}.${body}.${b64url(sig)}`;
}
async function api(method, path, body) {
  const r = await fetch(path.startsWith("http") ? path : API + path, { method, headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${text.slice(0, 600)}`);
  return text ? JSON.parse(text) : {};
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const VERSION = JSON.parse(readFileSync("package.json", "utf8")).version.replace(/\.0$/, "");
const WHATS_NEW = process.env.WHATS_NEW?.trim() || [
  "• 카카오톡으로 더 쉽게 로그인해요",
  "• 편지·초대 링크를 누르면 앱이 바로 열려요",
  "• 내 위치 찾기가 훨씬 빨라졌어요",
  "• 받는 사람도 편지가 어디쯤 왔는지 실시간으로 봐요",
  "• 화면 왼쪽 끝을 밀어 뒤로 가기가 더 부드러워졌어요",
  "",
  "기다림도 소통의 일부입니다.",
].join("\n");

const app = (await api("GET", `/apps?filter[bundleId]=${BUNDLE}`)).data[0];
if (!app) throw new Error("앱을 찾지 못했어요");
console.log(`앱 ${app.attributes.name} · 버전 ${VERSION}`);

// 1) 버전
const vers = await api("GET", `/apps/${app.id}/appStoreVersions?filter[platform]=IOS&limit=20`);
let ver = vers.data.find((v) => v.attributes.versionString === VERSION);
if (!ver) {
  ver = (await api("POST", "/appStoreVersions", { data: { type: "appStoreVersions", attributes: { platform: "IOS", versionString: VERSION, releaseType: "MANUAL" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
  console.log(`앱스토어 버전 ${VERSION} 만듦`);
} else console.log(`앱스토어 버전 ${VERSION} 있음 (${ver.attributes.appStoreState})`);
const state = ver.attributes.appStoreState;
if (!["PREPARE_FOR_SUBMISSION", "DEVELOPER_REJECTED", "REJECTED", "METADATA_REJECTED", undefined].includes(state)) {
  console.log(`지금 상태(${state})에서는 고칠 수 없어서 멈춰요`);
  process.exit(0);
}

// 2) 새로운 기능 글(한국어)
const locs = await api("GET", `/appStoreVersions/${ver.id}/appStoreVersionLocalizations`);
const ko = locs.data.find((l) => l.attributes.locale.startsWith("ko")) ?? locs.data[0];
if (ko) { await api("PATCH", `/appStoreVersionLocalizations/${ko.id}`, { data: { type: "appStoreVersionLocalizations", id: ko.id, attributes: { whatsNew: WHATS_NEW } } }); console.log(`새로운 기능 글 넣음(${ko.attributes.locale})`); }

// 3) 빌드: 이 버전으로 올린 것 중 가장 최근, 애플 처리가 끝날 때까지 기다려요(최대 40분)
let build = null;
for (let i = 0; i < 80; i++) {
  const b = await api("GET", `/builds?filter[app]=${app.id}&filter[preReleaseVersion.version]=${VERSION}&sort=-uploadedDate&limit=1`);
  build = b.data[0];
  if (build && build.attributes.processingState === "VALID") break;
  console.log(build ? `빌드 ${build.attributes.version} 애플 처리 중(${build.attributes.processingState})…` : "TestFlight에 아직 빌드가 없어요… 기다려요");
  await sleep(30000);
}
if (!build || build.attributes.processingState !== "VALID") throw new Error("처리 끝난 빌드가 없어요(아이폰 출시 빌드부터 돌려 주세요)");
await api("PATCH", `/appStoreVersions/${ver.id}/relationships/build`, { data: { type: "builds", id: build.id } });
console.log(`빌드 ${build.attributes.version} 붙임`);

// 4) 제출
if (process.env.SUBMIT !== "yes") { console.log("준비만 했어요(SUBMIT=yes 이면 심사 제출)"); process.exit(0); }
const sub = (await api("POST", "/reviewSubmissions", { data: { type: "reviewSubmissions", attributes: { platform: "IOS" }, relationships: { app: { data: { type: "apps", id: app.id } } } } })).data;
await api("POST", "/reviewSubmissionItems", { data: { type: "reviewSubmissionItems", relationships: { reviewSubmission: { data: { type: "reviewSubmissions", id: sub.id } }, appStoreVersion: { data: { type: "appStoreVersions", id: ver.id } } } } });
await api("PATCH", `/reviewSubmissions/${sub.id}`, { data: { type: "reviewSubmissions", id: sub.id, attributes: { submitted: true } } });
console.log(`🎉 ${VERSION} 심사 제출 완료(수동 출시: 승인되면 대표님이 [이 버전 출시])`);
