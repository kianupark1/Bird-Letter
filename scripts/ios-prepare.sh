#!/usr/bin/env bash
# 아이폰 앱 프로젝트(ios/)를 새로 만들고 아이콘·시작 화면·로그인 설정·버전을 넣어요. GitHub Actions(맥)에서 씀.
# Firebase 아이폰 설정 파일(native/GoogleService-Info.plist, 비밀 값 아님)이 있으면 폰 기본 로그인(애플·구글)을 켜요.
set -euo pipefail
cd "$(dirname "$0")/.."

PL=native/GoogleService-Info.plist
if [ -f "$PL" ]; then export NATIVE_AUTH=1; else export NATIVE_AUTH=0; echo "::warning::$PL 가 없어 폰 기본 로그인 없이 만들어요(앱 안 애플·구글 로그인은 안 돼요)"; fi

npx cap add ios
npx --yes @capacitor/assets@3.0.5 generate --ios \
  --iconBackgroundColor '#C1481F' --splashBackgroundColor '#FBF3E4' --splashBackgroundColorDark '#1A1613'

INFO=ios/App/App/Info.plist
if [ "$NATIVE_AUTH" = 1 ]; then
  cp "$PL" ios/App/App/GoogleService-Info.plist
  # 구글 로그인 창이 앱으로 돌아오는 주소(REVERSED_CLIENT_ID). 파일에 없으면(구글 아이폰 로그인 설정 전) 건너뛰어요: 애플·카카오 로그인은 그대로 돼요
  REV=$(/usr/libexec/PlistBuddy -c "Print :REVERSED_CLIENT_ID" "$PL" 2>/dev/null || true)
  if [ -n "$REV" ]; then
    /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes array" "$INFO" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0 dict" "$INFO"
    /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes array" "$INFO"
    /usr/libexec/PlistBuddy -c "Add :CFBundleURLTypes:0:CFBundleURLSchemes:0 string $REV" "$INFO"
  else
    echo "::warning::$PL 에 REVERSED_CLIENT_ID가 없어요. 아이폰 앱 안 구글 로그인은 꺼진 채로 만들어요(Firebase에서 파일을 다시 받으면 켜져요)"
  fi
  # 애플로 로그인(Sign in with Apple) 기능
  cat > ios/App/App/App.entitlements <<'PL'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>com.apple.developer.applesignin</key><array><string>Default</string></array>
</dict></plist>
PL
  sed -i '' 's#PRODUCT_BUNDLE_IDENTIFIER = com.saepyeonji.app;#CODE_SIGN_ENTITLEMENTS = App/App.entitlements;\
				PRODUCT_BUNDLE_IDENTIFIER = com.saepyeonji.app;#' ios/App/App.xcodeproj/project.pbxproj
fi
# 한국어 앱: 날짜·권한 안내를 한국어로
/usr/libexec/PlistBuddy -c "Set :CFBundleDevelopmentRegion ko" "$INFO" 2>/dev/null || true
# 편지 쓰기 "연락처에서 찾기"(고른 한 명의 이름·번호만 씀, 저장·서버 전송 안 함)
/usr/libexec/PlistBuddy -c "Add :NSContactsUsageDescription string 편지를 받을 사람을 연락처에서 고를 때 써요. 고른 사람의 이름과 번호만 쓰고 저장하거나 서버로 보내지 않아요." "$INFO" 2>/dev/null || true

# 암호화 수출 질문: 일반 HTTPS만 쓰는 앱이라 "해당 없음"(올릴 때마다 묻지 않게)
/usr/libexec/PlistBuddy -c "Add :ITSAppUsesNonExemptEncryption bool false" "$INFO" 2>/dev/null || true

npx cap sync ios
BUILD="${VERSION_CODE:-1}"
VERSION_NAME="$(node -p "require('./package.json').version")"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD" "$INFO" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION_NAME" "$INFO" 2>/dev/null || true
grep -c CODE_SIGN_ENTITLEMENTS ios/App/App.xcodeproj/project.pbxproj || true
grep -n '"FirebaseAuthentication"\|includePlugins' ios/App/App/capacitor.config.json || true
