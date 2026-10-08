"use client";
import { PUSH_CONFIGURED, usePushState } from "@/lib/push";
import BirdIcon from "@/components/BirdIcon";
import { openInstallGuide } from "@/lib/install";

/** "닫아 둬도 알려드릴까요?" 안내 카드. 이미 켰거나 지원하지 않으면 보이지 않아요. */
export default function PushPrompt({ birdId = "magpie" }: { birdId?: string }) {
  const { state, enable } = usePushState();
  if (!PUSH_CONFIGURED || state === "checking" || state === "enabled" || state === "unsupported") return null;
  return (
    <div className="pushcard" role="region" aria-label="알림 켜기">
      <BirdIcon id={birdId} size={60} letter className="bob" />
      <div className="pushtext">
        {state === "default" && (
          <>
            <div className="t">닫아 둬도 도착하면 알려드릴까요?</div>
            <div className="d">앱을 꺼 둔 사이에 편지가 도착하면 폰으로 알림이 가요.</div>
            <button className="pushbtn" onClick={enable}>알림 켜기</button>
          </>
        )}
        {state === "needs-install" && (
          <>
            <div className="t">홈 화면에 추가하면 알림을 받을 수 있어요</div>
            <div className="d">아이폰은 설치한 앱에서만 알림을 받을 수 있어요. 그림으로 따라 하면 1분이면 돼요.</div>
            <button className="pushbtn" onClick={openInstallGuide}>설치 방법 보기</button>
          </>
        )}
        {state === "denied" && (
          <>
            <div className="t">알림이 막혀 있어요</div>
            <div className="d">브라우저(또는 폰 설정)에서 새 편지의 알림을 허용해 주세요.</div>
          </>
        )}
      </div>
    </div>
  );
}
