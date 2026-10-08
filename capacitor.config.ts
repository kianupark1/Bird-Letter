import type { CapacitorConfig } from "@capacitor/cli";

/**
 * 앱스토어·구글 플레이용 앱 껍데기 설정.
 * 앱은 배포된 웹(server.url)을 그대로 열어서, 웹을 고치면 앱도 바로 바뀌어요(스토어 재심사 없이).
 * appId(번들 ID)는 애플·구글 개발자 콘솔에 등록하면 바꿀 수 없으니, 등록 전에 확정해야 해요.
 */
const config: CapacitorConfig = {
  appId: "com.saepyeonji.app",
  appName: "새 편지",
  webDir: "native/www",
  server: {
    url: "https://bird-letter.vercel.app",
    cleartext: false,
  },
  ios: { contentInset: "always", backgroundColor: "#FBF3E4" },
  android: { backgroundColor: "#FBF3E4" },
};

export default config;
