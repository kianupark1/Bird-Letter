#!/usr/bin/env bash
# 안드로이드 에뮬레이터에 앱을 깔고 열어 화면 사진·기록을 shots/에 남겨요(android-emu-check.yml에서 씀).
set -x
mkdir -p shots
APK=$(ls android/app/build/outputs/apk/debug/*.apk | head -1)
adb wait-for-device
adb install -r "$APK"
adb logcat -c
adb shell monkey -p com.saepyeonji.app -c android.intent.category.LAUNCHER 1
sleep 12; adb exec-out screencap -p > shots/android-light-12s.png
sleep 20; adb exec-out screencap -p > shots/android-light-32s.png
adb shell pidof com.saepyeonji.app > shots/android-alive.txt || echo "NOT RUNNING" > shots/android-alive.txt
adb shell am force-stop com.saepyeonji.app
adb shell cmd uimode night yes
adb shell monkey -p com.saepyeonji.app -c android.intent.category.LAUNCHER 1
sleep 20; adb exec-out screencap -p > shots/android-dark.png
# 뒤로 가기: 첫 화면에서 앱이 꺼지지 않고 내려가는지
adb shell input keyevent 4; sleep 3; adb exec-out screencap -p > shots/android-after-back.png
adb logcat -d > shots/android-logcat.txt
echo "===== alive ====="; cat shots/android-alive.txt
echo "===== errors ====="; grep -iE "FATAL|AndroidRuntime|Capacitor|chromium.*Console|firebase" shots/android-logcat.txt | head -150
exit 0
