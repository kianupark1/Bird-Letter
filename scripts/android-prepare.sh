#!/usr/bin/env bash
# 안드로이드 앱 프로젝트(android/)를 새로 만들고 아이콘·시작 화면·버전을 넣어요. GitHub Actions에서 씀.
# 버전 번호(versionCode)는 구글 플레이에 올릴 때마다 커져야 해서 실행 번호(VERSION_CODE)를 써요.
set -euo pipefail
cd "$(dirname "$0")/.."

npx cap add android
# 아이콘·시작 화면 원본은 assets/ (npx tsx promo/build-icons.mts 로 만듦)
npx --yes @capacitor/assets@3.0.5 generate --android \
  --iconBackgroundColor '#C1481F' --iconBackgroundColorDark '#C1481F' \
  --splashBackgroundColor '#FBF3E4' --splashBackgroundColorDark '#1A1613'
npx cap sync android

VERSION_CODE="${VERSION_CODE:-1}"
VERSION_NAME="$(node -p "require('./package.json').version")"
sed -i -E "s/versionCode [0-9]+/versionCode ${VERSION_CODE}/; s/versionName \"[^\"]*\"/versionName \"${VERSION_NAME}\"/" android/app/build.gradle
grep -E "applicationId|versionCode|versionName|targetSdk" android/app/build.gradle android/variables.gradle || true
