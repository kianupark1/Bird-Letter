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
  // 2026-11-09 대표님: "내가 보낸 걸 상대가 받길 원하는 것 · 카톡으로 힘든 말을 기분 풀리는 시간을 주는 것 · 궁금증"
  const head = `💌 ${who}님이 당신과 편지를 주고받고 싶대요\n카톡으로는 꺼내기 어려운 말도, 새가 천천히 전해 주면 마음이 한결 풀려요 🕊`;
  return live
    ? `${head}\n링크를 누르면 앱을 받고 바로 ${who}님과 친구가 돼요.`
    : `${head}\n링크를 누르면 버튼 한 번으로 가입하고 바로 ${who}님과 친구가 돼요.`;
}
