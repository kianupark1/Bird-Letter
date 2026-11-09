// 알림 팝업과 푸시 알림이 같은 문구를 쓰도록 한곳에 모았어요.
import { getBird } from "./birds";
import { withEuro, withIGa } from "./korean";
import type { Route } from "./routes";

export type NotifyKind = "sent" | "received";

export function arrivalText(kind: NotifyKind, who: string, route: Route, birdId: string) {
  const bird = getBird(birdId);
  return kind === "sent"
    ? { title: `짹짹! ${who}에게 보낸 편지가 도착했어요`, body: `${bird.name}가 ${route.to.name}에 내려앉았어요` }
    : { title: `짹짹! ${withIGa(who)} 보낸 편지가 도착했어요`, body: `${route.title} · ${bird.name}가 편지를 가져왔어요` };
}

export function passingText(who: string, route: Route, birdId: string, idx: number) {
  const bird = getBird(birdId);
  const pt = route.points[idx], next = route.points[idx + 1];
  return {
    title: `${who}에게 가는 편지가 ${pt.name} 근처예요`,
    body: next ? `${bird.name}가 다음은 ${withEuro(next.name)} 날아가요` : `${bird.name}가 곧 도착해요`,
  };
}

/**
 * 받는 사람용(2026-11-09 대표님: "기다림이 재미있으려면 받는 사람이 어디까지 왔는지 실시간으로 체크하는 게 중요").
 * 보낸 사람만 받던 "지나는 중" 알림을 받는 사람에게도 보내요. 내용은 안 보이고 과정만(핵심 원칙: 과정은 둘 다, 내용은 도착 뒤).
 */
export function incomingPassingText(who: string, route: Route, birdId: string, idx: number, leftMin: number) {
  const bird = getBird(birdId);
  const pt = route.points[idx];
  const left = leftMin >= 60 ? `${Math.floor(leftMin / 60)}시간${leftMin % 60 ? ` ${leftMin % 60}분` : ""}` : `${Math.max(1, leftMin)}분`;
  return {
    title: `💌 ${withIGa(who)} 보낸 편지가 ${pt.name} 근처를 지나요`,
    body: `${bird.name}가 날아오는 중 · 도착까지 약 ${left}. 지금 어디쯤인지 볼까요?`,
  };
}

/** 받는 사람용 "곧 도착" (도착 30분 전) */
export function soonText(who: string, birdId: string, mins: number) {
  const bird = getBird(birdId);
  return { title: `💌 ${mins}분 뒤면 ${withIGa(who)} 보낸 편지가 도착해요`, body: `${bird.name}가 거의 다 왔어요. 무슨 내용일까요?` };
}
