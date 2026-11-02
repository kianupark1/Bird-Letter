import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 앱스토어·구글 플레이용 앱 껍데기 설정.
 * 앱은 배포된 웹(server.url)을 그대로 열어서, 웹을 고치면 앱도 바로 바뀌어요(스토어 재심사 없이).
 * appId(번들 ID)는 애플·구글 개발자 콘솔에 등록하면 바꿀 수 없으니, 등록 전에 확정해야 해요.
 */
/// <reference types="@capacitor-firebase/authentication" />
/// <reference types="@capacitor-firebase/messaging" />
// 휴대폰 기본 로그인 창(애플·구글)은 Firebase 설정 파일이 들어간 빌드에서만 켜요(없이 켜면 앱이 열리자마자 멈춰요).
// 안드로이드: native/google-services.json, 아이폰: native/GoogleService-Info.plist → 준비 스크립트가 NATIVE_AUTH=1 로 알려 줘요.
const NATIVE_AUTH = process.env.NATIVE_AUTH === "1";

const config: CapacitorConfig = {
  appId: "com.saepyeonji.app",
  appName: "새 편지",
  webDir: "native/www",
  server: {
    url: "https://bird-letter.vercel.app",
    cleartext: false,
    // 카카오 로그인 화면이 앱 밖(사파리·크롬)으로 튀어 나가지 않고 앱 안에서 열렸다가 돌아오게 해요
    allowNavigation: ["kauth.kakao.com", "accounts.kakao.com", "logins.daum.net", "nid.naver.com"],
  },
  plugins: {
    // 앱 안 로그인: 폰 기본 창으로 애플·구글 확인만 받고, 실제 로그인은 웹(Firebase)이 해요(src/lib/firebase/link.ts)
    FirebaseAuthentication: { skipNativeAuth: true, providers: ["apple.com", "google.com"] },
    // 앱 알림(안드로이드·아이폰 모두 Firebase Messaging): 앱을 보고 있을 때도 알림 배너·소리
    FirebaseMessaging: { presentationOptions: ["badge", "sound", "alert"] },
  },
  ...(NATIVE_AUTH ? {} : { includePlugins: ["@capacitor/app", "@capacitor-community/in-app-review", "@capacitor/share", "@capacitor/filesystem", "@capacitor-community/contacts"] }),
  experimental: {
    ios: { spm: { packageOptions: { "@capacitor-firebase/authentication": { symlink: true }, "@capacitor-firebase/messaging": { symlink: true } }, swiftToolsVersion: "6.1", packageTraits: { "@capacitor-firebase/authentication": ["Google"] } } },
  },
  // 웹이 "스토어 앱 안"인지 알 수 있게 브라우저 이름표 끝에 붙여요. FCM 설정이 들어간 빌드만 "/fcm"(src/lib/push.ts isAppPush)
  appendUserAgent: process.env.FCM_READY === "1" ? "SaePyeonjiApp/fcm" : "SaePyeonjiApp",
  // 위·아래 여백 색은 AppDelegate가 화면 모드(밝음·어두움)에 맞춰 다시 칠해요(scripts/ios-appdelegate.mjs)
  // 시뮬레이터 점검(CAP_LOG=1)일 때만 웹 화면의 console 기록을 앱 기록으로 넘겨요
  ...(process.env.CAP_LOG === "1" ? { loggingBehavior: "production" as const } : {}),
  ios: { contentInset: "always", backgroundColor: "#FBF3E4" },
  android: { backgroundColor: "#FBF3E4" },
};

export default config;
