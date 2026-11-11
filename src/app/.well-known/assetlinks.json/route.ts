// 안드로이드 "앱이 있으면 앱으로 바로 열기"(App Links): Play 앱 서명 키 SHA-256(2026-11-11 Play Console 앱 서명)
// 앱 쪽 intent-filter(autoVerify)는 다음 앱 파일에서 붙임. 업로드 키 SHA-256은 테스트 APK용으로 나중에 추가 가능.
export const dynamic = "force-static";
export function GET() {
  const body = [{
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: "com.saepyeonji.app",
      sha256_cert_fingerprints: ["CD:39:18:2A:31:24:02:26:8E:E2:D3:8E:DA:4D:CA:59:A5:63:A2:77:A6:E2:00:76:FD:FE:88:A4:7C:9A:F0:85"],
    },
  }];
  return new Response(JSON.stringify(body), { headers: { "Content-Type": "application/json" } });
}
