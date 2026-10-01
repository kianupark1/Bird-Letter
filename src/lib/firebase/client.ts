"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import {
  browserLocalPersistence, getAuth, indexedDBLocalPersistence, initializeAuth, onAuthStateChanged, signInAnonymously,
  type Auth, type User,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 웹 앱에 공개되는 식별 정보라 비밀이 아닙니다. 보호는 firebase/firestore.rules 가 합니다.
// 환경 변수 값 앞뒤에 보이지 않는 글자(BOM, 줄바꿈, 공백)가 섞이면 서버 요청 머리글이 깨져
// "auth/network-request-failed"로 보인다(실제로 겪음). 항상 걸러서 쓴다.
const clean = (v?: string) => v?.replace(/^﻿/, "").trim();
const config = {
  apiKey: clean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
  authDomain: clean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
  projectId: clean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
  storageBucket: clean(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET),
  messagingSenderId: clean(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID),
  appId: clean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
};

/** 설정값이 없으면(예: 내 컴퓨터에 .env.local이 없을 때) 서버 없이 "내 폰 저장" 방식으로 동작합니다. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

function app() {
  return getApps().length ? getApp() : initializeApp(config);
}

export const db = () => getFirestore(app());
let authInstance: Auth | null = null;

/**
 * 익명 로그인만 쓰므로 구글 팝업/리다이렉트용 부품(apis.google.com, firebaseapp.com 보조 창)을 불러오지 않는다.
 * 그 부품은 "허용 도메인"에 없는 주소에서 로그인을 막아 버릴 수 있다. (구글·카카오 로그인을 붙일 때 다시 추가)
 */
export const auth = () => {
  if (authInstance) return authInstance;
  const a = app();
  try {
    authInstance = initializeAuth(a, { persistence: [indexedDBLocalPersistence, browserLocalPersistence] });
  } catch {
    authInstance = getAuth(a); // 이미 만들어져 있으면(개발 중 코드 갱신 등) 그것을 사용
  }
  return authInstance;
};

let pending: Promise<User> | null = null;

/** 익명 로그인(계정 없이 시작). 이미 로그인돼 있으면 그대로 돌려줍니다. */
export function ensureUser(): Promise<User> {
  const a = auth();
  if (a.currentUser) return Promise.resolve(a.currentUser);
  if (!pending) {
    pending = new Promise<User>((resolve, reject) => {
      const stop = onAuthStateChanged(a, async (u) => {
        stop();
        if (u) return resolve(u);
        try {
          resolve((await signInAnonymously(a)).user);
        } catch (e) {
          reject(e);
        }
      });
    }).finally(() => {
      pending = null;
    });
  }
  return pending;
}
