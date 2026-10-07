import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Notifier from "@/components/Notifier";

export const metadata: Metadata = {
  // 링크 미리보기 이미지 주소의 기준. 직접 정한 주소 > Vercel 배포 주소 > 내 컴퓨터 순서로 써요
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: "새 편지",
  description: "실제 거리만큼 날아가는 슬로우 메시징",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <Notifier />
        <BottomNav />
      </body>
    </html>
  );
}
