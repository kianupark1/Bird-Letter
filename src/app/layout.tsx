import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  // 배포 후 NEXT_PUBLIC_SITE_URL에 실제 주소를 넣으면 링크 미리보기 이미지 주소가 맞게 만들어져요
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "새 편지",
  description: "실제 거리만큼 날아가는 슬로우 메시징",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
