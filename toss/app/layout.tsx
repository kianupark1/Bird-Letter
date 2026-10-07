import type { Metadata, Viewport } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import "../../src/app/globals.css";
import "../toss.css";
import Notifier from "../../src/components/Notifier";

export const metadata: Metadata = {
  title: "새 편지",
  description: "실제 거리만큼 날아가는 슬로우 메시징",
};

// 확대·축소 비활성(공식 체크리스트: 지도처럼 꼭 필요한 경우 외에는 제스처 확대·축소 끄기)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function TossLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" style={{ colorScheme: "light" }}>
      <body>
        {children}
        <Notifier />
      </body>
    </html>
  );
}
