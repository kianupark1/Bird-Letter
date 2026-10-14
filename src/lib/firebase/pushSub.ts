"use client";
import { deleteDoc, doc, getDoc, setDoc } from "firebase/firestore";
import { db, ensureUser, firebaseEnabled } from "./client";
import type { PushSub } from "../../../core/pushPayload";
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
  await setDoc(ref(u.uid), { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth, at: Date.now() });
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
    return d ? { endpoint: d.endpoint, keys: { p256dh: d.p256dh, auth: d.auth } } : null;
  } catch {
    return null; // 규칙이 아직 게시되지 않았거나 친구가 알림을 안 켰으면 조용히 건너뜀
  }
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
