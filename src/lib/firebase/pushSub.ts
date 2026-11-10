"use client";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db, ensureUser, firebaseEnabled } from "./client";
import { isNativeSub, type PushSub } from "../../../core/pushPayload";
import { schedulePushTo } from "../push";
import { getBird } from "../birds";
import { getRoute } from "../routes";
import { withIGa } from "../korean";

/**
 * 내 푸시 구독을 서버에 맡겨 두면, 친구가 나에게 편지를 보낼 때 친구의 폰이 "도착 알림"을 예약해 줘요.
 * 그래서 내가 앱을 안 열었어도 편지가 도착하면 알림이 와요. 알림 주소에는 편지 내용이 없어요.
 * 읽기 권한은 본인과 친구만(firebase/firestore.rules 의 users/{uid}/push/sub).
 */
const ref = (uid: string) => doc(db(), "users", uid, "push", "sub");

export async function saveMyPushSub(sub: PushSub) {
  if (!firebaseEnabled) return;
  const u = await ensureUser();
  await setDoc(ref(u.uid), isNativeSub(sub)
    ? { fcm: sub.fcm, at: Date.now() } // 스토어 앱(안드로이드)의 기기 토큰
    : { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, at: Date.now() });
}

export async function deleteMyPushSub() {
  if (!firebaseEnabled) return;
  const u = await ensureUser();
  await deleteDoc(ref(u.uid)).catch(() => {});
}

async function friendSub(uid: string): Promise<PushSub | null> {
  try {
    const s = await getDoc(ref(uid));
    const d = s.data();
    if (!d) return null;
    if (typeof d.fcm === "string") return { fcm: d.fcm };
    return { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } };
  } catch {
    return null; // 규칙이 아직 게시되지 않았거나 친구가 알림을 안 켰으면 조용히 건너뜀
  }
}

export type FriendPushResult = "ok" | "nosub" | "fail";
/**
 * 친구에게 편지를 보냈을 때 친구 폰으로 가는 알림(2026-11-10 대표님: "친구한테 보냈는데 알림이 안 떠, 이러면 못 써"):
 *  ① 보내자마자 "💌 ○○님이 편지를 보냈어요 · 도착까지 약 N시간"(예약 편지는 출발 시각에)
 *  ② 1시간 넘게 걸리면 도착 30분 전 "곧 도착해요"
 *  ③ 도착하면 "짹짹! 도착했어요"
 * 친구가 알림을 안 켰으면(구독 없음) "nosub" → 보낸 사람 화면이 카카오톡·문자로 알리기를 띄워요.
 */
export async function notifyFriendLetter(p: { letterId: string; toUid: string; fromName: string; routeId: string; birdId: string; sentAt: number; arriveAt: number }): Promise<FriendPushResult> {
  const sub = await friendSub(p.toUid);
  if (!sub) return "nosub";
  const route = getRoute(p.routeId), bird = getBird(p.birdId);
  const who = p.fromName || "누군가";
  const url = `/letter/${p.letterId}`;
  const start = Math.max(Date.now() + 5000, p.sentAt);
  const total = Math.max(1, Math.round((p.arriveAt - p.sentAt) / 60000));
  const h = Math.floor(total / 60), m = total % 60;
  const left = h ? `${h}시간${m ? ` ${m}분` : ""}` : `${m}분`;
  const jobs = [schedulePushTo(sub, {
    title: `💌 ${who}님이 편지를 보냈어요`,
    body: `${withIGa(bird.name)} ${route.title}을 날아오는 중 · 도착까지 약 ${left}`,
    url, tag: `l-${p.letterId}-d`,
  }, start)];
  if (total > 60) jobs.push(schedulePushTo(sub, { title: `🕊 ${who}님의 편지가 곧 도착해요`, body: `30분 뒤 ${bird.name}가 도착해요`, url, tag: `l-${p.letterId}-s` }, p.arriveAt - 30 * 60000));
  jobs.push(schedulePushTo(sub, { title: `짹짹! ${withIGa(who)} 보낸 편지가 도착했어요`, body: `${route.title} · ${bird.name}가 편지를 가져왔어요`, url, tag: `l-${p.letterId}-r` }, p.arriveAt));
  const res = await Promise.all(jobs);
  return res[0] ? "ok" : "fail";
}

/** 친구에게 편지를 보냈을 때: 도착 시각에 친구 폰으로 알림을 예약한다(실패해도 편지 보내기에는 영향 없음). */
export async function notifyFriendArrival(p: { letterId: string; toUid: string; fromName: string; routeId: string; birdId: string; arriveAt: number }) {
  const sub = await friendSub(p.toUid);
  if (!sub) return;
  const route = getRoute(p.routeId), bird = getBird(p.birdId);
  await schedulePushTo(sub, {
    title: `짹짹! ${withIGa(p.fromName || "누군가")} 보낸 편지가 도착했어요`,
    body: `${route.title} · ${bird.name}가 편지를 가져왔어요`,
    url: `/letter/${p.letterId}`,
    tag: `l-${p.letterId}-r`,
  }, p.arriveAt);
}
