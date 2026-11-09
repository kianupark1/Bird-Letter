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
import { arrivalText, incomingPassingText, passingText, soonText } from "@/lib/notifyText";
import { withIGa } from "@/lib/korean";
import { hasPushSub, initAppPush, schedulePush, syncSubToServer, usePushState } from "@/lib/push";
import { IS_TOSS, letterHref } from "@/lib/target";
import BirdIcon from "@/components/BirdIcon";
import { birdFx } from "@/lib/chirp";

const STORE = "saepyeonji.notified.v1";
const RECENT_MS = 24 * 3600 * 1000;

type Popup = { key: string; id: string; birdId: string; title: string; sub: string };
type Rec = { a: number; p: number; m?: number; s?: number };

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
    // 이 폰에서 처음 여는 거면(새 폰·앱 다시 설치) 이미 있던 편지는 조용히 기억만 해요(예전 편지 알림이 갑자기 뜨지 않게)
    if (!store.current) store.current = load();
    const rec = store.current;
    const firstRun = Object.keys(rec).length === 0;
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
        // 처음 보는 편지가 이미 도착해 있으면: 내가 보낸 편지는 조용히(다른 폰에서 보냈거나 이미 아는 소식),
        // 받은 편지는 그동안 새로 온 소식이라 알려 줘요(이 폰에서 처음 여는 날은 빼고)
        const silent = pr.done && (firstRun || it.kind === "sent");
        r = rec[it.id] = { a: silent ? 1 : 0, p: pos.passedIdx, ...(silent && pr.mishap ? { m: 1 } : {}) };
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
        if (pr.stalled && profile.notify.passing) {
          const t = mishapMessage(pr.mishap.kind, getBird(it.birdId).name);
          out.push({ key: `m-${it.id}`, id: it.id, birdId: it.birdId, title: it.kind === "sent" ? `${it.who}에게 가는 편지: ${t.title}` : `${withIGa(it.who)} 보낸 편지: ${t.title}`, sub: t.body });
        }
      }
      // 경유지 통과(보낸 편지·받는 편지 모두, 도착 전에 — 2026-11-09 받는 사람도 실시간으로)
      if (!pr.done && pos.passedIdx > r.p) {
        const idx = pos.passedIdx;
        r.p = idx; changed = true;
        if (profile.notify.passing && idx > 0) {
          const t = it.kind === "sent" ? passingText(it.who, route, it.birdId, idx) : incomingPassingText(it.who, route, it.birdId, idx, Math.ceil(pr.total - pr.elapsed));
          out.push({ key: `p-${it.id}-${idx}`, id: it.id, birdId: it.birdId, title: t.title, sub: t.body });
        }
      }
      // 받는 편지: 도착 30분 전 "곧 도착"(비행이 1시간 넘을 때, 한 번만)
      if (it.kind === "received" && !pr.done && !r.s && pr.total > 60 && pr.total - pr.elapsed <= 30) {
        r.s = 1; changed = true;
        if (profile.notify.passing) {
          const t = soonText(it.who, it.birdId, Math.max(1, Math.ceil(pr.total - pr.elapsed)));
          out.push({ key: `s-${it.id}`, id: it.id, birdId: it.birdId, title: t.title, sub: t.body });
        }
      }
    }
    if (changed) save(rec);
    if (out.length) {
      const here = pathname;
      const fresh = out.filter((o) => letterHref(o.id) !== here && !here.startsWith(`/letter/${o.id}`));
      if (fresh.length) birdFx("arrive", profile.chirp); // 도착하면 짹짹 + 진동
      if (fresh.length) setQueue((q) => [...q, ...fresh.filter((f) => !q.some((x) => x.key === f.key))]);
      // 화면이 가려져 있으면(다른 탭) 브라우저 알림도 보내요(허용했을 때만)
      if (!IS_TOSS && !hasPushSub() && typeof document !== "undefined" && document.hidden && typeof Notification !== "undefined" && Notification.permission === "granted") {
        for (const o of out) { try { new Notification(o.title, { body: o.sub, icon: "/icon-192.png", tag: o.key }); } catch {} }
      }
    }
  }, [now, letters, received, ready, profileReady, profile.notify, profile.chirp, quiet, pathname]);

  // 푸시가 켜져 있으면 내 알림 주소를 서버에 맡겨 둔다(친구가 나에게 보낸 편지의 도착 알림용)
  useEffect(() => { if (pushState === "enabled") syncSubToServer(); }, [pushState]);
  useEffect(() => { initAppPush(); }, []);

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
          await schedulePush(`${it.id}:a`, { title: t.title, body: t.body, url, tag: `l-${it.id}-${it.kind === "sent" ? "a" : "r"}` }, arriveMs);
        }
        if (profile.notify.passing) {
          const plan = pr.plan;
          const mine = it.kind === "sent";
          if (plan.mishap && plan.stall) {
            const mt = it.sentAt + plan.stall.from;
            if (mt > Date.now()) {
              const t = mishapMessage(plan.mishap.kind, getBird(it.birdId).name);
              await schedulePush(`${it.id}:m`, { title: mine ? `${it.who}에게 가는 편지: ${t.title}` : `${withIGa(it.who)} 보낸 편지: ${t.title}`, body: t.body, url, tag: `l-${it.id}-m` }, mt);
            }
          }
          for (let i = 1; i < route.points.length - 1; i++) {
            const at = it.sentAt + elapsedAtFraction(plan, route.fractions[i]);
            if (at <= Date.now()) continue;
            const t = mine ? passingText(it.who, route, it.birdId, i) : incomingPassingText(it.who, route, it.birdId, i, Math.ceil((arriveMs - at) / 60000));
            await schedulePush(`${it.id}:p${i}`, { title: t.title, body: t.body, url, tag: `l-${it.id}-p${i}` }, at);
          }
          // 받는 편지는 도착 30분 전에 "곧 도착"(비행이 1시간 넘을 때만) — 기다림의 마지막 설렘
          if (!mine && pr.total > 60) {
            const at = arriveMs - 30 * 60000;
            if (at > Date.now()) {
              const t = soonText(it.who, it.birdId, 30);
              await schedulePush(`${it.id}:s`, { title: t.title, body: t.body, url, tag: `l-${it.id}-s` }, at);
            }
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
