"use client";
/**
 * 앱이 열려 있는 동안 뜨는 귀여운 알림 팝업.
 * - 내가 보낸 편지가 도착했을 때(도착 알림) / 받는 편지가 도착했을 때(답장 알림) / 경유지를 지날 때(중간 지점 알림)
 * - 설정의 알림 스위치를 따라요.
 * - 앱을 닫은 뒤에 오는 알림(푸시)은 서버 연결이 필요해서 아직 없어요. 다시 열면 "그동안 도착한 편지"를 한 번 알려줘요.
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { getBird } from "@/lib/birds";
import { getRoute, routePosition } from "@/lib/routes";
import { letterProgress, useLetters, useNow } from "@/lib/letters";
import { useProfile } from "@/lib/settings";
import { withIGa } from "@/lib/korean";
import { IS_TOSS, letterHref } from "@/lib/target";
import BirdIcon from "@/components/BirdIcon";

const STORE = "saepyeonji.notified.v1";
const RECENT_MS = 24 * 3600 * 1000;

type Popup = { key: string; id: string; birdId: string; title: string; sub: string };
type Rec = { a: number; p: number };

function load(): Record<string, Rec> {
  try { return JSON.parse(localStorage.getItem(STORE) || "{}"); } catch { return {}; }
}
function save(v: Record<string, Rec>) {
  try { localStorage.setItem(STORE, JSON.stringify(v)); } catch {}
}

export default function Notifier() {
  const pathname = usePathname();
  const { letters, received, ready } = useLetters();
  const { profile, ready: profileReady } = useProfile();
  const now = useNow(5000);
  const store = useRef<Record<string, Rec> | null>(null);
  const [queue, setQueue] = useState<Popup[]>([]);
  const quiet = pathname.startsWith("/onboarding") || pathname.startsWith("/welcome");

  useEffect(() => {
    if (!ready || !profileReady || quiet) return;
    if (!store.current) store.current = load();
    const rec = store.current;
    const out: Popup[] = [];

    const items = [
      ...letters.map((l) => ({ id: l.id, kind: "sent" as const, who: l.to, routeId: l.routeId, birdId: l.birdId, sentAt: l.sentAt, arriveAt: l.arriveAt })),
      ...received.map((m) => ({ id: m.id, kind: "received" as const, who: m.fromName || "누군가", routeId: m.routeId, birdId: m.birdId, sentAt: m.sentAt, arriveAt: m.arriveAt })),
    ];
    let changed = false;
    for (const it of items) {
      const route = getRoute(it.routeId), bird = getBird(it.birdId);
      const pr = letterProgress({ birdId: it.birdId, routeId: it.routeId, sentAt: it.sentAt, arriveAt: it.arriveAt }, now);
      const pos = routePosition(route, pr.p);
      const arrivedAt = (it.arriveAt ?? it.sentAt + pr.total * 60000);
      let r = rec[it.id];
      if (!r) {
        r = rec[it.id] = { a: 0, p: pos.passedIdx };
        changed = true;
      }
      // 도착
      if (pr.done && !r.a) {
        r.a = 1; changed = true;
        const wantsIt = it.kind === "sent" ? profile.notify.arrival : profile.notify.reply;
        if (wantsIt && now - arrivedAt < RECENT_MS) {
          out.push(it.kind === "sent"
            ? { key: `a-${it.id}`, id: it.id, birdId: it.birdId, title: `${it.who}에게 보낸 편지가 도착했어요!`, sub: `${bird.name}가 ${route.to.name}에 내려앉았어요` }
            : { key: `a-${it.id}`, id: it.id, birdId: it.birdId, title: `${withIGa(it.who)} 보낸 편지가 도착했어요!`, sub: `${route.title} · ${bird.name}가 편지를 가져왔어요` });
        }
      }
      // 경유지 통과(내가 보낸 편지만, 도착 전에)
      if (!pr.done && pos.passedIdx > r.p) {
        const idx = pos.passedIdx;
        r.p = idx; changed = true;
        if (it.kind === "sent" && profile.notify.passing && idx > 0) {
          const pt = route.points[idx];
          out.push({ key: `p-${it.id}-${idx}`, id: it.id, birdId: it.birdId, title: `${it.who}에게 가는 편지가 ${pt.name} 근처예요`, sub: `${bird.name}가 ${pos.next ? `다음은 ${pos.next.name}` : "곧 도착"}${pos.next ? "(으)로 날아가요" : "해요"}` });
        }
      }
    }
    if (changed) save(rec);
    if (out.length) {
      const here = pathname;
      const fresh = out.filter((o) => letterHref(o.id) !== here && !here.startsWith(`/letter/${o.id}`));
      if (fresh.length) setQueue((q) => [...q, ...fresh.filter((f) => !q.some((x) => x.key === f.key))]);
      // 화면이 가려져 있으면(다른 탭) 브라우저 알림도 보내요(허용했을 때만)
      if (!IS_TOSS && typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        for (const o of out) { try { new Notification(o.title, { body: o.sub, icon: "/icon-192.png", tag: o.key }); } catch {} }
      }
    }
  }, [now, letters, received, ready, profileReady, profile.notify, quiet, pathname]);

  const cur = queue[0];
  // 한 팝업은 9초 뒤 저절로 사라져요
  useEffect(() => {
    if (!cur) return;
    const t = setTimeout(() => setQueue((q) => q.slice(1)), 9000);
    return () => clearTimeout(t);
  }, [cur]);

  if (!cur || quiet) return null;
  return (
    <div className="popwrap" role="status" aria-live="polite">
      <div className="popcard" key={cur.key}>
        <BirdIcon id={cur.birdId} size={76} letter className="popbird" />
        <div className="poptext">
          <div className="poptitle">{cur.title}</div>
          <div className="popsub">{cur.sub}</div>
          <div className="popbtns">
            <Link href={letterHref(cur.id)} className="popopen" onClick={() => setQueue((q) => q.slice(1))}>열어보기</Link>
            <button className="popclose" onClick={() => setQueue((q) => q.slice(1))}>닫기</button>
          </div>
        </div>
      </div>
    </div>
  );
}
