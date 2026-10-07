// 앱인토스용 빌드 점검: npm run check:toss
// 1) 토스 정적 빌드(next build toss)  2) 결과 구조  3) 번들 크기(100MB 이하)  4) eval·new Function 검사
// 5) 금지 문구·요소 검사  6) 라이트 모드 값이 웹과 같은지  7) 실제 브라우저(Edge/Chrome)로 화면 규칙 확인
// 서버(Firebase) 요청은 브라우저 점검 중 막아 둔다(시험 계정이 서버에 생기지 않게).
import { spawnSync } from "node:child_process";
import { createServer } from "node:http";
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT = path.join(root, "toss", "out");
const nextBin = path.join(root, "node_modules", "next", "dist", "bin", "next");
const MAX_BYTES = 100 * 1024 * 1024; // 공식 FAQ: 압축 해제 기준 100MB 이하

let failed = 0;
let skipped = 0;
const pass = (m) => console.log("  ✓ " + m);
const fail = (m) => { failed++; console.log("  ✗ " + m); };
const warn = (m) => console.log("  ! " + m);
const check = (cond, okMsg, badMsg) => (cond ? pass(okMsg) : fail(badMsg));

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// ---------- 1. 빌드 ----------
console.log("1/7 토스 정적 빌드 중...");
const build = spawnSync(process.execPath, [nextBin, "build", "toss"], { cwd: root, encoding: "utf8" });
if (build.status !== 0) {
  console.log(build.stdout + build.stderr);
  console.log("✗ 토스 빌드 실패");
  process.exit(1);
}
pass("next build toss 성공 (output: export, 서버 없이 정적 파일만)");

// ---------- 2. 구조 ----------
console.log("2/7 결과 구조 확인...");
for (const f of ["index.html", "letter/index.html", "send/index.html", "settings/index.html", "onboarding/index.html", "bungbungi/index.html", "privacy/index.html", "terms/index.html", "policy/index.html"]) {
  check(existsSync(path.join(OUT, f)), `${f} 있음`, `${f} 없음`);
}
for (const f of ["welcome", "letter/[id]"]) {
  check(!existsSync(path.join(OUT, f)), `${f} 은(는) 토스 빌드에 없음(의도)`, `${f} 이(가) 토스 빌드에 들어 있음`);
}

// ---------- 3. 크기 ----------
console.log("3/7 번들 크기...");
const files = walk(OUT);
const total = files.reduce((n, f) => n + statSync(f).size, 0);
const mb = (total / 1024 / 1024).toFixed(2);
check(total <= MAX_BYTES, `toss/out 합계 ${mb}MB (100MB 이하, 압축 전 기준)`, `toss/out 합계 ${mb}MB — 100MB 초과`);
const biggest = files.map((f) => [f, statSync(f).size]).sort((a, b) => b[1] - a[1]).slice(0, 3);
for (const [f, s] of biggest) console.log(`      큰 파일: ${path.relative(OUT, f)} ${(s / 1024).toFixed(0)}KB`);

// ---------- 4. eval / new Function ----------
console.log("4/7 eval·new Function 검사 (빌드 결과 전체)...");
const codeFiles = files.filter((f) => /\.(js|mjs|html)$/.test(f));
let evalHits = 0, ctorHits = 0, shimHits = 0, otherFn = 0;
const detail = [];
for (const f of codeFiles) {
  const s = readFileSync(f, "utf8");
  const rel = path.relative(OUT, f);
  // eval( 호출만 센다. 'eval(a,b){...}' 처럼 메서드를 정의하는 모양과 '.eval(' 메서드 호출은 제외
  const e = [...s.matchAll(/(?<![\w$.])eval\s*\(([^()]*)\)(\s*\{)?/g)].filter((m) => !m[2]);
  if (e.length) { evalHits += e.length; detail.push(`eval( ${e.length}회 — ${rel}`); }
  const n = s.match(/new\s+Function\s*\(/g);
  if (n) { ctorHits += n.length; detail.push(`new Function( ${n.length}회 — ${rel}`); }
  for (const m of s.matchAll(/(?<![\w$.])Function\s*\(\s*(["'`])([^"'`]*)\1/g)) {
    if (m[2] === "return this") shimHits++;
    else { otherFn++; detail.push(`Function("${m[2]}") — ${rel}`); }
  }
}
detail.forEach((d) => console.log("      " + d));
check(evalHits === 0, "eval( 호출 없음", `eval( 호출 ${evalHits}곳`);
check(ctorHits === 0, "new Function( 없음", `new Function( ${ctorHits}곳`);
check(otherFn === 0, "그 밖의 Function(문자열) 호출 없음", `Function(문자열) ${otherFn}곳`);
if (shimHits) warn(`Function("return this") ${shimHits}곳 — Next 폴리필/webpack이 전역 객체를 찾는 표준 코드(외부 코드 실행 아님). 앱인토스 검수 자동 검사가 이걸 오탐할 수 있음 → 확인 필요`);
// 소스에도 없어야 함
let srcHits = 0;
for (const dir of ["src", "core", "toss/app"]) {
  for (const f of walk(path.join(root, dir)).filter((f) => /\.(ts|tsx|mts)$/.test(f))) {
    if (/(?<![\w$.])eval\s*\(|new\s+Function\s*\(/.test(readFileSync(f, "utf8"))) srcHits++;
  }
}
check(srcHits === 0, "우리 소스(src, core, toss/app)에 eval·new Function 없음", `우리 소스 ${srcHits}개 파일에 eval/new Function`);

// ---------- 5. 금지 요소 ----------
console.log("5/7 금지 문구·요소 검사...");
// 토스 빌드에 글자째로 남아 있으면 안 되는 것(체험판 문구, 시험용 기능, 알림 토글, 하단 메뉴 등)
// (아래는 토스 빌드에 글자째 들어가면 안 되는 것. 그 밖의 숨김 항목(빨리 감기, ?test, 알림 토글, 예시 받은 편지함,
//  하단 메뉴)은 공용 코드 안에서 실행 때 숨겨지므로 글자는 번들에 남아 있을 수 있고, 7단계 브라우저 점검으로
//  실제 화면에서 안 보이는지 확인한다)
const FORBIDDEN = [
  ["체험판", "체험판 문구"],
  ["출시 준비 중", "출시 준비 중 문구"],
];
const textFiles = files.filter((f) => /\.(js|html|txt|css)$/.test(f));
const blobs = textFiles.map((f) => [path.relative(OUT, f), readFileSync(f, "utf8")]);
for (const [needle, why] of FORBIDDEN) {
  const hit = blobs.filter(([, s]) => s.includes(needle)).map(([n]) => n);
  check(hit.length === 0, `"${needle}" 없음 (${why})`, `"${needle}" 발견 (${why}): ${hit.slice(0, 3).join(", ")}`);
}
check(blobs.some(([, s]) => /AIza[0-9A-Za-z_-]{20}/.test(s)), "Firebase 연결 값이 번들에 들어 있음(서버 연결 가능)", "Firebase 연결 값이 번들에 없음 — 앱이 서버 없이(내 폰 저장으로) 동작하게 됨. 루트 .env.local 확인");
const absoluteHttp = [];
for (const [n, s] of blobs.filter(([n]) => n.endsWith(".html"))) {
  for (const m of s.matchAll(/(?:href|src)="(https?:\/\/[^"]+)"/g)) absoluteHttp.push(`${n}: ${m[1]}`);
}
check(absoluteHttp.length === 0, "HTML에 외부 주소 링크 없음", "HTML에 외부 링크: " + absoluteHttp.slice(0, 3).join(" | "));
const idx = readFileSync(path.join(OUT, "index.html"), "utf8");
const vp = idx.match(/<meta name="viewport" content="([^"]*)"/)?.[1] ?? "";
check(/maximum-scale=1/.test(vp) && /user-scalable=no/.test(vp), `viewport 확대 금지: ${vp}`, `viewport에 확대 금지가 없음: ${vp || "(없음)"}`);

// ---------- 6. 라이트 모드 값 ----------
console.log("6/7 라이트 모드 값이 웹과 같은지...");
const firstRoot = (css) => css.match(/:root\s*\{([^}]*)\}/)?.[1] ?? "";
const vars = (blk) => Object.fromEntries([...blk.matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
const webCss = readFileSync(path.join(root, "src/app/globals.css"), "utf8");
const tossCss = readFileSync(path.join(root, "toss/toss.css"), "utf8");
const webVars = vars(firstRoot(webCss));
const tossVars = vars(firstRoot(tossCss));
const darkBlock = tossCss.match(/@media \(prefers-color-scheme: dark\)\s*\{\s*:root\s*\{([^}]*)\}/)?.[1] ?? "";
const tossDark = vars(darkBlock);
const diff = Object.keys(webVars).filter((k) => webVars[k] !== tossVars[k] || webVars[k] !== tossDark[k]);
check(Object.keys(webVars).length > 0 && diff.length === 0, `라이트 값 ${Object.keys(webVars).length}개가 웹과 같고 다크 블록도 같은 값으로 덮음`, `웹과 다른 값: ${diff.join(", ")}`);

// ---------- 7. 실제 브라우저 ----------
console.log("7/7 실제 브라우저로 화면 규칙 확인...");
const EDGE = [
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser",
  process.env.CHROME_PATH ?? "", // 직접 지정하고 싶을 때: CHROME_PATH=/경로/chrome npm run check:toss
].find(existsSync);
if (!EDGE) {
  skipped++;
  warn("Edge/Chrome을 찾지 못해 브라우저 점검을 건너뜀(이 단계는 검증하지 못한 상태)");
} else {
  const { default: puppeteer } = await import("puppeteer-core");
  const mime = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".woff2": "font/woff2", ".txt": "text/plain", ".json": "application/json" };
  const server = createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]);
    let file = path.join(OUT, p);
    if (!file.startsWith(OUT)) { res.writeHead(403).end(); return; }
    if (existsSync(file) && statSync(file).isDirectory()) file = path.join(file, "index.html");
    if (!existsSync(file)) { res.writeHead(404).end("not found"); return; }
    res.writeHead(200, { "content-type": mime[path.extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise((r) => server.listen(3124, r));
  const BASE = "http://localhost:3124";
  let browser = null;
  try {
    browser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ["--no-sandbox"] });
  } catch (e) {
    skipped++;
    warn("브라우저를 띄우지 못해 7단계를 건너뜀(이 단계는 검증하지 못한 상태): " + e.message.split("\n")[0]);
    server.close();
  }
  if (browser) try {
    const page = await browser.newPage();
    await page.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true });
    await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); // 폰이 다크 모드여도 라이트로 보여야 한다
    await page.setRequestInterception(true);
    let blocked = 0;
    page.on("request", (r) => {
      const u = r.url();
      if (!u.startsWith(BASE)) { blocked++; r.abort(); } else r.continue();
    });
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    await page.evaluateOnNewDocument(() => { try { localStorage.setItem("saepyeonji.onboarded.v1", "1"); } catch {} });
    const text = () => page.evaluate(() => document.body.innerText);
    const go = async (p) => { await page.goto(BASE + p, { waitUntil: "networkidle0", timeout: 30000 }); await new Promise((r) => setTimeout(r, 600)); };

    await go("/");
    let t = await text();
    check(t.includes("편지 쓰기") && t.includes("설정"), "홈에 '편지 쓰기'·'설정' 이동 버튼(하단 메뉴 대신)", "홈에 이동 버튼이 없음");
    check(!(await page.$("nav.bottomnav")), "자체 하단 메뉴 없음", "자체 하단 메뉴(nav.bottomnav)가 보임");
    check(!t.includes("(예시)"), "가짜 예시 받은 편지함 없음", "예시 받은 편지함이 보임");
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    check(bg === "rgb(251, 243, 228)", `다크 모드 폰에서도 배경이 라이트(${bg})`, `배경이 라이트가 아님: ${bg}`);
    const cs = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
    check(cs === "light", `color-scheme: ${cs}`, `color-scheme이 light가 아님: ${cs}`);

    await go("/settings/");
    t = await text();
    check(t.includes("개인정보 처리방침") && t.includes("이용약관") && t.includes("운영정책") && !t.includes("(테스트)"), "설정에 처리방침·이용약관·운영정책 링크가 있고 '(테스트)' 표시는 없음", "설정에 약관 링크가 없거나 '(테스트)'가 보임");

    await go("/send/?test=1");
    t = await text();
    check(!t.includes("테스트 속도"), "?test=1 을 붙여도 빠른 속도가 켜지지 않음", "?test=1 이 토스 빌드에서 동작함");

    await go("/letter/");
    t = await text();
    check(t.includes("편지를 찾을 수 없어요"), "/letter/ (id 없음) 안내 문구", `id 없는 /letter/ 화면: ${t.slice(0, 40)}`);

    await go("/letter/?id=abc123&demo=1");
    t = await text();
    check(!t.includes("빨리 감기"), "?demo=1 을 붙여도 빨리 감기가 안 보임", "?demo=1 이 토스 빌드에서 동작함");
    check(!t.includes("홈으로"), "자체 '홈으로' 뒤로가기 버튼 없음(토스 바 것만 사용)", "자체 홈으로 버튼이 보임");
    console.log(`      (서버 요청 ${blocked}건은 일부러 막음 — 편지 불러오기는 이 점검 범위 밖)`);
    check(errors.length === 0, "화면 오류(pageerror) 없음", "화면 오류: " + errors.slice(0, 3).join(" | "));
  } finally {
    await browser.close();
    server.close();
  }
}

if (failed) console.log(`\n✗ ${failed}건 실패`);
else if (skipped) console.log("\n△ 빌드·파일 검사는 통과, 브라우저 화면 점검은 건너뜀(검증 못 한 부분 있음)");
else console.log("\n✓ 토스 빌드 점검 통과 (실기기·토스 앱 안에서의 동작은 아직 검증하지 않음)");
process.exit(failed ? 1 : 0);
