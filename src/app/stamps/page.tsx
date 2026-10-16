"use client";
import Link from "next/link";
import { useMemo } from "react";
import { getRoute } from "@/lib/routes";
import { letterProgress, useLetters, useNow } from "@/lib/letters";
import { useSession } from "@/lib/session";
import LoginStart from "@/components/LoginStart";
import BirdIcon from "@/components/BirdIcon";
import { allStamps, badgesFor, kindLabel, stampsFromPasses } from "../../../core/stamps";
import { STORY_ITEMS, collectItems } from "../../../core/stories";

/** 스탬프 도감: 편지가 지나간 명소와 날아가며 주운 물건을 모아요(시안 v4-4) */
export default function StampsPage() {
  const { state, recheck } = useSession();
  if (state === "checking") return <main className="app" aria-busy="true" />;
  if (state === "login") return <LoginStart onDone={recheck} next="/stamps" />;
  return <Stamps />;
}

function Stamps() {
  const { letters, received, ready } = useLetters();
  const now = useNow(30000);

  const { got, items, total, groups, badges } = useMemo(() => {
    // 내가 보낸 편지와 받은 편지 모두, 지금까지 날아온 만큼 스탬프가 찍혀요
    const sent = letters.filter((l) => l.sentAt <= now).map((l) => ({ id: l.id, routeId: l.routeId, p: letterProgress(l, now).p }));
    const recv = received.filter((m) => m.sentAt <= now).map((m) => ({ id: m.id, routeId: m.routeId, p: letterProgress({ id: m.id, birdId: m.birdId, routeId: m.routeId, sentAt: m.sentAt, arriveAt: m.arriveAt }, now).p }));
    const passes = [...sent, ...recv];
    const got = stampsFromPasses(passes);
    const items = collectItems(passes.map((x) => ({ id: x.id, km: getRoute(x.routeId).km, p: x.p })));
    const all = allStamps();
    const groups = [...new Set(all.map((s) => s.group))].map((g) => ({ name: g, list: all.filter((s) => s.group === g) }));
    return { got, items, total: all.length, groups, badges: badgesFor(got) };
  }, [letters, received, now]);

  const pct = Math.min(100, Math.round((got.size / total) * 100));
  return (
    <main className="app rankpage">
      <header className="sendhead">
        <Link href="/settings" className="roomback" aria-label="뒤로">‹</Link>
        <div><h1>스탬프 도감 🏮</h1><div className="greet">편지가 지나간 곳 {got.size} / {total}</div></div>
      </header>
      <div className="mtrack" style={{ margin: "6px 4px 18px" }}><i style={{ width: `${pct}%` }} /><span className="mb" style={{ left: `${pct}%` }}><BirdIcon id="magpie" size={40} /></span></div>

      {ready && got.size === 0 && <div className="bubble">짹짹! 편지를 보내면 지나간 명소에 스탬프가 찍혀요</div>}

      <h2>배지</h2>
      <div className="badges">
        {badges.map((b) => <span key={b.id} className={`badge ${b.got ? "got" : ""}`} title={b.need}>{b.got ? b.emoji : "🔒"} {b.label}<small style={{ fontWeight: 400 }}>{b.got ? "" : ` · ${b.need}`}</small></span>)}
      </div>

      <h2>날아가며 주운 물건</h2>
      <div className="items">
        {STORY_ITEMS.map((it) => {
          const n = items.get(it.id) ?? 0;
          return <span key={it.id} className={`item ${n ? "" : "none"}`}>{n ? it.emoji : "❔"} {n ? `${it.name} ×${n}` : "???"}</span>;
        })}
      </div>

      {groups.map((g) => (
        <section key={g.name}>
          <h2>{g.name} <small style={{ fontWeight: 400, opacity: .6 }}>{g.list.filter((s) => got.has(s.name)).length}/{g.list.length}</small></h2>
          <ul className="stamps">
            {g.list.map((s) => {
              const has = got.has(s.name);
              return <li key={s.name} className={`stp ${has ? "got" : ""}`} aria-label={has ? `${s.name} 스탬프 모음` : "아직 안 가 본 곳"}><span><i>{has ? "🏮" : "?"}</i>{has ? s.name : kindLabel(s.kind)}</span></li>;
            })}
          </ul>
        </section>
      ))}
    </main>
  );
}
