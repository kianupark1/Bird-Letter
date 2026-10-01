"use client";
import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously, type User } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// 웹 앱에 공개되는 식별 정보라 비밀이 아닙니다. 보호는 firebase/firestore.rules 가 합니다.
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

/** 설정값이 없으면(예: 내 컴퓨터에 .env.local이 없을 때) 서버 없이 "내 폰 저장" 방식으로 동작합니다. */
export const firebaseEnabled = Boolean(config.apiKey && config.projectId && config.appId);

function app() {
  return getApps().length ? getApp() : initializeApp(config);
}

export const db = () => getFirestore(app());
export const auth = () => getAuth(app());

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
