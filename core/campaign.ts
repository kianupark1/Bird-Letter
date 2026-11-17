/**
 * 스레드 댓글 → 편지 배달 이벤트(2026-11-17 대표님: "쓰레드 더 제대로, 회원 11명은 심했어").
 * 댓글을 단 사람에게 만든 사람이 비둘기로 진짜 편지를 보내요. 링크로 날아오는 모습을 보고, 도착하면 가입 없이 읽고,
 * 답장하려면 가입(= 편지 한 통이 초대장). 내용은 정해진 글 몇 가지 중 하나(지어낸 후기·약속 없음).
 */
export const CAMPAIGN_FROM_NAME = "새편지 만든 사람";
export const CAMPAIGN_BIRD = "pigeon";
export const CAMPAIGN_ROUTE = "seoul-mapo"; // 서울 중구 → 마포, 비둘기 약 1시간(최소 1시간)

/** 스레드 아이디 → 편지 받는 이름(앞의 @ 빼고 20자) */
export const toNameOf = (username: string) => ("@" + String(username).replace(/^@+/, "")).slice(0, 20);

const LINES = [
  "댓글 남겨 줘서 고마워요.\n이 편지는 비둘기가 서울에서부터 물고 갔어요.\n오는 동안 지도에서 어디쯤인지 한 번쯤 들여다보셨나요?",
  "댓글 하나에 편지 한 통으로 답하고 싶었어요.\n빨리 가는 답장 대신, 한 시간쯤 걸려 도착하는 답장이요.\n기다린 만큼 조금 더 반가웠으면 좋겠어요.",
  "혼자 이 앱을 만들고 있어요.\n댓글 하나가 생각보다 큰 힘이 돼서, 비둘기 편에 고맙다는 말을 보내요.\n오늘 하루도 수고 많았어요.",
];

/** 편지 내용: 댓글 단 사람마다 정해진 글 하나 + 답장 안내 + 슬로건 */
export function campaignMessage(username: string, seed: string) {
  let h = 0;
  for (const c of seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  const name = String(username).replace(/^@+/, "");
  return `${name}님, 안녕하세요 🕊\n\n${LINES[h % LINES.length]}\n\n답장은 새편지에서 보낼 수 있어요. 제가 받으면 꼭 읽을게요.\n\n기다림도 소통의 일부입니다.\n— ${CAMPAIGN_FROM_NAME}`;
}

/** 우리 계정이 단 댓글에 붙일 답글 */
export function campaignReplyText(username: string, link: string, minutes: number) {
  const name = String(username).replace(/^@+/, "");
  const t = minutes >= 60 ? `약 ${Math.floor(minutes / 60)}시간${minutes % 60 >= 10 ? ` ${minutes % 60}분` : ""}` : `약 ${minutes}분`;
  return `@${name} 님께 비둘기가 편지를 물고 출발했어요 🕊\n도착까지 ${t} · 지금 어디쯤인지 보기 👇\n${link}`;
}

/** 이 댓글에 편지를 보낼지: 우리 계정·이미 보낸 사람·빈 아이디는 빼요 */
export function shouldSend(reply: { username?: string; id?: string }, me: string, done: Set<string>) {
  const u = String(reply.username ?? "").replace(/^@+/, "").toLowerCase();
  if (!u || !reply.id) return false;
  if (u === me.toLowerCase()) return false;
  return !done.has("u:" + u) && !done.has("r:" + reply.id);
}
