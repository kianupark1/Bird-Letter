"use client";
import { openInstallGuide, oneTapInstall, snoozeInstallCard, useInstall } from "@/lib/install";
import BirdIcon from "@/components/BirdIcon";
import { usePushState } from "@/lib/push";

/** 홈·편지 화면의 작은 설치 권유 카드. 설치가 필요한 환경(카톡 안, 아이폰)이거나 한 번에 설치할 수 있을 때만 보여요 */
export default function InstallCard({ hideWhenPushPrompt = false }: { hideWhenPushPrompt?: boolean }) {
  const { env, oneTap, hidden, needsInstall } = useInstall();
  const { state: push } = usePushState();
  if (env === "checking" || env === "installed" || env === "desktop" || hidden) return null;
  if (!needsInstall && !oneTap) return null;
  // 아이폰에서는 알림 안내 카드(PushPrompt)가 같은 일을 하니 겹치지 않게 숨겨요
  if (hideWhenPushPrompt && push === "needs-install") return null;
  const inapp = env === "inapp";
  return (
    <div className="pushcard" role="region" aria-label="앱처럼 설치하기">
      <BirdIcon id="magpie" size={60} letter className="bob" />
      <div className="pushtext">
        <div className="t">{inapp ? "기본 브라우저로 열면 알림을 받아요" : "앱처럼 설치하면 알림이 와요"}</div>
        <div className="d">
          {inapp ? "지금은 다른 앱 안에서 열려 있어서 알림을 쓸 수 없어요." : "앱을 닫아도 편지가 도착하면 폰이 알려줘요."}
        </div>
        <div className="pushrow">
          {oneTap && !inapp ? (
            <button className="pushbtn" onClick={() => oneTapInstall()}>앱으로 설치하기</button>
          ) : (
            <button className="pushbtn" onClick={openInstallGuide}>{inapp ? "여는 방법 보기" : "설치 방법 보기"}</button>
          )}
          <button className="pushlater" onClick={() => snoozeInstallCard(7)}>나중에</button>
        </div>
      </div>
    </div>
  );
}
