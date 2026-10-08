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
import { elapsedAtFraction, mishapMessage } from "@/lib/flight";
import { useProfile } from "@/lib/settings";
import { arrivalText, passingText } from "@/lib/notifyText";
import { hasPushSub, schedulePush, usePushState } from "@/lib/push";
import { IS_TOSS, letterHref } from "@/lib/target";
import BirdIcon from "@/components/BirdIcon";

const STORE = "saepyeonji.notified.v1";
const RECENT_MS = 24 * 3600 * 1000;

type Popup = { key: string; id: string; birdId: string; title: string; sub: string };
type Rec = { a: number; p: number; m?: number };

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
  const { state: pushState } = usePushState();
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
      const route = getRoute(it.routeId);
      const pr = letterProgress({ id: it.id, birdId: it.birdId, routeId: it.routeId, sentAt: it.sentAt, arriveAt: it.arriveAt }, now);
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
          const t = arrivalText(it.kind, it.who, route, it.birdId);
          out.push({ key: `a-${it.id}`, id: it.id, birdId: it.birdId, title: t.title, sub: t.body });
        }
      }
      // 길을 잃거나 나무에 걸렸을 때(내가 보낸 편지만, 한 번만)
      if (pr.mishap && !r.m && (pr.stalled || (pr.p > pr.mishap.at && !pr.done))) {
        r.m = 1; changed = true;
        if (it.kind === "sent" && pr.stalled && profile.notify.passing) {
          const t = mishapMessage(pr.mishap.kind, getBird(it.birdId).name);
          out.push({ key: `m-${it.id}`, id: it.id, birdId: it.birdId, title: `${it.who}에게 가는 편지: ${t.title}`, sub: t.body });
        }
      }
      // 경유지 통과(내가 보낸 편지만, 도착 전에)
      if (!pr.done && pos.passedIdx > r.p) {
        const idx = pos.passedIdx;
        r.p = idx; changed = true;
        if (it.kind === "sent" && profile.notify.passing && idx > 0) {
          const t = passingText(it.who, route, it.birdId, idx);
          out.push({ key: `p-${it.id}-${idx}`, id: it.id, birdId: it.birdId, title: t.title, sub: t.body });
        }
      }
    }
    if (changed) save(rec);
    if (out.length) {
      const here = pathname;
      const fresh = out.filter((o) => letterHref(o.id) !== here && !here.startsWith(`/letter/${o.id}`));
      if (fresh.length) setQueue((q) => [...q, ...fresh.filter((f) => !q.some((x) => x.key === f.key))]);
      // 화면이 가려져 있으면(다른 탭) 브라우저 알림도 보내요(허용했을 때만)
      if (!IS_TOSS && !hasPushSub() && typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        for (const o of out) { try { new Notification(o.title, { body: o.sub, icon: "/icon-192.png", tag: o.key }); } catch {} }
      }
    }
  }, [now, letters, received, ready, profileReady, profile.notify, quiet, pathname]);

  // 푸시가 켜져 있으면, 아직 도착하지 않은 편지의 도착·경유지 알림을 서버에 예약해요(이미 예약한 건 건너뜀)
  useEffect(() => {
    if (pushState !== "enabled" || !ready || !profileReady) return;
    let off = false;
    (async () => {
      const items = [
        ...letters.map((l) => ({ id: l.id, kind: "sent" as const, who: l.to, routeId: l.routeId, birdId: l.birdId, sentAt: l.sentAt, arriveAt: l.arriveAt })),
        ...received.map((m) => ({ id: m.id, kind: "received" as const, who: m.fromName || "누군가", routeId: m.routeId, birdId: m.birdId, sentAt: m.sentAt, arriveAt: m.arriveAt })),
      ];
      for (const it of items) {
        if (off) return;
        const route = getRoute(it.routeId);
        const pr = letterProgress({ id: it.id, birdId: it.birdId, routeId: it.routeId, sentAt: it.sentAt, arriveAt: it.arriveAt }, Date.now());
        if (pr.done) continue;
        const arriveMs = it.arriveAt ?? it.sentAt + pr.total * 60000;
        const url = letterHref(it.id);
        if (it.kind === "sent" ? profile.notify.arrival : profile.notify.reply) {
          const t = arrivalText(it.kind, it.who, route, it.birdId);
          await schedulePush(`${it.id}:a`, { title: t.title, body: t.body, url, tag: `l-${it.id}-a` }, arriveMs);
        }
        if (it.kind === "sent" && profile.notify.passing) {
          const plan = pr.plan;
          if (plan.mishap && plan.stall) {
            const mt = it.sentAt + plan.stall.from;
            if (mt > Date.now()) {
              const t = mishapMessage(plan.mishap.kind, getBird(it.birdId).name);
              await schedulePush(`${it.id}:m`, { title: `${it.who}에게 가는 편지: ${t.title}`, body: t.body, url, tag: `l-${it.id}-m` }, mt);
            }
          }
          for (let i = 1; i < route.points.length - 1; i++) {
            const at = it.sentAt + elapsedAtFraction(plan, route.fractions[i]);
            if (at <= Date.now()) continue;
            const t = passingText(it.who, route, it.birdId, i);
            await schedulePush(`${it.id}:p${i}`, { title: t.title, body: t.body, url, tag: `l-${it.id}-p${i}` }, at);
          }
        }
      }
    })();
    return () => { off = true; };
  }, [pushState, letters, received, ready, profileReady, profile.notify]);

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
