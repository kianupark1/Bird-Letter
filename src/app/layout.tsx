import type { Metadata } from "next";
// 글씨 파일은 화면에 쓰인 글자 묶음만 조금씩 받아요(통째로 2MB를 받지 않게)
import "pretendard/dist/web/variable/pretendardvariable-dynamic-subset.css";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Notifier from "@/components/Notifier";
import InstallGuide from "@/components/InstallGuide";
import FontScale from "@/components/FontScale";
import SwBoot from "@/components/SwBoot";

export const metadata: Metadata = {
  // 링크 미리보기 이미지 주소의 기준. 직접 정한 주소 > Vercel 배포 주소 > 내 컴퓨터 순서로 써요
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: "새 편지",
  description: "실제 거리만큼 날아가는 슬로우 메시징",
};

const SCALE_SCRIPT = `try{var s=(JSON.parse(localStorage.getItem("saepyeonji.profile.v1")||"{}").fontScale)||"normal";if(s==="xlarge")s="large";if(s==="small"||s==="normal"||s==="large")document.documentElement.dataset.scale=s}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 글씨 크기는 그리기 전에 정해요(열 때 화면이 커졌다 작아지며 들썩이지 않게). 기본은 "보통"
    <html lang="ko" data-scale="normal" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCALE_SCRIPT }} />
      </head>
      <body>
        {children}
        <FontScale />
        <SwBoot />
        <Notifier />
        <InstallGuide />
        <BottomNav />
      </body>
    </html>
  );
}
