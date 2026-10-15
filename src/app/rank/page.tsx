"use client";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getRoute } from "@/lib/routes";
import { useLetters } from "@/lib/letters";
import { useProfile } from "@/lib/settings";
import { listFriends, type Friend } from "@/lib/firebase/friends";
import { publishStats, readStats } from "@/lib/firebase/stats";
import { firebaseEnabled } from "@/lib/firebase/client";
import { useSession } from "@/lib/session";
import { myPlace, myStats, rankOf, rankValue, type RankEntry, type RankKind } from "../../../core/rank";
import Face from "@/components/Face";
import LoginStart from "@/components/LoginStart";

const km = (n: number) => `${n.toLocaleString("ko-KR")}km`;

/** 우리 랭킹: 친구와 나 중 누가 제일 멀리 보냈을까 (시안 v2-7) */
export default function RankPage() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/rank" />;
  return <Rank />;
}

function Rank() {
  const { letters, ready } = useLetters();
  const { profile } = useProfile();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [stats, setStats] = useState<Record<string, Awaited<ReturnType<typeof readStats>>>>({});
  const [kind, setKind] = useState<RankKind>("total");
  const [loading, setLoading] = useState(true);

  // 내 기록: 지금까지 출발한 내 편지의 노선 거리
  const mine = useMemo(() => myStats(letters.filter((l) => l.sentAt <= Date.now()).map((l) => getRoute(l.routeId).km)), [letters]);

  useEffect(() => {
    if (!ready) return;
    let off = false;
    (async () => {
      void publishStats(mine, profile.nickname, profile.avatarBird); // 내 기록도 최신으로 올려 둬요
      if (!firebaseEnabled) { setLoading(false); return; }
      try {
        const f = await listFriends();
        if (off) return;
        setFriends(f);
        const got = await Promise.all(f.map(async (x) => [x.uid, await readStats(x.uid)] as const));
        if (!off) setStats(Object.fromEntries(got));
      } catch {}
      if (!off) setLoading(false);
    })();
    return () => { off = true; };
  }, [ready, mine, profile.nickname, profile.avatarBird]);

  const entries: RankEntry[] = useMemo(() => [
    { uid: "me", name: profile.nickname || "나", bird: profile.avatarBird, me: true, stats: mine },
    ...friends.map((f) => ({ uid: f.uid, name: f.name, bird: stats[f.uid]?.bird ?? f.bird, me: false, stats: stats[f.uid] ?? null })),
  ], [friends, stats, mine, profile.nickname, profile.avatarBird]);

  const sorted = useMemo(() => rankOf(entries, kind), [entries, kind]);
  const me = myPlace(sorted, kind);
  const top3 = sorted.filter((e) => e.stats).slice(0, 3);
  // 시상대는 2위 1위 3위 순서로 놓아요
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as RankEntry[];
  const rest = sorted.filter((e) => !top3.includes(e));
  const medal = (e: RankEntry) => ["🥇", "🥈", "🥉"][top3.indexOf(e)];

  return (
    <main className="app rankpage">
      <header className="sendhead">
        <Link href="/friends" className="roomback" aria-label="뒤로">‹</Link>
        <div><h1>우리 랭킹 🏆</h1><div className="greet">편지가 날아간 거리의 합이에요</div></div>
      </header>

      <div className="seg" role="radiogroup" aria-label="랭킹 종류">
        <button type="button" role="radio" aria-checked={kind === "total"} className={kind === "total" ? "on" : ""} onClick={() => setKind("total")}>누적 거리</button>
        <button type="button" role="radio" aria-checked={kind === "longest"} className={kind === "longest" ? "on" : ""} onClick={() => setKind("longest")}>가장 먼 한 통</button>
      </div>

      {mine.count === 0 && friends.length === 0 && !loading && (
        <div className="empty" style={{ marginTop: 14 }}>아직 보낸 편지가 없어요.<br />편지를 보내고 친구를 초대하면 랭킹이 생겨요.</div>
      )}

      {podium.length > 0 && (
        <div className="podium">
          {podium.map((e) => {
            const first = e === top3[0];
            return (
              <div key={e.uid} className={`pod ${first ? "first" : ""}`}>
                {first && <div className="crown" aria-hidden>👑</div>}
                <Face name={e.name} bird={e.bird} size={first ? 84 : 70} />
                <div className="pname">{e.me ? "나" : e.name}</div>
                <div className="pkm">{km(rankValue(e, kind))}</div>
                <div className="pstep" aria-hidden>{medal(e)}</div>
              </div>
            );
          })}
        </div>
      )}

      <ul className="threads" style={{ marginTop: 12 }}>
        {rest.map((e, i) => (
          <li key={e.uid}>
            <div className={`trow ${e.me ? "fly" : ""}`}>
              <span className="rnum">{top3.length + i + 1}</span>
              <Face name={e.name} bird={e.bird} size={52} />
              <span className="tmid">
                <span className="tname" style={{ fontSize: 20 }}>{e.me ? "나" : e.name}</span>
                <span className="tst">{e.stats ? `편지 ${e.stats.count}통` : "아직 기록이 없어요"}</span>
              </span>
              <b className="rkm">{e.stats ? km(rankValue(e, kind)) : "–"}</b>
            </div>
          </li>
        ))}
      </ul>

      {me && sorted.length > 1 && (
        <div className="bubble" style={{ marginTop: 16, fontSize: 17 }}>
          {me.rank === 1 ? "내가 1위예요! 🕊" : `내 순위 ${me.rank}위 · 1위 ${me.leader.name}님까지 ${km(me.gapKm)} 🕊`}
        </div>
      )}
      {firebaseEnabled && !loading && friends.length > 0 && Object.values(stats).every((x) => x === null) && (
        <div className="small" style={{ textAlign: "center", fontSize: 14 }}>친구가 새 버전을 열면 거리가 보여요.</div>
      )}
    </main>
  );
}
