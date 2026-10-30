/**
 * 아이폰 앱 서명 준비·정리(GitHub 맥 서버에서만 씀, .github/workflows/ios-release.yml).
 * 자동 서명은 "등록된 아이폰이 없다"며 개발용 프로필에서 막혀서(2026-10-30 첫 빌드),
 * App Store Connect API로 배포용 인증서·App Store 프로필을 직접 만들고, 올린 뒤 지워요(인증서 개수 제한 때문).
 *
 *   node scripts/ios-signing.mjs create   → 인증서(.p12)·프로필 설치, GITHUB_ENV에 PROFILE_NAME·CERT_ID·PROFILE_ID
 *   node scripts/ios-signing.mjs cleanup  → 만든 프로필·인증서 지우기
 * 필요한 값: ASC_KEY_ID, ASC_ISSUER_ID, ASC_KEY_PATH(.p8 파일), RUNNER_TEMP. 열쇠 내용은 화면에 찍지 않아요.
 */
import { createPrivateKey, randomBytes, sign } from "node:crypto";
import { appendFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { homedir } from "node:os";
import { join } from "node:path";

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
  const r = await fetch(API + path, {
    method,
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`${method} ${path} → ${r.status} ${text.slice(0, 400)}`);
  return text ? JSON.parse(text) : {};
}

const outEnv = (k, v) => { if (process.env.GITHUB_ENV) appendFileSync(process.env.GITHUB_ENV, `${k}=${v}\n`); };
// macOS 기본 openssl(LibreSSL)로 만들어야 security import가 .p12를 읽어요
const ssl = (args) => execFileSync("/usr/bin/openssl", args, { stdio: ["ignore", "pipe", "inherit"] });

async function create() {
  const dir = join(env("RUNNER_TEMP"), "signing");
  mkdirSync(dir, { recursive: true });
  const keyPem = join(dir, "dist.key"), csr = join(dir, "dist.csr"), der = join(dir, "dist.cer"), pem = join(dir, "dist.pem"), p12 = join(dir, "dist.p12");

  ssl(["genrsa", "-out", keyPem, "2048"]);
  ssl(["req", "-new", "-key", keyPem, "-out", csr, "-subj", "/CN=Saepyeonji CI/O=Saepyeonji/C=KR"]);
  const csrBody = readFileSync(csr, "utf8").replace(/-----[^-]+-----/g, "").replace(/\s+/g, "");

  const cert = await api("POST", "/certificates", { data: { type: "certificates", attributes: { csrContent: csrBody, certificateType: "DISTRIBUTION" } } });
  const certId = cert.data.id;
  outEnv("CERT_ID", certId);
  writeFileSync(der, Buffer.from(cert.data.attributes.certificateContent, "base64"));
  ssl(["x509", "-inform", "der", "-in", der, "-out", pem]);
  const pass = randomBytes(12).toString("hex");
  ssl(["pkcs12", "-export", "-inkey", keyPem, "-in", pem, "-out", p12, "-passout", `pass:${pass}`]);
  writeFileSync(join(dir, "p12pass"), pass);
  console.log(`배포용 인증서 만듦 (${certId})`);

  const ids = await api("GET", `/bundleIds?filter[identifier]=${BUNDLE}&limit=20`);
  const bundle = ids.data.find((b) => b.attributes.identifier === BUNDLE);
  if (!bundle) throw new Error(`${BUNDLE} 번들 ID가 등록돼 있지 않아요`);

  const name = `saepyeonji appstore ${process.env.GITHUB_RUN_NUMBER ?? Date.now()}`;
  const prof = await api("POST", "/profiles", {
    data: {
      type: "profiles",
      attributes: { name, profileType: "IOS_APP_STORE" },
      relationships: { bundleId: { data: { type: "bundleIds", id: bundle.id } }, certificates: { data: [{ type: "certificates", id: certId }] } },
    },
  });
  outEnv("PROFILE_ID", prof.data.id);
  outEnv("PROFILE_NAME", name);
  const content = Buffer.from(prof.data.attributes.profileContent, "base64");
  const uuid = prof.data.attributes.uuid;
  for (const d of [join(homedir(), "Library/MobileDevice/Provisioning Profiles"), join(homedir(), "Library/Developer/Xcode/UserData/Provisioning Profiles")]) {
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, `${uuid}.mobileprovision`), content);
  }
  console.log(`App Store 프로필 만듦 (${name})`);
}

async function cleanup() {
  for (const [kind, id] of [["profiles", process.env.PROFILE_ID], ["certificates", process.env.CERT_ID]]) {
    if (!id) continue;
    try { await api("DELETE", `/${kind}/${id}`); console.log(`${kind} ${id} 지움`); }
    catch (e) { console.log(`::warning::${kind} ${id} 지우기 실패: ${e.message}`); }
  }
}

const cmd = process.argv[2];
(cmd === "create" ? create() : cmd === "cleanup" ? cleanup() : Promise.reject(new Error("create 또는 cleanup")))
  .catch((e) => { console.error(`::error::${e.message}`); process.exit(1); });
