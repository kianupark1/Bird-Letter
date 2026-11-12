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
  // 아이폰 홈 화면에 추가했을 때: 아이콘 아래 이름 "새 편지", 주소창 없이 앱처럼(2026-10-28 홈 화면 추가 점검)
  // 사파리 위 "새 편지" 앱 띠(앱이 있으면 [열기], 없으면 [받기])
  itunes: { appId: "6828785320" },
  appleWebApp: { capable: true, title: "새 편지", statusBarStyle: "default" },
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

// 스토어 앱 안이면 <html class="inapp">: 심사·정식 앱에서는 "체험판·초안" 표시를 숨겨요(.beta-only, 웹은 출시 날 IS_BETA=false까지 그대로)
const SCALE_SCRIPT = `try{var s=(JSON.parse(localStorage.getItem("saepyeonji.profile.v1")||"{}").fontScale)||"normal";if(s==="xlarge")s="large";if(s==="small"||s==="normal"||s==="large")document.documentElement.dataset.scale=s;var f=JSON.parse(localStorage.getItem("saepyeonji.profile.v1")||"{}").fontFace;if(f==="hand"||f==="saepyeonji")document.documentElement.dataset.font=f}catch(e){}try{if(/SaePyeonjiApp/.test(navigator.userAgent))document.documentElement.classList.add("inapp")}catch(e){}`;

// 서비스 워커가 폰에 담아 둔 화면을 바로 띄운 뒤 새 버전을 받아 오면 알려 줘요(public/sw.js).
// 열자마자(6초 안, 아직 안 눌렀으면) 바로 새 버전으로 바꾸고, 그 뒤면 쓰던 글이 날아가지 않게 그대로 두고 다음에 열 때 새 버전이에요. 30초에 한 번까지만(되풀이 방지)
// 안드로이드 크롬의 "설치할 수 있어요" 신호(beforeinstallprompt)는 화면이 다 뜨기 전에 올 수 있어요.
// 놓치면 [홈 화면에 추가]가 버튼 한 번 설치 대신 메뉴 안내로 바뀌어서, 맨 먼저 받아 둬요(src/lib/install.ts가 이어받음)
const INSTALL_SCRIPT = `try{addEventListener("beforeinstallprompt",function(e){e.preventDefault();window.__bip=e;try{dispatchEvent(new Event("saepyeonji:install-changed"))}catch(x){}})}catch(e){}`;
// 첫 화면(2026-11-09 대표님: "뜨는 게 더 자연스럽고 빨리, 첫 이미지가 가장 중요"): 앱 시작 그림(한지 + 편지 문 까치)과
// 똑같은 그림을 웹이 그리기 전 첫 순간부터 보여 주고, 화면 내용이 준비되면 까치가 살짝 떠오르며 스르륵 걷혀요.
// → 앱 시작 그림 → 빈 화면 → 내용으로 '깜빡'이던 것이 한 장면으로 이어져요. 자바스크립트가 늦어도 4초 뒤엔 저절로 걷혀요.
const BOOT_CSS = `#boot{position:fixed;inset:0;z-index:2147483600;display:flex;flex-direction:column;align-items:center;justify-content:center;background:#FBF3E4;transition:opacity .22s ease-out,visibility .22s;animation:bootauto .4s 4s forwards}#boot picture,#boot img{display:block;width:22vmax;height:22vmax;max-width:210px;max-height:210px;transition:transform .3s cubic-bezier(.2,.8,.2,1)}#boot .bt{margin-top:22px;font:800 26px/1.2 -apple-system,"Apple SD Gothic Neo",sans-serif;letter-spacing:-.5px;color:#2B2420;opacity:0;animation:bootin .45s .25s forwards}#boot .bs{margin-top:8px;font:500 15px/1.4 -apple-system,"Apple SD Gothic Neo",sans-serif;color:#C1481F;opacity:0;animation:bootin .45s .4s forwards}#boot.out{opacity:0;visibility:hidden;pointer-events:none}#boot.out img{transform:translateY(-14px) scale(1.06)}@keyframes bootin{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}@keyframes bootauto{to{opacity:0;visibility:hidden}}@media (prefers-color-scheme:dark){#boot{background:#1A1613}#boot .bt{color:#EFE6D8}#boot .bs{color:#E8683F}}@media (prefers-reduced-motion:reduce){#boot,#boot *{animation-duration:.01s!important;transition:none!important}}`;

const UPDATE_SCRIPT = `try{var t0=Date.now(),hit=false;addEventListener("pointerdown",function(){hit=true},true);var go=function(){try{var k="saepyeonji.swreload",l=+sessionStorage.getItem(k)||0;if(Date.now()-l<30000)return;sessionStorage.setItem(k,String(Date.now()))}catch(e){}location.reload()};navigator.serviceWorker&&navigator.serviceWorker.addEventListener("message",function(e){if(!e.data||e.data.type!=="new-version")return;if(!hit&&Date.now()-t0<6000)go()})}catch(e){}`;

// 설정에서 고르는 글씨체(2026-11-12 대표님: "알아보기 쉬운 필기체와 새편지만의 폰트"). 파일은 public/fonts(scripts/build-fonts.py),
// 고른 사람만 받아요(<html data-font>일 때만 쓰여서 기본 글씨인 사람은 받지 않음). 없는 글자는 Pretendard로 이어서 보여 줘요.
// 글씨체마다 굵기가 하나라서 가짜 굵게(font-synthesis)는 끔(번져 보여서)
const FACE_CSS = `@font-face{font-family:"SaePyeonji";src:url(/fonts/SaePyeonji.woff2) format("woff2");font-display:swap;size-adjust:96%}@font-face{font-family:"SaePyeonji Hand";src:url(/fonts/SaePyeonjiHand.woff2) format("woff2");font-display:swap;size-adjust:115%}html[data-font="saepyeonji"]{--font-main:"SaePyeonji",${pretendard.style.fontFamily}}html[data-font="hand"]{--font-main:"SaePyeonji Hand",${pretendard.style.fontFamily}}html[data-font] body{font-synthesis-weight:none}`;
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // 글씨 크기는 그리기 전에 정해요(열 때 화면이 커졌다 작아지며 들썩이지 않게). 기본은 "보통"
    <html lang="ko" data-scale="normal" className={pretendard.variable} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCALE_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: INSTALL_SCRIPT }} />
        <script dangerouslySetInnerHTML={{ __html: UPDATE_SCRIPT }} />
        <style dangerouslySetInnerHTML={{ __html: BOOT_CSS }} />
        <style dangerouslySetInnerHTML={{ __html: FACE_CSS }} />
        {/* 첫 화면 빨리(2026-11-12 대표님): 로그인 확인·편지 목록 서버에 미리 연결해 둬요(폰에서 연결마다 0.1~0.3초 아낌) */}
        <link rel="preconnect" href="https://firestore.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://identitytoolkit.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://securetoken.googleapis.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
      </head>
      <body>
        <div id="boot" aria-hidden="true">
          <picture>
            <source srcSet="/boot-icon-dark.png" media="(prefers-color-scheme: dark)" />
            <img src="/boot-icon.png" alt="" width={210} height={210} fetchPriority="high" />
          </picture>
          <div className="bt">새 편지</div>
          <div className="bs">기다림도 소통의 일부입니다.</div>
        </div>
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
