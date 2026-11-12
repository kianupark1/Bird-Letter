"use client";
import { KAKAO_JS_KEY } from "@/lib/kakaoKeys";
import { letterHref } from "./target";
import { STORE } from "./release";

/**
 * 카카오링크로 "카카오톡으로 보내기". 링크를 그냥 붙여넣으면 카카오톡 안 브라우저가 앱 열기를 막는 경우가 있어서,
 * 메시지 버튼에 앱 실행 정보를 담는 카카오링크를 대표 공유 방법으로 쓴다(docs/카톡-앱열기.md).
 * 카카오 개발자 콘솔의 JavaScript 키(공개되는 값)를 NEXT_PUBLIC_KAKAO_JS_KEY 로 넣어야 켜진다.
 */
const KEY = KAKAO_JS_KEY;
const SDK = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.2/kakao.min.js";

export const KAKAO_SHARE_READY = Boolean(KEY);

type KakaoSdk = {
  isInitialized(): boolean;
  init(key: string): void;
  Share: { sendDefault(o: unknown): void };
};

function load(): Promise<KakaoSdk> {
  const w = window as unknown as { Kakao?: KakaoSdk };
  if (w.Kakao) return Promise.resolve(w.Kakao);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SDK;
    s.async = true;
    s.onload = () => (w.Kakao ? resolve(w.Kakao) : reject(new Error("kakao")));
    s.onerror = () => reject(new Error("kakao"));
    document.head.appendChild(s);
  });
}

/**
 * 앱이 없는 사람에게 "편지가 날아오고 있다"고 카카오톡으로 알려요(2026-11-12 대표님: "앱 안 깐 사람에게 보내고 카톡으로 알림, 궁금하면 깔아서 보게").
 * 궁금증(누가·지금 날아오는 중·내용은 앱에서) + 버튼 한 개(편지 받기 → 카카오로 받기 → 앱 받기)
 */
export async function shareToKakao(letterId: string, birdName: string, fromName?: string, leftText?: string): Promise<boolean> {
  if (!KEY) return false;
  try {
    const k = await load();
    if (!k.isInitialized()) k.init(KEY);
    const url = `${location.origin}${letterHref(letterId)}`;
    const link = {
      mobileWebUrl: url,
      webUrl: url,
      iosExecutionParams: { letter: letterId },
      androidExecutionParams: { letter: letterId },
    };
    k.Share.sendDefault({
      objectType: "feed",
      content: {
        title: fromName ? `💌 ${fromName}님이 당신에게 편지를 보냈어요` : "💌 당신에게 편지가 날아오고 있어요",
        description: `지금 ${birdName}가 날아오는 중 🕊${leftText ? ` · ${leftText}` : ""}\n무슨 내용일까요? 새편지 앱에서 열어 볼 수 있어요`,
        imageUrl: `${location.origin}/og.png`,
        link,
      },
      buttons: [{ title: "💌 편지 받기", link }],
    });
    return true;
  } catch {
    return false;
  }
}

/** 친구 초대를 카카오톡으로 보내기(카카오톡 안의 친구 고르는 화면이 열려요). 받은 친구는 링크를 눌러 로그인하면 자동으로 친구가 돼요 */
export async function shareInviteToKakao(code: string, inviterName: string): Promise<boolean> {
  if (!KEY) return false;
  try {
    const k = await load();
    if (!k.isInitialized()) k.init(KEY);
    const url = `${location.origin}/invite?c=${encodeURIComponent(code)}`;
    const link = { mobileWebUrl: url, webUrl: url, iosExecutionParams: { invite: code }, androidExecutionParams: { invite: code } };
    k.Share.sendDefault({
      objectType: "feed",
      content: {
        title: `💌 ${inviterName}님이 편지를 주고받고 싶대요`,
        description: "카톡으로는 어려운 말도, 새가 천천히 전해 주면 한결 부드러워져요 🕊",
        imageUrl: `${location.origin}/og.png`,
        link,
      },
      buttons: [{ title: STORE.android || STORE.iosUrl ? "친구 되고 앱 받기" : "친구 되기", link }],
    });
    return true;
  } catch {
    return false;
  }
}
