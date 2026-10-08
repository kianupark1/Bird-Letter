"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { getPlace, placesByRegion, PLACES, type Place } from "../../core/places";
import { matchRange, searchPlaces } from "../../core/placeSearch";

const label = (p: Place) => (p.name === p.landmark.name ? p.name : `${p.name} · ${p.landmark.name}`);

/** 글자가 맞은 부분을 진하게 */
function Hl({ text, q }: { text: string; q: string }) {
  const r = matchRange(text, q);
  if (!r) return <>{text}</>;
  return <>{text.slice(0, r[0])}<mark>{text.slice(r[0], r[1])}</mark>{text.slice(r[1])}</>;
}

/** 지역 고르기: 누르면 검색창이 열려요. "송"만 쳐도 송파구가 나오고, "ㅅㅍ" 같은 초성도 돼요. */
export default function PlaceField({ id, label: lab, value, onChange }: { id: string; label: string; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [cur, setCur] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const place = getPlace(value);

  const results = useMemo(() => searchPlaces(PLACES, q), [q]);
  const groups = useMemo(() => placesByRegion(), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = setTimeout(() => input.current?.focus(), 30);
    return () => { document.body.style.overflow = prev; clearTimeout(t); };
  }, [open]);
  useEffect(() => setCur(0), [q]);

  const close = () => { setOpen(false); setQ(""); opener.current?.focus(); };
  const pick = (p: Place) => { onChange(p.id); close(); };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") return close();
    if (!q.trim() || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setCur((c) => Math.min(results.length - 1, c + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCur((c) => Math.max(0, c - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); pick(results[cur]); }
  };

  const row = (p: Place, i = -1) => (
    <button key={p.id} type="button" role="option" aria-selected={p.id === value} data-place={p.id}
      className={`pf-opt${i === cur ? " cur" : ""}${p.id === value ? " sel" : ""}`} onClick={() => pick(p)} onMouseEnter={() => i >= 0 && setCur(i)}>
      <span className="pf-name"><Hl text={p.name} q={q} /></span>
      <span className="pf-lm"><Hl text={p.landmark.name} q={q} /><em>{p.region}</em></span>
    </button>
  );

  return (
    <div className="placefield">
      <span className="lab" id={`${id}-lab`}>{lab}</span>
      <button ref={opener} id={id} type="button" className="field pf-btn" aria-haspopup="dialog" aria-labelledby={`${id}-lab ${id}`} onClick={() => setOpen(true)}>
        <span>{place ? label(place) : "지역을 골라 주세요"}</span>
        <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden><circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" /><path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </button>

      {open && (
        <div className="pf-sheet" role="dialog" aria-modal="true" aria-label={`${lab} 고르기`} onKeyDown={onKey}>
          <div className="pf-top">
            <input ref={input} className="pf-input" type="search" inputMode="search" enterKeyHint="search" autoComplete="off" spellCheck={false}
              placeholder="동네·도시·랜드마크 (예: 송파, ㅅㅍ, 경복궁)" value={q} onChange={(e) => setQ(e.target.value)} aria-label="지역 검색" />
            <button type="button" className="pf-close" onClick={close}>닫기</button>
          </div>
          <div className="pf-list" role="listbox" aria-label="지역 목록">
            {q.trim() ? (
              results.length ? results.map((p, i) => row(p, i)) : <div className="pf-empty">찾는 곳이 없어요.<br />다른 글자로 검색해 보세요.</div>
            ) : (
              groups.map((g) => (
                <div key={g.region} className="pf-group">
                  <div className="pf-gh">{g.region}</div>
                  {g.places.map((p) => row(p))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
