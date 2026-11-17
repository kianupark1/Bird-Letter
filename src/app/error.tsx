"use client";
import { useEffect } from "react";
import { reportError } from "@/lib/reportError";

/** 화면이 오류로 멈췄을 때: 빈 화면 대신 다시 열기 버튼(오류는 서버에 남겨 고쳐요) */
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { reportError(error, "route"); }, [error]);
  return (
    <main className="app">
      <div className="busy" role="alert">
        <span className="busy-dot" aria-hidden>🐦</span>
        <span>앗, 화면을 그리다 새가 잠깐 길을 잃었어요</span>
        <small>다시 열면 대부분 괜찮아져요</small>
        <button type="button" className="cta" onClick={() => reset()}>다시 열기</button>
        <button type="button" className="chip" onClick={() => { location.href = "/"; }}>편지 목록으로</button>
      </div>
    </main>
  );
}
