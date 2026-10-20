const nextConfig = {
  // 규칙 자동 게시(/api/rules)가 배포 안에서 규칙 파일을 읽을 수 있게 함께 넣어요
  outputFileTracingIncludes: { "/api/rules": ["./firebase/firestore.rules"] },
  // 한 번 받아 둔 화면 정보를 앱이 켜져 있는 동안 계속 써요(기본은 5분 뒤 만료 → 누를 때마다 인터넷을 기다렸음).
  // 화면 내용(편지·친구)은 폰에서 따로 받아 오니 오래 써도 내용이 낡지 않아요. 새 배포는 서비스 워커가 알려 줘요.
  experimental: { staleTimes: { dynamic: 86400, static: 86400 } },
};
export default nextConfig;
