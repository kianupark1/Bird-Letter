// 올리기 전 자동 점검: npm run check
// 1) 빌드  2) 서버 실행  3) 모든 화면/이미지가 열리는지와 핵심 문구 확인
import { spawn, spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const PORT = 3123;
const BASE = `http://localhost:${PORT}`;

// [주소, 꼭 들어 있어야 하는 글자(없으면 파일 존재만 확인)]
const PAGES = [
  ["/", null], // 첫 방문자는 온보딩으로 이동하므로 응답만 확인
  ["/onboarding", "소식은 날아서 와요"],
  ["/send", "편지 쓰기"],
  ["/settings", null], // 브라우저 저장소를 읽는 화면: 응답만 확인
  ["/welcome", "소식은 날아서 와요"],
  ["/bungbungi", "붕붕이"],
  ["/privacy", "개인정보 처리방침"],
  ["/terms", "이용약관"],
  ["/policy", "운영정책"],
  ["/manifest.webmanifest", '"name":"새 편지"'],
  ["/og.png", null],
  ["/icon-192.png", null],
  ["/icon-512.png", null],
];

let failed = 0;
const fail = (msg) => { failed++; console.log("  ✗ " + msg); };

console.log("0/3 핵심 계산 시험 중...");
const core = spawnSync(process.execPath, [path.join(root, "node_modules", "tsx", "dist", "cli.mjs"), "scripts/test-core.mts"], { cwd: root, encoding: "utf8" });
if (core.status !== 0) {
  console.log(core.stdout + core.stderr);
  console.log("✗ 핵심 계산 시험 실패");
  process.exit(1);
}
console.log("  ✓ " + core.stdout.trim().split("\n").pop());

console.log("1/3 빌드 중...");
const build = spawnSync(process.execPath, [nextBin, "build"], { cwd: root, stdio: "pipe", encoding: "utf8" });
if (build.status !== 0) {
  console.log(build.stdout + build.stderr);
  console.log("✗ 빌드 실패");
  process.exit(1);
}
console.log("  ✓ 빌드 성공");

console.log("2/3 서버 실행 중...");
const server = spawn(process.execPath, [nextBin, "start", "-p", String(PORT)], { cwd: root, stdio: "ignore" });
const stop = () => { try { server.kill(); } catch {} };
process.on("exit", stop);

let up = false;
for (let i = 0; i < 40 && !up; i++) {
  try { up = (await fetch(BASE + "/welcome")).ok; } catch { await new Promise((r) => setTimeout(r, 500)); }
}
if (!up) { console.log("✗ 서버가 열리지 않았어요"); stop(); process.exit(1); }

console.log("3/3 화면 점검 중...");
for (const [url, needle] of PAGES) {
  try {
    const res = await fetch(BASE + url);
    if (!res.ok) { fail(`${url} → HTTP ${res.status}`); continue; }
    if (needle) {
      const body = await res.text();
      if (!body.includes(needle)) { fail(`${url} → "${needle}" 문구가 없어요`); continue; }
    } else {
      await res.arrayBuffer();
    }
    console.log(`  ✓ ${url}`);
  } catch (e) {
    fail(`${url} → ${e.message}`);
  }
}

stop();
if (failed) { console.log(`\n✗ ${failed}건 실패`); process.exit(1); }
console.log("\n✓ 모두 통과! 올려도 좋아요.");
process.exit(0);
