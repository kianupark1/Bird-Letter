/**
 * 출시 때 바꾸는 값을 한곳에 모았어요.
 * - IS_BETA: 정식 출시 전에는 true. 출시 날 false로 바꾸면 "체험판 · 초안" 표시가 사라져요.
 * - OPERATOR: 법적 문서(방침·약관·운영정책)에 보이는 운영자 정보. 비어 있으면 "출시 전에 채워 넣어요"로 보여요.
 */
export const IS_BETA = true;

export const OPERATOR = {
  /** 서비스 운영자(개인 또는 사업자) 이름 */
  name: "부르노소노",
  /** 문의·신고 대응 이메일 */
  email: "animalmode@naver.com",
};

/** 법적 문서 초안 작성일 */
export const LEGAL_DRAFT_DATE = "2026-10-19";

/**
 * 스토어에 앱이 올라간 뒤 켜요. 켜면 초대 링크를 누른 친구에게 "앱 받기" 버튼이 보여요(core/storeLinks.ts).
 * - android: 구글 플레이에 공개(또는 공개 테스트)되면 true
 * - iosUrl: 앱스토어 주소(예: https://apps.apple.com/kr/app/id0000000000), 없으면 ""
 */
export const STORE = { android: false, iosUrl: "" };
