import { countUsers, kstMidnight, lettersCountQuery, readCount, type AuthUser } from "../../../core/adminStats";
import { googleToken, type ServiceAccount } from "./google";

export type Stats = { at: number; users: ReturnType<typeof countUsers>; letters: { all: number; today: number; week: number } };

/** 가입자·편지 "숫자"만 셈(이름·편지 내용은 읽지 않음). 운영자 숫자판과 매일 저녁 알림이 같이 씀 */
export async function computeStats(sa: ServiceAccount): Promise<Stats> {
  const auth = { Authorization: `Bearer ${await googleToken(sa)}` };
  const now = Date.now();

  // 가입자: 계정 목록을 1,000명씩 받아 셈(최대 20,000명, 넘으면 그만큼만)
  const listUsers = async () => {
    const users: AuthUser[] = [];
    let page = "";
    for (let i = 0; i < 20; i++) {
      const r = await fetch(`https://identitytoolkit.googleapis.com/v1/projects/${sa.project_id}/accounts:batchGet?maxResults=1000${page ? `&nextPageToken=${encodeURIComponent(page)}` : ""}`, { headers: auth });
      if (!r.ok) throw new Error(`accounts-${r.status}`);
      const j = await r.json();
      users.push(...((j.users ?? []) as AuthUser[]));
      page = j.nextPageToken ?? "";
      if (!page) break;
    }
    return users;
  };

  // 편지 수: 전체·오늘·7일(서버가 세기만 하고 내용은 읽지 않음)
  const count = async (since?: number) => {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents:runAggregationQuery`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(lettersCountQuery(since)),
    });
    if (!r.ok) throw new Error(`count-${r.status}`);
    return readCount(await r.json());
  };
  // 네 가지를 동시에 물어봐서 기다리는 시간을 한 번으로 줄여요
  const [users, all, today, week] = await Promise.all([listUsers(), count(), count(kstMidnight(now)), count(now - 7 * 86_400_000)]);
  return { at: now, users: countUsers(users, now), letters: { all, today, week } };
}
