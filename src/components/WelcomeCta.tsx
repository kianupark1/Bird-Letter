"use client";
import Link from "next/link";
import { useEffect } from "react";
import { STORE } from "@/lib/release";
import { track } from "@/lib/funnel";
import { KAKAO_LOGIN_READY, startKakaoLogin } from "@/lib/firebase/kakao";
import { markJustJoined } from "@/lib/install";

/**
 * 소개 페이지(/welcome = 광고 링크가 오는 곳) 버튼(2026-11-24 대표님: "새로 온 사람이 가입 안 하고 안 머무름, 어떻게든 해결").
 * 앱 설치 없이 바로 편지를 써 보는 버튼이 맨 위(아이폰·안드로이드 모두 웹으로 바로), 앱스토어는 그 아래.
 */
export default function WelcomeCta({ view = false }: { view?: boolean }) {
  useEffect(() => { if (view) track("welcome_view"); }, [view]);
  return (
    <div className="wl-cta">
      <Link href="/?try=1" className="cta big wl-try" onClick={() => track("welcome_try")}>✉️ 설치 없이 지금 편지 써 보기</Link>
      {/* 바로 가입하고 싶은 사람은 카카오로 1초(2026-11-24 대표님: "카톡으로 가입하는 옵션도") */}
      {KAKAO_LOGIN_READY && (
        <button type="button" className="cta wl-kakao" onClick={() => { track("welcome_kakao"); markJustJoined(); void startKakaoLogin("/"); }}>💬 카카오로 1초 시작</button>
      )}
      <a href={STORE.iosUrl} className="cta wl-store" onClick={() => track("welcome_store")}>🍎 아이폰 앱은 앱스토어에서 받기</a>
      <p className="small">가입 없이 먼저 써 보고, 보낼 때만 1초 가입 · 받는 사람은 카톡 링크로 앱 없이 열어요 · 무료</p>
    </div>
  );
}
