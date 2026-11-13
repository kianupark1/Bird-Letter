import { countUsers, kstMidnight, lettersCountQuery, penpalsOpenQuery, readCount, type AuthUser, type SocialMap } from "../../../core/adminStats";
import { googleToken, type ServiceAccount } from "./google";

export type Stats = { at: number; users: ReturnType<typeof countUsers>; letters: { all: number; today: number; week: number }; penpals?: number };

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

  // 카카오·네이버 가입자: kakaoAccounts·naverAccounts 문서(uid·연결 시각)
  const socialOf = async (col: "kakaoAccounts" | "naverAccounts", kind: "kakao" | "naver", out: SocialMap) => {
    let page = "";
    for (let i = 0; i < 20; i++) {
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents/${col}?pageSize=1000${page ? `&pageToken=${encodeURIComponent(page)}` : ""}`, { headers: auth });
      if (!r.ok) throw new Error(`${col}-${r.status}`);
      const j = await r.json();
      for (const d of j.documents ?? []) {
        const uid = d.fields?.uid?.stringValue;
        if (typeof uid === "string") out.set(uid, { kind, at: Number(d.fields?.createdAt?.integerValue ?? 0) || Date.parse(d.createTime ?? "") || 0 });
      }
      page = j.nextPageToken ?? "";
      if (!page) break;
    }
  };
  const social: SocialMap = new Map();

  // 편지 수: 전체·오늘·7일(서버가 세기만 하고 내용은 읽지 않음)
  const count = async (since?: number, q: unknown = lettersCountQuery(since)) => {
    const r = await fetch(`https://firestore.googleapis.com/v1/projects/${sa.project_id}/databases/(default)/documents:runAggregationQuery`, {
      method: "POST",
      headers: { ...auth, "Content-Type": "application/json" },
      body: JSON.stringify(q),
    });
    if (!r.ok) throw new Error(`count-${r.status}`);
    return readCount(await r.json());
  };
  // 네 가지를 동시에 물어봐서 기다리는 시간을 한 번으로 줄여요
  const [users, all, today, week, penpals] = await Promise.all([listUsers(), count(), count(kstMidnight(now)), count(now - 7 * 86_400_000), count(undefined, penpalsOpenQuery()).catch(() => undefined), socialOf("kakaoAccounts", "kakao", social), socialOf("naverAccounts", "naver", social)]);
  return { at: now, users: countUsers(users, now, social), letters: { all, today, week }, penpals };
}
