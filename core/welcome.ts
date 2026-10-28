/**
 * 환영 편지(2026-10-28, 대표님: "환영 편지는 넣자").
 * 가입하면 새편지가 보낸 편지 한 통이 까치를 타고 1분 뒤 도착해요. 첫 사용자(그리고 앱 심사관)가
 * 가입하자마자 "날아오는 지도 → 도착 알림 → 두루마리 펼침"을 직접 겪게 하려는 것.
 * 서버에 저장하지 않고 폰에서 만들어요(서버 규칙을 바꾸지 않음). 답장·신고는 없어요.
 */
import { PLACES, getPlace } from "./places";
import { haversineKm } from "./geo";

/** 보낸 사람(새편지) 표시용 계정 이름. 진짜 계정이 아니라서 답장은 막아요 */
export const WELCOME_FROM = "saepyeonji";
export const WELCOME_NAME = "새편지";
export const WELCOME_BIRD = "magpie"; // 까치: 도착 연출이 특별해요
export const WELCOME_MINUTES = 1;
export const welcomeId = (uid: string) => `welcome-${uid.replace(/[^A-Za-z0-9:_-]/g, "")}`;
export const isWelcome = (id: string | undefined | null) => !!id && id.startsWith("welcome-");

/** 내 동네 가장 가까운 다른 곳에서 내 동네로(짧은 길이라 1분이 어색하지 않게) */
export function welcomeRoute(home: string): string {
  const to = getPlace(home) ?? getPlace("seoul")!;
  let best = PLACES[0], bestKm = Infinity;
  for (const p of PLACES) {
    if (p.id === to.id) continue;
    const km = haversineKm(to.lat, to.lng, p.lat, p.lng);
    if (km < bestKm) { best = p; bestKm = km; }
  }
  return `${best.id}-${to.id}`;
}

export function welcomeText(name: string): string {
  const who = name.trim() ? `${name.trim()}님` : "반가운 분";
  return [
    `${who}, 새편지에 오신 걸 환영해요! 🕊`,
    "",
    "이 편지는 까치가 특별히 서둘러 1분 만에 가져왔어요.",
    "친구에게 보내는 편지는 실제 거리만큼, 몇 시간에서 하루 넘게 걸려요.",
    "기다리는 동안 지도에서 새가 어디쯤 날고 있는지 같이 지켜봐요.",
    "",
    "첫 편지는 가장 보고 싶은 사람에게 보내 보세요.",
    "",
    "기다림도 소통의 일부입니다.",
    "— 새편지 드림",
  ].join("\n");
}

export type WelcomeRecord = { uid: string; start: number; name: string; home: string };

/** 받은 편지 목록에 끼워 넣을 모양(remote.Meta와 같은 칸) */
export function welcomeMeta(r: WelcomeRecord) {
  return {
    id: welcomeId(r.uid),
    fromUid: WELCOME_FROM,
    fromName: WELCOME_NAME,
    toName: r.name,
    routeId: welcomeRoute(r.home),
    birdId: WELCOME_BIRD,
    sentAt: r.start,
    arriveAt: r.start + WELCOME_MINUTES * 60000,
    recipientUid: r.uid,
    departAt: null,
  };
}
