import { STORE } from "@/lib/release";

/**
 * 초대 문자·카카오톡 글(2026-11-02 대표님: "연락처·카카오로 찾으면 바로 편지 쓰기가 아니라 앱스토어 링크를 보내는 거야").
 * 링크는 초대 링크 하나(/invite?c=코드): 누르면 가입 → 자동 친구, 그 화면 가장 큰 버튼이 앱스토어·구글 플레이 받기(STORE 켜진 뒤).
 * 그냥 스토어 주소를 보내면 친구 연결이 끊겨서 초대 링크로 보내요.
 */
export const inviteLink = (code: string) => `${typeof location !== "undefined" ? location.origin : "https://bird-letter.vercel.app"}/invite?c=${code}`;

export function inviteText(nickname: string) {
  const who = nickname || "친구";
  const live = STORE.android || !!STORE.iosUrl;
  return live
    ? `${who}님이 새편지로 초대했어요 🕊 새가 편지를 물고 천천히 날아가는 앱이에요. 링크를 누르면 앱을 받고 바로 친구가 돼요.`
    : `${who}님이 새편지로 초대했어요 🕊 새가 편지를 물고 천천히 날아가는 앱이에요. 링크를 누르면 버튼 한 번으로 가입하고 바로 친구가 돼요.`;
}
