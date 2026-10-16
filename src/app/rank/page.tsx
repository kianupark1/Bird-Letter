"use client";
import { useEffect, useMemo, useState } from "react";
import { getRoute } from "@/lib/routes";
import { useLetters } from "@/lib/letters";
import { useProfile } from "@/lib/settings";
import { listFriends, type Friend } from "@/lib/firebase/friends";
import { publishStats, readStats } from "@/lib/firebase/stats";
import { listPublicRank, publishPublicRank, type PublicRow } from "@/lib/firebase/ranking";
import { auth } from "@/lib/firebase/client";
import { firebaseEnabled } from "@/lib/firebase/client";
import { useSession } from "@/lib/session";
import { myPlace, myStatsCapped, rankOf, rankValue, type RankEntry, type RankKind } from "../../../core/rank";
import Face from "@/components/Face";
import LoginStart from "@/components/LoginStart";
import BirdIcon from "@/components/BirdIcon";
import { buildThreads } from "../../../core/threads";
import { usePeople } from "@/lib/people";
import GearLink from "@/components/GearLink";
import { MILESTONES, journeyOf, lapsText } from "../../../core/journey";

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
  // 친구끼리 / 가입한 사람 전체(2026-10-17 대표님: "가입된 사람 모두 보이게")
  const [scope, setScope] = useState<"all" | "friends">("all");
  const [pub, setPub] = useState<PublicRow[] | null>(null);
  const showMe = profile.publicRank !== false;
  const { book } = usePeople();
  const [loading, setLoading] = useState(true);

  // 내 기록: 지금까지 출발한 내 편지의 노선 거리
  const mine = useMemo(() => myStatsCapped(letters.filter((l) => l.sentAt <= Date.now()).map((l) => ({ km: getRoute(l.routeId).km, toKey: l.toUid ?? l.to, at: l.sentAt }))), [letters]);

  useEffect(() => {
    if (!ready) return;
    let off = false;
    (async () => {
      void publishStats(mine, profile.nickname, profile.avatarBird, profile.sharePlace === false || !profile.homeSet ? undefined : profile.homePlace); // 내 기록도 최신으로 올려 둬요
      if (firebaseEnabled) void publishPublicRank(mine, profile.nickname, profile.avatarBird, showMe);
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
  }, [ready, mine, profile.nickname, profile.avatarBird, profile.homePlace, profile.sharePlace, profile.homeSet, showMe]);

  // 전체 랭킹: 위에서부터 50명(내 기록을 올린 직후에 읽도록 조금 기다려요)
  useEffect(() => {
    if (!firebaseEnabled || scope !== "all") return;
    let off = false;
    setPub(null);
    const t = setTimeout(() => { listPublicRank(kind).then((r) => { if (!off) setPub(r); }).catch(() => { if (!off) setPub([]); }); }, 400);
    return () => { off = true; clearTimeout(t); };
  }, [scope, kind, mine.km, mine.maxKm]);

  const entries: RankEntry[] = useMemo(() => [
    { uid: "me", name: profile.nickname || "나", bird: profile.avatarBird, photo: profile.photo, me: true, stats: mine },
    // 같은 사람의 여러 계정은 한 줄로(기록이 큰 계정 기준), 이름은 친구 목록과 같게(내가 부르는 이름 > 진짜 이름 > "이름 없는 친구 N")
    ...buildThreads([], [], friends, book).filter((t) => t.uid).map((t) => {
      const ids = t.uids ?? [t.uid!];
      const best = ids.map((u) => stats[u]).filter(Boolean).sort((a, b) => (b!.km - a!.km))[0] ?? null;
      const f = friends.find((x) => ids.includes(x.uid));
      return { uid: t.key, name: t.name, bird: best?.bird ?? f?.bird, photo: f?.photo, me: false, stats: best };
    }),
  ], [friends, stats, mine, profile.nickname, profile.avatarBird, profile.photo, book]);

  const myUid = (() => { try { return auth().currentUser?.uid; } catch { return undefined; } })();
  const pubEntries: RankEntry[] = useMemo(() => {
    const rows = (pub ?? []).map((r): RankEntry => ({ uid: r.uid, name: r.name, bird: r.bird, me: r.uid === myUid, photo: r.uid === myUid ? profile.photo : undefined, stats: { km: r.km, maxKm: r.maxKm, count: r.count } }));
    return rows;
  }, [pub, myUid, profile.photo]);
  const global = scope === "all" && firebaseEnabled;
  const sorted = useMemo(() => rankOf(global ? pubEntries : entries, kind), [global, pubEntries, entries, kind]);
  const meInTop = !global || sorted.some((e) => e.me);
  const me = myPlace(sorted, kind);
  const togetherKm = entries.reduce((a, e) => a + (e.stats?.km ?? 0), 0);
  const top3 = sorted.filter((e) => e.stats).slice(0, 3);
  // 시상대는 2위 1위 3위 순서로 놓아요
  const podium = [top3[1], top3[0], top3[2]].filter(Boolean) as RankEntry[];
  const rest = sorted.filter((e) => !top3.includes(e));
  const medal = (e: RankEntry) => ["🥇", "🥈", "🥉"][top3.indexOf(e)];

  return (
    <main className="app rankpage">
      <header className="tabhead">
        <div><h1 className="pagetitle">누가누가 멀리 보냈나 🏆</h1><div className="greet">{global ? "새 편지를 쓰는 모든 사람" : "친구와 나"}, 편지가 날아간 거리</div></div>
        <GearLink />
      </header>

      {firebaseEnabled && (
        <div className="seg" role="radiogroup" aria-label="랭킹 범위" style={{ marginBottom: 8 }}>
          <button type="button" role="radio" aria-checked={scope === "all"} className={scope === "all" ? "on" : ""} onClick={() => setScope("all")}>🌏 전체</button>
          <button type="button" role="radio" aria-checked={scope === "friends"} className={scope === "friends" ? "on" : ""} onClick={() => setScope("friends")}>👥 친구</button>
        </div>
      )}

      <div className="seg" role="radiogroup" aria-label="랭킹 종류">
        <button type="button" role="radio" aria-checked={kind === "total"} className={kind === "total" ? "on" : ""} onClick={() => setKind("total")}>누적 거리</button>
        <button type="button" role="radio" aria-checked={kind === "longest"} className={kind === "longest" ? "on" : ""} onClick={() => setKind("longest")}>가장 먼 한 통</button>
      </div>

      {global && pub === null && <div className="empty" style={{ marginTop: 14 }}>랭킹을 불러오는 중…</div>}
      {global && pub !== null && pub.length === 0 && <div className="empty" style={{ marginTop: 14 }}>아직 전체 랭킹에 올라온 사람이 없어요.<br />편지를 보내면 내가 첫 번째예요!</div>}
      {!global && mine.count === 0 && friends.length === 0 && !loading && (
        <div className="empty" style={{ marginTop: 14 }}>아직 보낸 편지가 없어요.<br />편지를 보내고 친구를 초대하면 랭킹이 생겨요.</div>
      )}

      {podium.length > 0 && (
        <div className="podium">
          {podium.map((e) => {
            const first = e === top3[0];
            return (
              <div key={e.uid} className={`pod ${first ? "first" : ""}`}>
                {first && <div className="crown" aria-hidden>👑</div>}
                <Face name={e.name} bird={e.bird} photo={e.photo} size={first ? 84 : 70} />
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
              <Face name={e.name} bird={e.bird} photo={e.photo} size={52} />
              <span className="tmid">
                <span className="tname" style={{ fontSize: 20 }}>{e.me ? "나" : e.name}</span>
                <span className="tst">{e.stats ? `편지 ${e.stats.count}통` : "아직 기록이 없어요"}</span>
              </span>
              <b className="rkm">{e.stats ? km(rankValue(e, kind)) : "–"}</b>
            </div>
          </li>
        ))}
      </ul>

      {global && pub !== null && !meInTop && (
        <div className="bubble" style={{ marginTop: 12, fontSize: 17 }}>
          {!showMe ? "전체 랭킹에서 내 이름을 숨겨 두었어요(설정에서 바꿀 수 있어요)" : mine.count === 0 ? "편지를 보내면 나도 랭킹에 올라가요 🕊" : `내 기록 ${km(rankValue({ uid: "me", name: "", me: true, stats: mine }, kind))} · 50위 안에 들면 이름이 보여요 🕊`}
        </div>
      )}
      {global && <div className="small" style={{ textAlign: "center", fontSize: 14 }}>전체 랭킹에는 이름·내 새·거리만 보여요(동네·사진은 안 보여요). 설정에서 내 이름을 숨길 수 있어요.</div>}

      <Journey title="🚀 나의 우주 여행" km={mine.km} />
      {friends.length > 0 && <Journey title="🌏 우리가 함께 날린 거리" km={togetherKm} together />}

      {me && sorted.length > 1 && meInTop && (
        <div className="bubble" style={{ marginTop: 16, fontSize: 17 }}>
          {me.rank === 1 ? "내가 1위예요! 🕊" : `내 순위 ${me.rank}위 · 1위 ${me.leader.name}님까지 ${km(me.gapKm)} 🕊`}
        </div>
      )}
      <div className="small" style={{ textAlign: "center", fontSize: 14 }}>공정하게 겨루도록 하루에 같은 친구는 2통, 전체는 8통까지만 거리에 더해요.</div>
      {firebaseEnabled && !loading && friends.length > 0 && Object.values(stats).every((x) => x === null) && (
        <div className="small" style={{ textAlign: "center", fontSize: 14 }}>친구가 새 버전을 열면 거리가 보여요.</div>
      )}
    </main>
  );
}

/** 거리를 지구·달·화성에 빗댄 이정표 카드 */
function Journey({ title, km: total, together }: { title: string; km: number; together?: boolean }) {
  const j = journeyOf(total);
  const p = Math.round(j.pct);
  return (
    <div className="eta2 goalcard" role="group" aria-label={title}>
      <div className="gl">{title}</div>
      <div className="gv"><b>{km(total)}</b> <span>= 지구 {lapsText(total)}</span></div>
      {j.next ? (
        <>
          <div className="small" style={{ margin: "0 0 4px" }}>{j.prev ? `${j.prev.emoji} ${j.prev.name} 지났어요 · ` : ""}다음은 {j.next.emoji} <b>{j.next.name}</b> — {km(j.next.km)}</div>
          <div className="mtrack"><i style={{ width: `${p}%` }} /><span className="mb" style={{ left: `${p}%` }}><BirdIcon id="magpie" size={40} /></span></div>
          <div className="small" style={{ margin: "6px 0 0" }}>{j.next.name}까지 {p}% · 앞으로 {km(Math.round(j.leftKm))}{together ? " 같이 채워 봐요!" : ""}</div>
        </>
      ) : <div className="small">태양까지 다녀왔어요! 🎉</div>}
      <div className="jstops" aria-hidden>
        {MILESTONES.map((m) => <span key={m.id} className={total >= m.km ? "on" : ""} title={m.name}>{m.emoji}</span>)}
      </div>
    </div>
  );
}
