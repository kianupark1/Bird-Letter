/**
 * GoogleService-Info.plist를 Xcode 프로젝트의 앱 묶음(Resources)에 넣어요.
 * 폴더에 복사만 하면 앱 파일에 안 들어가서 Firebase(앱 알림·폰 기본 로그인)가 "설정 없음"으로 꺼져 있었어요(2026-11-02 시뮬레이터 기록).
 *   node scripts/ios-add-plist.mjs ios/App/App.xcodeproj/project.pbxproj
 */
import { readFileSync, writeFileSync } from "node:fs";
const file = process.argv[2];
let s = readFileSync(file, "utf8");
if (s.includes("GoogleService-Info.plist")) { console.log("plist 이미 들어 있음"); process.exit(0); }
const BF = "5A1E00000000000000000F01", FR = "5A1E00000000000000000F02";
const need = (re, what) => { if (!re.test(s)) throw new Error(`${what} 를 찾지 못했어요`); };
need(/\/\* config\.xml in Resources \*\/ = \{isa = PBXBuildFile;[^\n]*\n/, "config.xml PBXBuildFile");
s = s.replace(/(\t*)([0-9A-F]{24}) \/\* config\.xml in Resources \*\/ = \{isa = PBXBuildFile;[^\n]*\n/, (m, t) =>
  `${m}${t}${BF} /* GoogleService-Info.plist in Resources */ = {isa = PBXBuildFile; fileRef = ${FR} /* GoogleService-Info.plist */; };\n`);
s = s.replace(/(\t*)([0-9A-F]{24}) \/\* config\.xml \*\/ = \{isa = PBXFileReference;[^\n]*\n/, (m, t) =>
  `${m}${t}${FR} /* GoogleService-Info.plist */ = {isa = PBXFileReference; lastKnownFileType = text.plist.xml; path = "GoogleService-Info.plist"; sourceTree = "<group>"; };\n`);
// 그룹 목록·Resources 목록: config.xml 줄 바로 뒤에
s = s.replace(/(\t+)([0-9A-F]{24}) \/\* config\.xml \*\/,\n/, (m, t) => `${m}${t}${FR} /* GoogleService-Info.plist */,\n`);
s = s.replace(/(\t+)([0-9A-F]{24}) \/\* config\.xml in Resources \*\/,\n/, (m, t) => `${m}${t}${BF} /* GoogleService-Info.plist in Resources */,\n`);
if ((s.match(/GoogleService-Info\.plist/g) || []).length < 6) throw new Error("plist 넣기가 덜 됐어요");
writeFileSync(file, s);
console.log("GoogleService-Info.plist를 앱 묶음에 넣음");
