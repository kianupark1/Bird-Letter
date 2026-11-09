/**
 * 아이폰 앱에 카카오톡 간편 로그인(카카오 공식 아이폰 도구)을 붙여요. scripts/ios-prepare.sh가 cap sync 뒤에 불러요.
 * 카카오 개발자 콘솔의 "네이티브 앱 키"(공개되는 값)가 있어야 켜져요: 환경 변수 KAKAO_NATIVE_KEY 또는 native/kakao-native-key.txt
 *  1) CapApp-SPM/Package.swift에 우리 꾸러미(native/ios/SaepyeonjiKakao)를 넣고
 *  2) capacitor.config.json에 플러그인 이름·앱 키를 넣고
 *  3) Info.plist에 카카오톡에서 돌아오는 주소(kakao{키})와 카카오톡 열기 허락(kakaokompassauth)을 넣어요.
 * 키가 없으면 아무것도 바꾸지 않아요(앱은 예전처럼 카카오 로그인 화면).
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const key = (process.env.KAKAO_NATIVE_KEY || (existsSync("native/kakao-native-key.txt") ? readFileSync("native/kakao-native-key.txt", "utf8") : "")).trim();
if (!/^[0-9a-f]{32}$/i.test(key)) {
  console.log("::warning::카카오 네이티브 앱 키가 없어 앱 안 카카오톡 간편 로그인 없이 만들어요");
  process.exit(0);
}

// 1) 꾸러미
const pkg = "ios/App/CapApp-SPM/Package.swift";
let s = readFileSync(pkg, "utf8");
if (!s.includes("SaepyeonjiKakao")) {
  const depAt = s.indexOf("dependencies: [");
  const prodAnchor = '.product(name: "Capacitor", package: "capacitor-swift-pm"),';
  if (depAt < 0 || !s.includes(prodAnchor)) throw new Error("CapApp-SPM/Package.swift 모양이 예상과 달라요");
  s = s.slice(0, depAt + 15) + '\n        .package(name: "SaepyeonjiKakao", path: "../../../native/ios/SaepyeonjiKakao"),' + s.slice(depAt + 15);
  s = s.replace(prodAnchor, `${prodAnchor}\n                .product(name: "SaepyeonjiKakao", package: "SaepyeonjiKakao"),`);
  writeFileSync(pkg, s);
}

// 2) 플러그인 등록·앱 키
const cfgFile = "ios/App/App/capacitor.config.json";
const cfg = JSON.parse(readFileSync(cfgFile, "utf8"));
cfg.packageClassList = Array.from(new Set([...(cfg.packageClassList || []), "SaepyeonjiKakaoPlugin"]));
cfg.plugins = { ...(cfg.plugins || {}), SaepyeonjiKakao: { appKey: key } };
writeFileSync(cfgFile, JSON.stringify(cfg, null, "\t"));

// 3) Info.plist
const INFO = "ios/App/App/Info.plist";
const pb = (cmd) => { try { execFileSync("/usr/libexec/PlistBuddy", ["-c", cmd, INFO], { stdio: "pipe" }); return true; } catch { return false; } };
const count = (path) => { let n = 0; while (pb(`Print ${path}:${n}`)) n++; return n; };
pb("Add :CFBundleURLTypes array");
const u = count(":CFBundleURLTypes");
pb(`Add :CFBundleURLTypes:${u} dict`);
pb(`Add :CFBundleURLTypes:${u}:CFBundleURLSchemes array`);
pb(`Add :CFBundleURLTypes:${u}:CFBundleURLSchemes:0 string kakao${key}`);
pb("Add :LSApplicationQueriesSchemes array");
let q = count(":LSApplicationQueriesSchemes");
for (const sch of ["kakaokompassauth", "kakaolink", "kakaoplus"]) pb(`Add :LSApplicationQueriesSchemes:${q++} string ${sch}`);
console.log("카카오톡 간편 로그인 붙임(꾸러미·플러그인·주소)");
