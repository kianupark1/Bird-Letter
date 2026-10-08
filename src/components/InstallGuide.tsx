"use client";
/**
 * 앱 설치 안내 창(아래에서 올라오는 시트).
 * 환경별로 가장 쉬운 길만 보여줘요: 카톡 안이면 "기본 브라우저로 열기", 안드로이드면 "설치" 한 번, 아이폰이면 그림 3장.
 */
import { useEffect, useState } from "react";
import { externalOpenUrl, isKakao, onInstallGuideOpen, oneTapInstall, snoozeInstallCard, useInstall } from "@/lib/install";
import BirdIcon from "@/components/BirdIcon";

/** 아이폰 Safari 아래쪽 도구줄 그림: 공유 버튼에 깜빡이는 동그라미 */
function SafariBar() {
  return (
    <svg viewBox="0 0 320 90" className="ig-art" role="img" aria-label="Safari 맨 아래 도구줄: 가운데 공유 버튼을 눌러요">
      <rect x="4" y="30" width="312" height="56" rx="18" className="ig-bar" />
      <path d="M36 58 l8 -8 v16 z" className="ig-ic" />
      <path d="M92 50 l8 8 -8 8" className="ig-ln" />
      <g transform="translate(160 56)">
        <circle r="22" className="ig-pulse" />
        <rect x="-8" y="-4" width="16" height="14" rx="2.5" className="ig-ln" />
        <path d="M0 -14 v14 M-5 -9 l5 -5 5 5" className="ig-ln" />
      </g>
      <rect x="216" y="48" width="18" height="16" rx="3" className="ig-ln" />
      <rect x="270" y="48" width="18" height="16" rx="3" className="ig-ln" />
      <path d="M160 6 v18 m-6 -6 l6 6 6 -6" className="ig-arrow" />
    </svg>
  );
}

function ShareMenu() {
  return (
    <svg viewBox="0 0 320 120" className="ig-art" role="img" aria-label="메뉴를 위로 밀면 홈 화면에 추가가 보여요">
      <rect x="10" y="4" width="300" height="112" rx="14" className="ig-bar" />
      <rect x="26" y="16" width="150" height="10" rx="5" className="ig-dim" />
      <rect x="26" y="36" width="190" height="10" rx="5" className="ig-dim" />
      <g>
        <rect x="18" y="58" width="284" height="40" rx="10" className="ig-hl" />
        <rect x="30" y="68" width="20" height="20" rx="5" className="ig-ln" />
        <path d="M40 72 v12 M34 78 h12" className="ig-ln" />
        <text x="62" y="84" className="ig-t">홈 화면에 추가</text>
      </g>
    </svg>
  );
}

export default function InstallGuide() {
  const { env, oneTap } = useInstall();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => onInstallGuideOpen(() => setOpen(true)), []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  if (!open || env === "checking" || env === "installed" || env === "desktop") return null;

  const close = () => setOpen(false);
  const later = () => { snoozeInstallCard(7); setOpen(false); };
  const ext = externalOpenUrl();
  const copy = async () => {
    try { await navigator.clipboard.writeText(location.href); setCopied(true); } catch { setCopied(false); }
  };

  return (
    <div className="ig-back" onClick={close} role="presentation">
      <div className="ig-sheet" role="dialog" aria-modal="true" aria-label="앱처럼 설치하기" onClick={(e) => e.stopPropagation()}>
        <div className="ig-head">
          <BirdIcon id="magpie" size={64} letter />
          <div>
            <h2>앱처럼 설치하면 알림이 와요</h2>
            <p>앱을 닫아도 편지가 도착하면 폰이 알려줘요.</p>
          </div>
        </div>

        {env === "inapp" && (
          <>
            <div className="ig-box">
              지금은 <b>{isKakao() ? "카카오톡" : "다른 앱"} 안</b>에서 열려 있어서 설치와 알림을 쓸 수 없어요. <b>기본 브라우저</b>로 다시 열어 주세요.
            </div>
            {ext ? (
              <a className="ig-main" href={ext}>기본 브라우저로 열기</a>
            ) : (
              <div className="ig-steps">
                <div><span>1</span>오른쪽 아래 <b>⋯</b>(또는 공유) 버튼을 눌러요</div>
                <div><span>2</span><b>Safari로 열기</b>를 눌러요</div>
              </div>
            )}
            <button className="ig-sub" onClick={copy}>{copied ? "복사했어요. 브라우저 주소칸에 붙여 넣어요" : "주소 복사하기"}</button>
          </>
        )}

        {env === "android-chrome" && (
          oneTap ? (
            <>
              <div className="ig-box">버튼을 누르고 <b>설치</b>를 한 번 더 누르면 끝이에요.</div>
              <button className="ig-main" onClick={async () => { const ok = await oneTapInstall(); setDone(ok); if (ok) setTimeout(close, 1200); }}>
                {done ? "설치됐어요!" : "앱으로 설치하기"}
              </button>
            </>
          ) : (
            <div className="ig-steps">
              <div><span>1</span>오른쪽 위 <b>⋮</b> 메뉴를 눌러요</div>
              <div><span>2</span><b>앱 설치</b>(또는 <b>홈 화면에 추가</b>)를 눌러요</div>
              <div><span>3</span>안내가 나오면 <b>설치</b>를 눌러요</div>
            </div>
          )
        )}

        {env === "android-other" && (
          <div className="ig-steps">
            <div><span>1</span>브라우저 메뉴(<b>⋮</b> 또는 <b>≡</b>)를 눌러요</div>
            <div><span>2</span><b>홈 화면에 추가</b>를 눌러요</div>
            <div className="ig-note">설치 메뉴가 안 보이면 <b>크롬</b>에서 이 주소를 열어 주세요.</div>
          </div>
        )}

        {env === "ios" && (
          <>
            <div className="ig-step"><span>1</span><div><b>맨 아래 가운데 공유 버튼</b>을 눌러요</div></div>
            <SafariBar />
            <div className="ig-step"><span>2</span><div>메뉴를 <b>위로 밀어서</b> <b>‘홈 화면에 추가’</b>를 눌러요</div></div>
            <ShareMenu />
            <div className="ig-step"><span>3</span><div>오른쪽 위 <b>추가</b>를 누르고, 홈 화면의 <b>새 아이콘</b>으로 열어요</div></div>
            <div className="ig-note">Safari가 아니면 공유 버튼이 다른 곳에 있어요. 그땐 Safari에서 이 주소를 열어 주세요.</div>
          </>
        )}

        <div className="ig-foot">
          <button className="ig-sub" onClick={later}>다음에 할게요</button>
          <button className="ig-sub" onClick={close}>닫기</button>
        </div>
      </div>
    </div>
  );
}
