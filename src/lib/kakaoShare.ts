"use client";
import { letterHref } from "./target";
import { STORE } from "./release";

/**
 * 카카오링크로 "카카오톡으로 보내기". 링크를 그냥 붙여넣으면 카카오톡 안 브라우저가 앱 열기를 막는 경우가 있어서,
 * 메시지 버튼에 앱 실행 정보를 담는 카카오링크를 대표 공유 방법으로 쓴다(docs/카톡-앱열기.md).
 * 카카오 개발자 콘솔의 JavaScript 키(공개되는 값)를 NEXT_PUBLIC_KAKAO_JS_KEY 로 넣어야 켜진다.
 */
const KEY = (process.env.NEXT_PUBLIC_KAKAO_JS_KEY ?? "").replace(/^﻿/, "").trim();
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

export async function shareToKakao(letterId: string, birdName: string): Promise<boolean> {
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
        title: "새가 편지를 물고 날아오고 있어요",
        description: `${birdName}가 날아오는 중이에요. 같이 기다려 보세요.`,
        imageUrl: `${location.origin}/og.png`,
        link,
      },
      buttons: [{ title: "편지 어디쯤 왔나 보기", link }],
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
        title: `${inviterName}님이 편지 친구로 초대했어요`,
        description: "새가 날아서 전하는, 천천히 도착하는 편지",
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
