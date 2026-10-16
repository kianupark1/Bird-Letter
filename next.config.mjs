const nextConfig = {
  // 규칙 자동 게시(/api/rules)가 배포 안에서 규칙 파일을 읽을 수 있게 함께 넣어요
  outputFileTracingIncludes: { "/api/rules": ["./firebase/firestore.rules"] },
};
export default nextConfig;
