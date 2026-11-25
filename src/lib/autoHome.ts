"use client";
import { useCallback, useEffect, useState } from "react";
import { quickPosition } from "./fastGeo";
import { locate as findDistrict } from "../../core/districts";
import { decideAutoHome } from "../../core/autoHome";
import { getPlace } from "../../core/places";
import { tryMoveHome } from "./homePlace";
import type { Profile } from "./settings";

/**
 * 편지 쓰는 화면에서 내 동네를 위치로 저절로 정하거나, 바뀌었으면 물어봐요(core/autoHome.ts).
 * 처음(내 동네를 정한 적 없음)에만 위치 권한을 물어요. 그 뒤로는 이미 허락된 경우에만 조용히 확인해요.
 */
const KEY = "saepyeonji.autoHome.v1"; // { [동네 id]: "그대로" 누른 시각 }
const readDismissed = (): Record<string, number> => { try { return JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { return {}; } };

async function allowed(): Promise<boolean> {
  try {
    const p = await (navigator as Navigator & { permissions?: { query(d: { name: "geolocation" }): Promise<{ state: string }> } }).permissions?.query({ name: "geolocation" });
    return p?.state === "granted";
  } catch { return false; }
}

export function useAutoHome(profile: Pick<Profile, "homePlace" | "homeSet">, update: (p: Partial<Profile>) => void, on = true) {
  const [note, setNote] = useState("");
  const [suggest, setSuggest] = useState<{ id: string; label: string } | null>(null);
  useEffect(() => {
    if (!on || typeof navigator === "undefined" || !navigator.geolocation) return;
    let off = false;
    void (async () => {
      if (profile.homeSet && !(await allowed())) return; // 정한 뒤로는 허락된 경우에만 조용히
      let pos: { lat: number; lng: number };
      try { pos = await quickPosition(); } catch { return; }
      if (off) return;
      const here = findDistrict(pos.lat, pos.lng);
      const d = decideAutoHome({ homeSet: !!profile.homeSet, homePlace: profile.homePlace, here: here.place.id, dismissedAt: readDismissed()[here.place.id], now: Date.now() });
      if (d === "set") {
        tryMoveHome(profile.homePlace, here.place.id);
        update({ homePlace: here.place.id, homeLabel: here.label, homeSet: true });
        setNote(`📍 지금 위치(${here.label})에서 출발하도록 정했어요`);
      } else if (d === "suggest") setSuggest({ id: here.place.id, label: here.label });
    })();
    return () => { off = true; };
    // 내 정보(정해 둔 동네)를 다 읽은 뒤 화면마다 한 번만 확인해요
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [on]);
  const accept = useCallback(() => {
    if (!suggest) return;
    const r = tryMoveHome(profile.homePlace, suggest.id);
    if (!r.ok) { setNote(r.message); setSuggest(null); return; }
    update({ homePlace: suggest.id, homeLabel: suggest.label, homeSet: true });
    setNote(`📍 ${suggest.label}에서 출발하도록 바꿨어요`);
    setSuggest(null);
  }, [suggest, profile.homePlace, update]);
  const dismiss = useCallback(() => {
    if (!suggest) return;
    try { const all = readDismissed(); all[suggest.id] = Date.now(); localStorage.setItem(KEY, JSON.stringify(all)); } catch {}
    setSuggest(null);
  }, [suggest]);
  const fromName = getPlace(profile.homePlace)?.name ?? "";
  return { note, suggest, accept, dismiss, fromName };
}
