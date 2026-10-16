"use client";
import { useRef, useState, type ReactNode } from "react";

export type SwipeAction = { label: string; tone?: "danger" | "plain"; onClick: () => void };

/**
 * 카카오톡 채팅 목록처럼: 옆으로 밀면(왼쪽·오른쪽 둘 다) 버튼이 나오고, 길게 누르면 메뉴가 열려요.
 * 민 상태에서 줄을 누르면 닫히기만 하고 대화방으로 넘어가지 않아요.
 */
export default function SwipeRow({ children, actions, onLongPress, label }: { children: ReactNode; actions: SwipeAction[]; onLongPress: () => void; label: string }) {
  const W = 96 * actions.length; // 버튼 칸 너비
  const [dx, setDx] = useState(0);
  const [drag, setDrag] = useState(false);
  const st = useRef<{ x: number; y: number; base: number; mode: "?" | "h" | "v"; moved: boolean; timer?: ReturnType<typeof setTimeout>; long: boolean } | null>(null);
  const block = useRef(false); // 밀었거나 길게 눌렀으면 이어지는 누르기(대화방 열기)를 막아요

  const end = (cancel = false) => {
    const s = st.current;
    if (!s) return;
    // 길게 누르는 중에 브라우저가 누르기를 취소(pointercancel)해도 길게 누르기는 이어가요
    if (cancel && !s.moved) return;
    st.current = null; setDrag(false);
    if (s.timer) clearTimeout(s.timer);
    if (s.mode === "h") setDx((d) => (d <= -W / 2 ? -W : d >= W / 2 ? W : 0));
  };
  return (
    <div className="swrow" onContextMenu={(e) => e.preventDefault()}>
      {dx !== 0 && (
        <div className={`swacts ${dx > 0 ? "left" : "right"}`} style={{ width: W }}>
          {actions.map((a) => (
            <button key={a.label} type="button" className={`swbtn ${a.tone ?? ""}`} onClick={() => { setDx(0); a.onClick(); }}>{a.label}</button>
          ))}
        </div>
      )}
      <div
        className="swbody"
        style={{ transform: `translateX(${dx}px)`, transition: drag ? "none" : "transform .2s ease" }}
        onPointerDown={(e) => {
          if (e.pointerType === "mouse" && e.button !== 0) return;
          block.current = false;
          const s = { x: e.clientX, y: e.clientY, base: dx, mode: "?" as const, moved: false, long: false, timer: undefined as ReturnType<typeof setTimeout> | undefined };
          s.timer = setTimeout(() => {
            if (st.current === s && !s.moved) { st.current = null; s.long = true; block.current = true; try { navigator.vibrate?.(15); } catch {} onLongPress(); }
          }, 550);
          st.current = s as NonNullable<typeof st.current>;
        }}
        onDragStart={(e) => e.preventDefault()}
        onPointerMove={(e) => {
          const s = st.current; if (!s) return;
          const mx = e.clientX - s.x, my = e.clientY - s.y;
          if (s.mode === "?" && Math.hypot(mx, my) > 8) {
            s.moved = true; if (s.timer) clearTimeout(s.timer);
            s.mode = Math.abs(mx) > Math.abs(my) ? "h" : "v";
            if (s.mode === "h") { setDrag(true); block.current = true; try { e.currentTarget.setPointerCapture(e.pointerId); } catch {} }
          }
          if (s.mode === "h") setDx(Math.max(-W - 24, Math.min(W + 24, s.base + mx)));
        }}
        onPointerUp={() => end()}
        onPointerCancel={() => end(true)}
        onClickCapture={(e) => {
          if (block.current || dx !== 0) { e.preventDefault(); e.stopPropagation(); block.current = false; setDx(0); }
        }}
        aria-label={label}
      >
        {children}
      </div>
    </div>
  );
}
