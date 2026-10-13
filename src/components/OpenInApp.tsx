"use client";
import { useEffect, useState } from "react";
import { IS_TOSS } from "@/lib/target";

/**
 * 링크로 웹에 들어온 사람에게 앱 열기를 돕는 띠.
 * - 카카오톡 안 브라우저: 앱·다른 브라우저로 넘어가는 방법 안내
 * - 앱 열기 버튼(saepyeonji://)은 앱이 스토어에 나온 뒤 NEXT_PUBLIC_APP_OPEN=1 로 켠다
 */
const APP_OPEN = process.env.NEXT_PUBLIC_APP_OPEN === "1";

export default function OpenInApp({ id }: { id: string }) {
  const [mode, setMode] = useState<"" | "kakao" | "web">("");
  useEffect(() => {
    if (IS_TOSS) return;
    const w = window as unknown as { Capacitor?: unknown };
    if (w.Capacitor) return; // 이미 앱 안
    if (/KAKAOTALK/i.test(navigator.userAgent)) setMode("kakao");
    else if (APP_OPEN && /iPhone|Android/i.test(navigator.userAgent)) setMode("web");
  }, []);
  if (!mode) return null;
  const here = typeof location === "undefined" ? "" : location.href;
  return (
    <div className="openapp" role="note">
      {mode === "kakao" ? (
        <>
          <span>카카오톡 안에서 열렸어요. 더 편하게 보려면 다른 브라우저로 열어 주세요.</span>
          <a className="btn small" href={`kakaotalk://web/openExternal?url=${encodeURIComponent(here)}`}>다른 브라우저로 열기</a>
        </>
      ) : (
        <>
          <span>새편지 앱이 있으면 앱에서 바로 볼 수 있어요.</span>
          <a className="btn small" href={`saepyeonji://letter/${encodeURIComponent(id)}`}>앱에서 열기</a>
        </>
      )}
    </div>
  );
}
