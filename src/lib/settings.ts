"use client";
import { useCallback, useEffect, useState } from "react";

export type Profile = {
  nickname: string;
  /** 알림 설정. 실제 푸시는 Firebase(FCM) 연동 후 동작 */
  notify: { arrival: boolean; passing: boolean; reply: boolean };
  /** 앱이 열려 있을 때 알림 팝업과 함께 새가 짹짹이는 소리 */
  chirp: boolean;
  /** 내가 지금 있는 지역(편지 쓸 때 보내는 곳의 기본값). 지역 id(core/places.ts) */
  homePlace: string;
  /** 글씨 크기(어르신용): 보통 / 크게 / 아주 크게. 모든 화면에 적용돼요 */
  fontScale: FontScale;
};
export type FontScale = "normal" | "large" | "xlarge";
export const FONT_SCALES: { id: FontScale; label: string }[] = [
  { id: "normal", label: "보통" },
  { id: "large", label: "크게" },
  { id: "xlarge", label: "아주 크게" },
];

export const PROFILE_KEY = "saepyeonji.profile.v1";

export const DEFAULT_PROFILE: Profile = {
  nickname: "새 친구",
  notify: { arrival: true, passing: false, reply: true },
  chirp: true,
  homePlace: "seoul",
  fontScale: "normal",
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        setProfile({ ...DEFAULT_PROFILE, ...saved, notify: { ...DEFAULT_PROFILE.notify, ...saved.notify } });
      }
    } catch {}
    setReady(true);
  }, []);

  /** patch는 바뀔 값, 또는 최신 프로필을 받아 바뀔 값을 돌려주는 함수 */
  const update = useCallback((patch: Partial<Profile> | ((prev: Profile) => Partial<Profile>)) => {
    setProfile((prev) => {
      const next = { ...prev, ...(typeof patch === "function" ? patch(prev) : patch) };
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  return { profile, ready, update };
}
