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
  /** 내 새(내 얼굴이 되는 새 그림). 처음 가입할 때 직접 골라요. 비어 있으면 아직 안 고른 것 */
  avatarBird: string;
  /** 마지막으로 "내 위치로" 찾았을 때의 구 이름(예: 부산 해운대구). 표시용이고 좌표는 저장하지 않아요 */
  homeLabel?: string;
  /** 내 동네(구)를 친구에게 알려 줄지. 기본 켜짐. 끄면 친구가 받는 곳을 직접 골라요 */
  sharePlace?: boolean;
  /** 내 동네를 직접 정했는지. 정하기 전에는 기본값(서울)을 친구에게 알리지 않아요 */
  homeSet?: boolean;
  /** 내 프로필 사진(가운데를 잘라 줄인 작은 JPEG 글자). 없으면 내 새 얼굴이 보여요 */
  photo?: string;
  /** 프로필 사진이 카카오에서 가져온 것인지(직접 올린 사진은 카카오 사진으로 덮어쓰지 않아요) */
  photoFromKakao?: boolean;
  /** 사진을 직접 지웠는지(지웠으면 카카오 사진을 다시 넣지 않아요) */
  photoOff?: boolean;
  /** 전체 랭킹(가입한 모든 사람)에 내 이름·거리 보이기. 기본 켜짐 */
  publicRank?: boolean;
  /** 펜팔 약속(만 14세 이상·규칙)에 동의했는지 */
  penpalAgreed?: boolean;
  /** 펜팔 이름(비어 있으면 "서울 사는 까치"처럼 자동) */
  penpalName?: string;
  /** 펜팔 관심사(core/penpal.ts PENPAL_TAGS의 id) */
  penpalTags?: string[];
  /** 모르는 누군가의 펜팔 편지 받기. 약속하면 켜져요 */
  penpalOpen?: boolean;
  /** 모르는 누군가의 랜덤(펜팔) 편지를 받겠다고 신청했는지. 신청한 사람에게만 랜덤 편지가 가요(기본 꺼짐) */
  penpalRecv?: boolean;
};
export type FontScale = "small" | "normal" | "large";
export const FONT_SCALES: { id: FontScale; label: string }[] = [
  { id: "small", label: "작게" },
  { id: "normal", label: "보통" },
  { id: "large", label: "크게" },
];

export const PROFILE_KEY = "saepyeonji.profile.v1";

export const DEFAULT_PROFILE: Profile = {
  nickname: "", // 기본 이름("새 친구")은 쓰지 않아요: 같은 이름이 여러 명 생겨 헷갈려서. 카카오 닉네임이나 직접 정한 이름만
  notify: { arrival: true, passing: false, reply: true },
  chirp: true,
  homePlace: "seoul",
  fontScale: "normal",
  avatarBird: "",
};

export function useProfile() {
  const [profile, setProfile] = useState<Profile>(DEFAULT_PROFILE);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved.nickname === "새 친구") saved.nickname = ""; // 옛 기본 이름은 지워요
        setProfile({ ...DEFAULT_PROFILE, ...saved, fontScale: saved.fontScale === "xlarge" ? "large" : saved.fontScale ?? "normal", notify: { ...DEFAULT_PROFILE.notify, ...saved.notify } });
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
