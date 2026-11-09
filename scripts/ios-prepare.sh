#!/usr/bin/env bash
# 아이폰 앱 프로젝트(ios/)를 새로 만들고 아이콘·시작 화면·로그인 설정·버전을 넣어요. GitHub Actions(맥)에서 씀.
# Firebase 아이폰 설정 파일(native/GoogleService-Info.plist, 비밀 값 아님)이 있으면 폰 기본 로그인(애플·구글)을 켜요.
set -euo pipefail
cd "$(dirname "$0")/.."

PL=native/GoogleService-Info.plist
# 같은 파일이 있으면 앱 알림(Firebase Messaging)도 켜요 → 앱이 이름표에 "SaePyeonjiApp/fcm"을 붙여 웹이 앱 알림을 써요(src/lib/push.ts isAppPush)
if [ -f "$PL" ]; then export NATIVE_AUTH=1 FCM_READY=1; else export NATIVE_AUTH=0 FCM_READY=0; echo "::warning::$PL 가 없어 폰 기본 로그인·앱 알림 없이 만들어요"; fi

npx cap add ios
npx --yes @capacitor/assets@3.0.5 generate --ios \
  --iconBackgroundColor '#C1481F' --splashBackgroundColor '#FBF3E4' --splashBackgroundColorDark '#1A1613'

INFO=ios/App/App/Info.plist
if [ "$NATIVE_AUTH" = 1 ]; then
  cp "$PL" ios/App/App/GoogleService-Info.plist
  # 폴더에 복사만 하면 앱 파일에 안 들어가요 → Xcode 프로젝트 묶음에도 넣어요(그래야 Firebase 앱 알림·폰 기본 로그인이 켜짐)
  # 2026-11-02 시뮬레이터 확인: plist를 넣고 Firebase 바꿔치기를 끄면 정상(ADD_PLIST=0 으로 끌 수 있음)
  if [ "${ADD_PLIST:-1}" = 1 ]; then
    node scripts/ios-add-plist.mjs ios/App/App.xcodeproj/project.pbxproj
    # 앱이 꺼져 있을 때 온 알림도 받게
    /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes array" "$INFO" 2>/dev/null || true
    /usr/libexec/PlistBuddy -c "Add :UIBackgroundModes:0 string remote-notification" "$INFO" 2>/dev/null || true
    # Firebase가 AppDelegate를 몰래 바꿔치기하면 첫 실행에 앱이 꺼짐(시뮬레이터 확인) → 끔. 알림 번호는 우리 AppDelegate가 직접 넘김
    if [ "${NO_PROXY_SWIZZLE:-1}" = 1 ]; then /usr/libexec/PlistBuddy -c "Add :FirebaseAppDelegateProxyEnabled bool false" "$INFO" 2>/dev/null || true; fi
  fi
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
  # 애플로 로그인(Sign in with Apple)·앱 알림(APNs, TestFlight·앱스토어는 production) 기능
  cat > ios/App/App/App.entitlements <<'PL'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
  <key>com.apple.developer.applesignin</key><array><string>Default</string></array>
  <key>aps-environment</key><string>production</string>
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

# 아이폰 전용(아이패드 칸 없이 심사): TARGETED_DEVICE_FAMILY "1,2" → 1 (아이패드에서는 아이폰 화면 그대로 열림)
sed -i '' -e 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' ios/App/App.xcodeproj/project.pbxproj 2>/dev/null || sed -i -e 's/TARGETED_DEVICE_FAMILY = "1,2";/TARGETED_DEVICE_FAMILY = 1;/g' ios/App/App.xcodeproj/project.pbxproj
grep -n "TARGETED_DEVICE_FAMILY" ios/App/App.xcodeproj/project.pbxproj || true
npx cap sync ios
# 카카오톡 간편 로그인(카카오 네이티브 앱 키가 있을 때만, 없으면 건너뜀)
node scripts/ios-kakao.mjs
# 앱 알림(APNs 번호 → FCM 토큰)과 어두운 화면 위·아래 여백 색
if [ "${SKIP_PATCH:-0}" = 1 ]; then echo "AppDelegate 손질 건너뜀(시험)"; else node scripts/ios-appdelegate.mjs ios/App/App/AppDelegate.swift; fi
BUILD="${VERSION_CODE:-1}"
# 앱스토어 버전 칸(1.0)과 같게: 1.0.0 → 1.0 (끝의 .0 한 번만 뗌)
VERSION_NAME="$(node -p "require('./package.json').version.replace(/\\.0$/, '')")"
/usr/libexec/PlistBuddy -c "Set :CFBundleVersion $BUILD" "$INFO" 2>/dev/null || true
/usr/libexec/PlistBuddy -c "Set :CFBundleShortVersionString $VERSION_NAME" "$INFO" 2>/dev/null || true
grep -c CODE_SIGN_ENTITLEMENTS ios/App/App.xcodeproj/project.pbxproj || true
grep -n '"FirebaseAuthentication"\|"FirebaseMessaging"\|includePlugins\|appendUserAgent' ios/App/App/capacitor.config.json || true
