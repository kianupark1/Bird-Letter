import { defineConfig } from "@apps-in-toss/web-framework/config";

// 앱인토스 SDK 3.x 설정(파일 이름·항목은 공식 "SDK 3.x 마이그레이션" 문서 기준).
// 3.x 에서는 brand.displayName/icon 이 설정 파일에서 빠졌고, 콘솔에 등록한 값을 쓴다.
// 그래서 앱 이름("새 편지")과 로고는 콘솔 등록값과 글자 하나까지 같게 입력하는 쪽(toss/console-copy.md)으로 관리한다.
export default defineConfig({
  appName: "saepyeonji", // 제안값. 콘솔에 등록한 appName 과 반드시 같아야 하고 등록 후 변경 불가 -> 대표 확인 필요
  brand: {
    primaryColor: "#C1481F", // 다홍(라이트)
  },
  webView: {},
  permissions: [],
  webBundleDir: "toss/out", // next build toss 가 정적 파일을 만드는 폴더(index.html 포함)
  // 토스 내비게이션 바(공식 navigationBar 옵션). 기본값은 문서에 안 적혀 있어 명시한다.
  // 뒤로가기는 토스 바 것만 쓰고(앱 안에 자체 뒤로가기 버튼 없음), 홈 버튼은 쓰지 않는다.
  navigationBar: {
    withBackButton: true,
    withHomeButton: false,
    withTitle: true,
  },
});
