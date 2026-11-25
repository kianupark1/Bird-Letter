/**
 * 가입 뒤 "만든 사람의 편지"(2026-11-24 대표님 "셋 다 해": 한 번 쓰고 끝나지 않게 다시 오게 만들기).
 * 가입하면 운영자(대표님) 계정이 비둘기로 진짜 편지 한 통을 보내요(서울 중구 → 마포, 약 1시간).
 * 도착하면 알림이 와서 다시 들어오고, 기다림을 직접 겪어 봐요. 답장하면 대표님이 받아요(지어낸 약속·후기 없음).
 * 계정마다 딱 한 통(편지 ID가 계정으로 정해져 있어요).
 */
export const HELLO_FROM_NAME = "새편지 만든 사람";
export const HELLO_BIRD = "pigeon";
export const HELLO_ROUTE = "seoul-mapo";

/** 계정마다 하나로 정해지는 편지 ID(영문·숫자 10~40자) */
export const helloId = (uid: string) => `hi${uid.replace(/[^A-Za-z0-9]/g, "")}`.slice(0, 40).padEnd(10, "0");

/** 받는 이름: 앞뒤 공백 빼고 20자, 없으면 "새 친구" */
export const helloToName = (name: unknown) => (typeof name === "string" && name.trim() ? name.trim().slice(0, 20) : "새 친구");

export function helloText(toName: string) {
  const who = toName === "새 친구" ? "반가운 분" : `${toName}님`;
  return [
    `${who}, 새편지에 와 주셔서 고마워요 🕊`,
    "",
    "이 편지는 비둘기가 서울 하늘을 한 시간쯤 날아서 가져왔어요.",
    "기다리는 동안 조금 궁금하셨나요? 그 마음이 새편지가 전하고 싶은 거예요.",
    "",
    "첫 편지는 가장 보고 싶은 사람에게 보내 보세요.",
    "카톡으로 링크만 보내면, 받는 사람은 앱이 없어도 바로 열어 봐요.",
    "",
    "궁금한 점이나 바라는 점이 있으면 이 편지에 답장해 주세요. 만든 사람이 직접 읽어요.",
    "",
    "기다림도 소통의 일부입니다.",
    "— 새편지 만든 사람 드림",
  ].join("\n");
}
