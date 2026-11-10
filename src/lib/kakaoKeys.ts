/**
 * 카카오 JavaScript 키(공개되는 값, 2026-11-10 대표님 콘솔 '플랫폼 키'에서 받음).
 * Vercel 환경 변수 NEXT_PUBLIC_KAKAO_JS_KEY가 있으면 그 값을 먼저 써요.
 * 콘솔의 JS SDK 도메인에 https://bird-letter.vercel.app 이 등록돼 있어야 동작해요.
 */
export const KAKAO_JS_KEY = ((process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "").replace(/^﻿/, "").trim()) || "f5aa566d50e42275abe8243907334c68";
