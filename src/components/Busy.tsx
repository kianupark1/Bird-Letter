"use client";
import { useEffect, useState } from "react";

/**
 * 불러오는 동안의 화면(2026-11-17 대표님: "편지 누르면 아무것도 안 뜨는 오류가 자주 나와").
 * 예전엔 빈 화면만 보여서 멈춘 것처럼 보였어요 → 잠깐 뒤 "불러오는 중", 8초가 넘으면 [다시 불러오기].
 */
export default function Busy({ label = "편지를 불러오는 중…" }: { label?: string }) {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const a = setTimeout(() => setStep(1), 500), b = setTimeout(() => setStep(2), 8000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);
  return (
    <main className="app" aria-busy="true">
      {step > 0 && (
        <div className="busy" role="status">
          <span className="busy-dot" aria-hidden>🕊</span>
          <span>{label}</span>
          {step > 1 && (
            <>
              <small>인터넷이 느리면 조금 걸릴 수 있어요</small>
              <button type="button" className="cta" onClick={() => location.reload()}>다시 불러오기</button>
            </>
          )}
        </div>
      )}
    </main>
  );
}
