import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Notifier from "@/components/Notifier";
import InstallGuide from "@/components/InstallGuide";
import JoinInstall from "@/components/JoinInstall";
import FontScale from "@/components/FontScale";
import SwBoot from "@/components/SwBoot";

// 아이폰은 입력칸을 누르면 화면을 저절로 확대해서 오른쪽이 잘려 보여요 → 자동 확대만 막아요(두 손가락 확대는 그대로 돼요)
export const viewport: Viewport = { width: "device-width", initialScale: 1, maximumScale: 1 };

export const metadata: Metadata = {
  // 링크 미리보기 이미지 주소의 기준. 직접 정한 주소 > Vercel 배포 주소 > 내 컴퓨터 순서로 써요
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000"),
  ),
  title: "새 편지",
  description: "실제 거리만큼 날아가는 슬로우 메시징",
};

/**
 * 글씨(Pretendard): 자주 쓰는 한글 2,350자·영문·숫자·기호만 담은 파일 하나(약 450KB, scripts/font-chars.txt로 만듦)를
 * 먼저 받아 두고, 그 밖의 드문 글자가 나오면 그때만 전체 글씨 파일을 받아요(globals.css "Pretendard Full").
 * 2026-10-18: 92조각으로 나눈 글씨는 화면을 그릴 때마다 조각을 찾느라 대화방이 열리는 데 2배 넘게 걸려서 바꿈.
 */
const pretendard = localFont({
  src: "./fonts/PretendardSub.woff2",
  weight: "45 920",
  display: "swap",
  variable: "--font-main",
  fallback: ["Pretendard Full", "-apple-system", "Apple SD Gothic Neo", "Malgun Gothic", "sans-serif"],
});

const SCALE_SCRIPT = `try{var s=(JSON.parse(localStorage.getItem("saepyeonji.profile.v1")||"{}").fontScale)||"normal";if(s==="xlarge")s="large";if(s==="small"||s==="normal"||s==="large")document.documentElement.dataset.scale=s}catch(e){}`;

// 서비스 워커가 폰에 담아 둔 화면을 바로 띄운 뒤 새 버전을 받아 오면 알려 줘요(public/sw.js).
// 열자마자(6초 안, 아직 안 눌렀으면) 바로 새 버전으로 바꾸고, 그 뒤면 쓰던 글이 날아가지 않게 그대로 두고 다음에 열 때 새 버전이에요. 30초에 한 번까지만(되풀이 방지)
const UPDATE_SCRIPT = `try{var t0=Date.now(),hit=false;addEventListener("pointerdown",function(){hit=true},true);var go=function(){try{var k="saepyeonji.swreload",l=+sessionStorage.getItem(k)||0;if(Date.now()-l<30000)return;sessionStorage.setItem(k,String(Date.now()))}catch(e){}location.reload()};navigator.serviceWorker&&navigator.serviceWorker.addEventListener("message",function(e){if(!e.data||e.data.type!=="new-version")return;if(!hit&&Date.now()-t0<6000)go()})}catch(e){}`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 글씨 크기는 그리기 전에 정해요(열 때 화면이 커졌다 작아지며 들썩이지 않게). 기본은 "보통"
    <html lang="ko" data-scale="normal" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCALE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: UPDATE_SCRIPT }} />
      </head>
      <body>
        {children}
        <FontScale />
        <SwBoot />
        <Notifier />
        <InstallGuide />
        <JoinInstall />
        <BottomNav />
      </body>
    </html>
  );
}
