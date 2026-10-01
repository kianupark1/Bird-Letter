// 빌드 대상 구분. 웹(Vercel)은 값이 비어 있어 항상 false이고, 앱인토스 빌드(toss/next.config.mjs)만 "toss"로 채운다.
// 이 값은 빌드할 때 글자로 바뀌어 들어가므로, 웹 빌드에서는 토스 전용 코드가 실행되지 않는다.
export const IS_TOSS = process.env.NEXT_PUBLIC_TARGET === "toss";

/**
 * 편지 화면 주소.
 * 웹: /letter/<ID> (기존 초대 링크와 같음)
 * 토스: 정적 빌드는 ID마다 화면을 미리 만들 수 없어서 /letter?id=<ID> 한 장으로 처리한다.
 */
export const letterHref = (id: string) => (IS_TOSS ? `/letter?id=${encodeURIComponent(id)}` : `/letter/${id}`);
