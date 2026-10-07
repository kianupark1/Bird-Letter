// 알림 팝업과 푸시 알림이 같은 문구를 쓰도록 한곳에 모았어요.
import { getBird } from "./birds";
import { withIGa } from "./korean";
import type { Route } from "./routes";

export type NotifyKind = "sent" | "received";

export function arrivalText(kind: NotifyKind, who: string, route: Route, birdId: string) {
  const bird = getBird(birdId);
  return kind === "sent"
    ? { title: `${who}에게 보낸 편지가 도착했어요!`, body: `${bird.name}가 ${route.to.name}에 내려앉았어요` }
    : { title: `${withIGa(who)} 보낸 편지가 도착했어요!`, body: `${route.title} · ${bird.name}가 편지를 가져왔어요` };
}

export function passingText(who: string, route: Route, birdId: string, idx: number) {
  const bird = getBird(birdId);
  const pt = route.points[idx], next = route.points[idx + 1];
  return {
    title: `${who}에게 가는 편지가 ${pt.name} 근처예요`,
    body: next ? `${bird.name}가 다음은 ${next.name}(으)로 날아가요` : `${bird.name}가 곧 도착해요`,
  };
}
