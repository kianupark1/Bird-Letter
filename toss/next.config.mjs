// 앱인토스용 정적 빌드 설정. 웹(Vercel)용 루트 next.config.mjs 와는 완전히 별개입니다.
// 실행: npm run build:toss  (= next build toss, 결과는 toss/out)
import path from "node:path";
import { fileURLToPath } from "node:url";
import nextEnv from "@next/env";

const here = path.dirname(fileURLToPath(import.meta.url));
// 이 프로젝트 폴더(toss/)에는 .env.local 이 없으므로, 루트(C:\bl)의 환경 변수 파일을 읽어 온다(Firebase 연결 값).
nextEnv.loadEnvConfig(path.resolve(here, ".."), false, console, true); // 마지막 true: 이미 읽은 것을 다시 읽기

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export", // SSR 금지(공식 체크리스트): 서버 없이 정적 파일만 만든다
  trailingSlash: true, // /letter/ -> letter/index.html. 정적 호스팅에서 폴더 주소가 열리게 하려는 선택(토스 호스팅 동작은 확인 필요)
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_TARGET: "toss" },
  // toss/app 이 ../src 의 코드를 그대로 가져다 쓴다
  experimental: { externalDir: true },
};
export default nextConfig;
