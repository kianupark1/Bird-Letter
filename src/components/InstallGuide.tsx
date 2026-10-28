"use client";
/**
 * 앱 설치 안내 창(아래에서 올라오는 시트).
 * 환경별로 가장 쉬운 길만 보여줘요: 카톡 안이면 "기본 브라우저로 열기", 안드로이드면 "설치" 한 번, 아이폰이면 그림 3장.
 */
import { useEffect, useState } from "react";
import { consumeInstallParam, externalOpenUrl, isKakao, onInstallGuideOpen, oneTapInstall, snoozeInstallCard, useInstall } from "@/lib/install";
import BirdIcon from "@/components/BirdIcon";
import { STORE } from "@/lib/release";

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

/** 새 Safari(iOS 26~): 공유 버튼이 주소창 오른쪽에 있거나, 맨 아래 ⋯ 안에 있어요(2026-10-28 대표님 폰 화면) */
function SafariNewBar() {
  return (
    <svg viewBox="0 0 320 150" className="ig-art" role="img" aria-label="주소창 오른쪽 공유 버튼, 또는 맨 아래 오른쪽 점 세 개 버튼">
      <rect x="6" y="8" width="308" height="44" rx="22" className="ig-bar" />
      <rect x="60" y="24" width="150" height="10" rx="5" className="ig-dim" />
      <g transform="translate(286 30)">
        <circle r="19" className="ig-pulse" />
        <rect x="-7" y="-3" width="14" height="12" rx="2.5" className="ig-ln" />
        <path d="M0 -12 v12 M-4.5 -7.5 l4.5 -4.5 4.5 4.5" className="ig-ln" />
      </g>
      <text x="160" y="80" textAnchor="middle" className="ig-t" style={{ fontSize: 13, opacity: 0.7 }}>공유 버튼이 안 보이면 ↓</text>
      <rect x="6" y="94" width="308" height="50" rx="18" className="ig-bar" />
      <path d="M30 119 h18 M30 119 l6 -6 M30 119 l6 6" className="ig-ln" />
      <path d="M90 119 h18 M108 119 l-6 -6 M108 119 l-6 6" className="ig-ln" />
      <path d="M160 110 v18 M151 119 h18" className="ig-ln" />
      <rect x="212" y="110" width="18" height="18" rx="4" className="ig-ln" />
      <g transform="translate(282 119)">
        <circle r="17" className="ig-pulse" />
        <circle cx="-7" r="2.4" className="ig-dot" /><circle r="2.4" className="ig-dot" /><circle cx="7" r="2.4" className="ig-dot" />
      </g>
    </svg>
  );
}

/** 새 Safari인지(iOS 26 이상): 공유 버튼 자리가 바뀌었어요 */
const newSafari = () => { const m = navigator.userAgent.match(/OS (\d+)_/); return !!m && Number(m[1]) >= 26; };

/**
 * 아이폰 안내: 먼저 볼지 묻고(2026-10-28 대표님: "설명 듣기랑 아님이랑 선택"), 보면 한 장씩.
 * 애플이 웹은 저절로 홈 화면에 추가하지 못하게 막아 둬서, 공유 메뉴에서 직접 두 번 눌러야 해요.
 */
function IosSteps({ onClose, onLater }: { onClose: () => void; onLater: () => void }) {
  const [step, setStep] = useState<number | null>(null);
  const fresh = newSafari();
  const steps = [
    { t: fresh ? <>주소창 오른쪽 <b>공유 버튼</b>(네모에 ↑)을 눌러요. 안 보이면 맨 아래 오른쪽 <b>점 세 개 버튼</b>을 누르면 있어요.</> : <>맨 아래 가운데 <b>공유 버튼</b>(네모에 ↑)을 눌러요.</>, art: fresh ? <SafariNewBar /> : <SafariBar /> },
    { t: <>메뉴를 <b>위로 밀어서</b> <b>‘홈 화면에 추가’</b>를 눌러요. 안 보이면 <b>더 보기</b>를 눌러 찾아요.</>, art: <ShareMenu /> },
    { t: <>오른쪽 위 <b>추가</b>를 누르면 끝! 홈 화면의 <b>새 편지</b> 아이콘으로 열고, 처음 한 번만 같은 버튼으로 로그인해요.</>, art: null },
  ];
  // 앱스토어에 나온 뒤에는 앱 받기가 1순위(누르면 끝·알림도 잘 옴), 홈 화면 추가는 그다음(2026-10-28 대표님: "애플 기준 1. 앱스토어 바로가기 2. 홈 화면에 추가 설명")
  if (step === null && STORE.iosUrl)
    return (
      <>
        <div className="ig-box">아이폰은 <b>앱스토어에서 받는 게 가장 쉬워요.</b><br />[받기] 한 번이면 끝, 알림도 잘 와요.</div>
        <a className="ig-main" href={STORE.iosUrl}>📲 앱스토어에서 받기</a>
        <button className="ig-sub" onClick={() => setStep(0)}>앱 없이 홈 화면에 추가하는 방법 보기</button>
        <div className="ig-foot">
          <button className="ig-sub" onClick={onLater}>다음에 할게요</button>
        </div>
      </>
    );
  if (step === null)
    return (
      <>
        <div className="ig-box">아이폰은 <b>Safari 공유 메뉴에서 두 번</b>만 누르면 홈 화면에 추가돼요.<br /><span style={{ opacity: 0.75, fontSize: 14 }}>애플이 웹사이트는 저절로 추가하지 못하게 막아 둬서, 직접 눌러야 해요.</span></div>
        <button className="ig-main" onClick={() => setStep(0)}>방법 보기 (30초)</button>
        <div className="ig-foot">
          <button className="ig-sub" onClick={onClose}>괜찮아요, 할 줄 알아요</button>
          <button className="ig-sub" onClick={onLater}>다음에 할게요</button>
        </div>
      </>
    );
  const s = steps[step], last = step === steps.length - 1;
  return (
    <>
      <div className="ig-step"><span>{step + 1}</span><div>{s.t}</div></div>
      {s.art}
      <div className="tour-dots" aria-hidden>{steps.map((_, k) => <i key={k} className={k === step ? "on" : ""} />)}</div>
      <div className="ig-foot">
        {step > 0 ? <button className="ig-sub" onClick={() => setStep(step - 1)}>이전</button> : <button className="ig-sub" onClick={onClose}>닫기</button>}
        <button className="ig-main" style={{ flex: 2 }} onClick={() => (last ? onClose() : setStep(step + 1))}>{last ? "알겠어요" : "다음"}</button>
      </div>
    </>
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
  // 카카오톡 안에서 [홈 화면에 추가]를 눌러 기본 브라우저로 넘어온 경우: 안내를 바로 열어요
  useEffect(() => { if (consumeInstallParam()) setOpen(true); }, []);
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open]);

  if (!open || env === "checking" || env === "installed" || env === "desktop") return null;

  const close = () => setOpen(false);
  const later = () => { snoozeInstallCard(7); setOpen(false); };
  const ext = externalOpenUrl(true);
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

        {env === "ios" && <IosSteps onClose={close} onLater={later} />}

        {env !== "ios" && (
          <div className="ig-foot">
            <button className="ig-sub" onClick={later}>다음에 할게요</button>
            <button className="ig-sub" onClick={close}>닫기</button>
          </div>
        )}
      </div>
    </div>
  );
}
