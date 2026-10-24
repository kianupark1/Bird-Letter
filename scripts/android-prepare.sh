#!/usr/bin/env bash
# 안드로이드 앱 프로젝트(android/)를 새로 만들고 아이콘·시작 화면·알림·버전을 넣어요. GitHub Actions에서 씀.
# 버전 번호(versionCode)는 구글 플레이에 올릴 때마다 커져야 해서 실행 번호(VERSION_CODE)를 써요.
set -euo pipefail
cd "$(dirname "$0")/.."

# 앱 알림(FCM) 설정 파일: Firebase 콘솔에서 받은 google-services.json (비밀 값 아님, 웹 설정과 같은 공개 값)
GS=native/google-services.json
if [ -f "$GS" ]; then export FCM_READY=1 NATIVE_AUTH=1; else export FCM_READY=0 NATIVE_AUTH=0; echo "::warning::$GS 가 없어 앱 알림·폰 기본 로그인 없이 만들어요"; fi

npx cap add android
# 아이콘·시작 화면 원본은 assets/ (npx tsx promo/build-icons.mts 로 만듦)
npx --yes @capacitor/assets@3.0.5 generate --android \
  --iconBackgroundColor '#C1481F' --iconBackgroundColorDark '#C1481F' \
  --splashBackgroundColor '#FBF3E4' --splashBackgroundColorDark '#1A1613'
# 폰 기본 구글 로그인(Credential Manager). 플레이 출시 뒤에는 Firebase에 앱 서명 SHA-1을 등록해야 해요
if [ "$NATIVE_AUTH" = 1 ]; then sed -i "s/^ext {/ext {\n    rgcfaIncludeGoogle = true\n    androidxCredentialsVersion = '1.3.0'/" android/variables.gradle; fi
npx cap sync android

# 알림 줄의 작은 흰색 아이콘(서버가 보내는 알림의 icon: "ic_stat_notify")
cp assets/notify-icon.png android/app/src/main/res/drawable/ic_stat_notify.png
sed -i 's#</application>#    <meta-data android:name="com.google.firebase.messaging.default_notification_icon" android:resource="@drawable/ic_stat_notify" />\n    </application>#' android/app/src/main/AndroidManifest.xml
# 편지 쓰기 "연락처에서 찾기"(폰 기본 연락처 고르기 창, 고른 한 명만 읽음)
grep -q READ_CONTACTS android/app/src/main/AndroidManifest.xml || sed -i 's#<application#<uses-permission android:name="android.permission.READ_CONTACTS" />\n    <application#' android/app/src/main/AndroidManifest.xml
if [ "$FCM_READY" = 1 ]; then cp "$GS" android/app/google-services.json; fi

VERSION_CODE="${VERSION_CODE:-1}"
VERSION_NAME="$(node -p "require('./package.json').version")"
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/; s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" android/app/build.gradle
grep -E "applicationId|versionCode|versionName|targetSdk" android/app/build.gradle android/variables.gradle || true
grep -n "appendUserAgent" android/app/src/main/assets/capacitor.config.json || true
