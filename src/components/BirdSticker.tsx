/**
 * 새티콘(새 이모티콘): 동글동글한 까치가 감정을 표현해요. 카카오톡 이모티콘처럼 그림 + 짧은 말.
 * 정면을 보는 둥근 몸 하나로 16가지 표정·몸짓을 그려서 모두 같은 캐릭터로 보이게 했어요. viewBox 120x132.
 * 색은 고정(이모티콘은 라이트·다크 모드에서 같은 모습이 좋아서), 글씨는 흰 테두리를 둘러 어느 배경에서도 보여요.
 */
import type { CSSProperties, ReactNode } from "react";

export type StickerId =
  | "joy" | "love" | "thanks" | "sad" | "angry" | "sorry" | "cheer" | "miss"
  | "congrats" | "night" | "hungry" | "wow" | "ok" | "shy" | "hug" | "wait";

export const STICKERS: { id: StickerId; label: string }[] = [
  { id: "joy", label: "좋아!" }, { id: "love", label: "사랑해" }, { id: "thanks", label: "고마워" }, { id: "miss", label: "보고 싶어" },
  { id: "wait", label: "기다릴게" }, { id: "cheer", label: "힘내!" }, { id: "congrats", label: "축하해" }, { id: "hug", label: "안아 줘" },
  { id: "sad", label: "슬퍼" }, { id: "sorry", label: "미안해" }, { id: "angry", label: "흥!" }, { id: "shy", label: "부끄" },
  { id: "wow", label: "헉!" }, { id: "ok", label: "알겠어" }, { id: "hungry", label: "배고파" }, { id: "night", label: "잘 자" },
];
export const stickerLabel = (id: string) => STICKERS.find((s) => s.id === id)?.label ?? "";
export const isSticker = (id: string): id is StickerId => STICKERS.some((s) => s.id === id);

const NAVY = "#1E3A5C", NAVY2 = "#152B45", CREAM = "#FBF3E4", GOLD = "#E0A83C", RED = "#C1481F", PINK = "#F29B8E", INK = "#241a12", TEAL = "#1B6E5C", SKY = "#7FB8D8";
const line = (color: string, w: number): CSSProperties => ({ stroke: color, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" });

type Eyes = "dot" | "happy" | "closed" | "heart" | "tear" | "angry" | "worry" | "star" | "big" | "wink" | "down";

function EyePair({ kind }: { kind: Eyes }) {
  const L = 46, R = 74, Y = 56;
  const both = (f: (x: number, side: -1 | 1) => ReactNode) => <>{f(L, -1)}{f(R, 1)}</>;
  switch (kind) {
    case "happy": return both((x) => <path d={`M${x - 6} ${Y + 2} Q${x} ${Y - 6} ${x + 6} ${Y + 2}`} style={line(INK, 3.4)} />);
    case "closed": return both((x) => <path d={`M${x - 6} ${Y} Q${x} ${Y + 5} ${x + 6} ${Y}`} style={line(INK, 3.2)} />);
    case "down": return both((x) => <path d={`M${x - 6} ${Y + 1} Q${x} ${Y + 4} ${x + 6} ${Y + 1}`} style={line(INK, 3)} />);
    case "heart": return both((x) => <path d={`M${x} ${Y + 6} C${x - 10} ${Y - 1} ${x - 5} ${Y - 9} ${x} ${Y - 3} C${x + 5} ${Y - 9} ${x + 10} ${Y - 1} ${x} ${Y + 6}Z`} style={{ fill: RED }} />);
    case "star": return both((x) => <><circle cx={x} cy={Y} r={6.2} style={{ fill: INK }} /><path d={`M${x + 1} ${Y - 4} l1.2 2.6 2.8.3 -2.1 1.9.6 2.8 -2.5 -1.4 -2.5 1.4.6 -2.8 -2.1 -1.9 2.8 -.3z`} style={{ fill: "#fff" }} /></>);
    case "big": return both((x) => <><circle cx={x} cy={Y} r={7.5} style={{ fill: "#fff", stroke: INK, strokeWidth: 2 }} /><circle cx={x} cy={Y + 1} r={3.2} style={{ fill: INK }} /></>);
    case "angry": return both((x, sd) => <><circle cx={x} cy={Y + 1} r={3.6} style={{ fill: INK }} /><path d={`M${x - 7 * sd} ${Y - 4} L${x + 6 * sd} ${Y - 10}`} style={line(INK, 3.4)} /></>);
    case "worry": return both((x, sd) => <><circle cx={x} cy={Y + 1} r={4} style={{ fill: INK }} /><circle cx={x + 1.2} cy={Y - .4} r={1.3} style={{ fill: "#fff" }} /><path d={`M${x - 6 * sd} ${Y - 11} L${x + 6 * sd} ${Y - 6}`} style={line(INK, 2.8)} /></>);
    case "tear": return both((x) => <><path d={`M${x - 6} ${Y - 1} Q${x} ${Y + 4} ${x + 6} ${Y - 1}`} style={line(INK, 3)} /><path d={`M${x} ${Y + 4} q-3.5 6 0 9 q3.5 -3 0 -9z`} style={{ fill: SKY }} /></>);
    case "wink": return <><path d={`M${L - 6} ${Y + 2} Q${L} ${Y - 6} ${L + 6} ${Y + 2}`} style={line(INK, 3.4)} /><circle cx={R} cy={Y} r={4.6} style={{ fill: INK }} /><circle cx={R + 1.5} cy={Y - 1.5} r={1.5} style={{ fill: "#fff" }} /></>;
    default: return both((x) => <><circle cx={x} cy={Y} r={4.6} style={{ fill: INK }} /><circle cx={x + 1.5} cy={Y - 1.5} r={1.5} style={{ fill: "#fff" }} /></>);
  }
}

type Beak = "closed" | "open" | "small" | "drool" | "pout";
function BeakShape({ kind }: { kind: Beak }) {
  if (kind === "open") return <><path d="M53 64 L67 64 L60 71Z" style={{ fill: GOLD }} /><path d="M54 70 Q60 80 66 70Z" style={{ fill: RED }} /></>;
  if (kind === "small") return <path d="M56 64 L64 64 L60 68Z" style={{ fill: GOLD }} />;
  if (kind === "pout") return <path d="M55 66 L65 66 L60 62Z" style={{ fill: GOLD }} />;
  if (kind === "drool") return <><path d="M53 64 L67 64 L60 72Z" style={{ fill: GOLD }} /><path d="M66 70 q2 6 0 9 q-2 -3 0 -9z" style={{ fill: SKY }} /></>;
  return <path d="M53 64 L67 64 L60 72Z" style={{ fill: GOLD }} />;
}

type Wings = "rest" | "up" | "wide" | "face" | "hold" | "fist" | "wave";
function WingPair({ kind }: { kind: Wings }) {
  const w = (d: string, key: string) => <path key={key} d={d} style={{ fill: NAVY2 }} />;
  switch (kind) {
    case "up": return <>{w("M26 66 Q8 44 16 30 Q30 46 32 64Z", "l")}{w("M94 66 Q112 44 104 30 Q90 46 88 64Z", "r")}</>;
    case "wide": return <>{w("M26 70 Q2 62 4 50 Q22 54 30 64Z", "l")}{w("M94 70 Q118 62 116 50 Q98 54 90 64Z", "r")}</>;
    case "face": return <>{w("M28 78 Q30 54 44 50 Q46 66 40 80Z", "l")}{w("M92 78 Q90 54 76 50 Q74 66 80 80Z", "r")}</>;
    case "hold": return <>{w("M26 72 Q34 92 52 92 Q42 80 32 66Z", "l")}{w("M94 72 Q86 92 68 92 Q78 80 88 66Z", "r")}</>;
    case "fist": return <>{w("M26 72 Q18 80 22 92 Q32 84 32 70Z", "l")}{w("M94 66 Q110 46 102 34 Q90 48 88 64Z", "r")}<circle cx="103" cy="33" r="6" style={{ fill: NAVY2 }} /></>;
    case "wave": return <>{w("M26 72 Q18 80 22 92 Q32 84 32 70Z", "l")}{w("M94 66 Q114 54 112 40 Q96 50 88 64Z", "r")}</>;
    default: return <>{w("M26 72 Q18 80 22 92 Q32 84 32 70Z", "l")}{w("M94 72 Q102 80 98 92 Q88 84 88 70Z", "r")}</>;
  }
}

type Look = { eyes: Eyes; beak: Beak; wings: Wings; blush?: boolean; tilt?: number; extra?: ReactNode; behind?: ReactNode };

const heart = (x: number, y: number, s: number, color = RED) => <path d={`M${x} ${y + 6 * s} C${x - 10 * s} ${y - 1 * s} ${x - 5 * s} ${y - 9 * s} ${x} ${y - 3 * s} C${x + 5 * s} ${y - 9 * s} ${x + 10 * s} ${y - 1 * s} ${x} ${y + 6 * s}Z`} style={{ fill: color }} />;
const spark = (x: number, y: number, s = 1, color = GOLD) => <path d={`M${x} ${y - 6 * s} L${x + 1.6 * s} ${y - 1.6 * s} L${x + 6 * s} ${y} L${x + 1.6 * s} ${y + 1.6 * s} L${x} ${y + 6 * s} L${x - 1.6 * s} ${y + 1.6 * s} L${x - 6 * s} ${y} L${x - 1.6 * s} ${y - 1.6 * s}Z`} style={{ fill: color }} />;
const envelope = (x: number, y: number) => <g><rect x={x} y={y} width="28" height="19" rx="3" style={{ fill: "#fff", stroke: RED, strokeWidth: 2 }} /><path d={`M${x + 1} ${y + 2} L${x + 14} ${y + 11} L${x + 27} ${y + 2}`} style={line(RED, 2)} />{heart(x + 14, y + 12, 0.45)}</g>;

// 처음 그릴 때 한 번만 만들어요
let LOOKS_CACHE: Record<StickerId, Look> | null = null;
const looks = (): Record<StickerId, Look> => (LOOKS_CACHE ??= {
  joy: { eyes: "happy", beak: "open", wings: "up", blush: true, extra: <>{spark(14, 22)}{spark(106, 18, .8)}</> },
  love: { eyes: "heart", beak: "small", wings: "rest", blush: true, extra: <>{heart(100, 22, .9)}{heart(18, 30, .6, PINK)}</> },
  thanks: { eyes: "closed", beak: "small", wings: "hold", blush: true, tilt: 12, extra: <g><circle cx="60" cy="96" r="7" style={{ fill: PINK }} /><circle cx="60" cy="96" r="3" style={{ fill: GOLD }} /><path d="M60 103 L60 112" style={line(TEAL, 2.4)} /></g> },
  miss: { eyes: "star", beak: "small", wings: "hold", blush: true, extra: <>{envelope(46, 84)}{spark(102, 24, .7, SKY)}</> },
  wait: { eyes: "dot", beak: "small", wings: "hold", extra: <g><path d="M50 84 h20 l-7 9 7 9 h-20 l7 -9z" style={{ fill: "#fff", stroke: NAVY2, strokeWidth: 2 }} /><path d="M54 87 h12 l-6 6z" style={{ fill: GOLD }} /><path d="M56 100 h8 l-4 -3z" style={{ fill: GOLD }} /><text x="98" y="30" style={{ font: "700 14px sans-serif", fill: GOLD }}>…</text></g> },
  cheer: { eyes: "angry", beak: "open", wings: "fist", extra: <g><path d="M30 30 Q60 18 90 30" style={line(RED, 6)} /><path d="M88 30 l10 -4 M88 30 l9 6" style={line(RED, 4)} /></g> },
  congrats: { eyes: "happy", beak: "open", wings: "up", blush: true, behind: <g><path d="M48 22 L60 -2 L72 22Z" style={{ fill: GOLD }} /><circle cx="60" cy="-2" r="4" style={{ fill: RED }} /><path d="M52 14 h16" style={line(RED, 3)} /></g>, extra: <>{spark(12, 40, .9, RED)}{spark(108, 40, .9, TEAL)}<circle cx="20" cy="18" r="3" style={{ fill: SKY }} /><circle cx="100" cy="14" r="3" style={{ fill: PINK }} /></> },
  hug: { eyes: "happy", beak: "small", wings: "wide", blush: true, extra: <>{heart(60, 18, .7, PINK)}</> },
  sad: { eyes: "tear", beak: "pout", wings: "rest", extra: <path d="M88 20 q4 -8 10 -2 q6 -6 9 3 q-9 5 -19 -1z" style={{ fill: "#9AA8B8" }} /> },
  sorry: { eyes: "worry", beak: "small", wings: "hold", tilt: -8, extra: <path d="M92 34 q-5 8 0 11 q5 -3 0 -11z" style={{ fill: SKY }} /> },
  angry: { eyes: "angry", beak: "pout", wings: "rest", extra: <g><path d="M96 22 l6 -6 m-6 0 l6 6 m-3 -8 v10 m-5 -5 h10" style={line(RED, 3)} /><path d="M18 40 q-4 -8 2 -12 M26 36 q-4 -8 2 -12" style={line("#9AA8B8", 2.6)} /></g> },
  shy: { eyes: "down", beak: "small", wings: "face", blush: true, extra: <>{heart(100, 30, .5, PINK)}<path d="M40 46 l-2 -3 M80 46 l2 -3" style={line(PINK, 2)} /></> },
  wow: { eyes: "big", beak: "open", wings: "wide", extra: <g><path d="M60 -4 v14" style={line(RED, 5)} /><circle cx="60" cy="16" r="2.8" style={{ fill: RED }} /><path d="M40 20 l-4 -8 M80 20 l4 -8" style={line(NAVY2, 3)} /></g> },
  ok: { eyes: "wink", beak: "small", wings: "wave", blush: true, extra: <g><circle cx="110" cy="36" r="7" style={{ fill: "none", stroke: TEAL, strokeWidth: 3.4 }} /></g> },
  hungry: { eyes: "dot", beak: "drool", wings: "rest", extra: <g><path d="M90 92 q4 -6 10 -2 q6 -4 9 3 q-1 7 -10 6 q-8 1 -9 -7z" style={{ fill: "#D9A55B" }} /><path d="M95 92 l3 3 M101 91 l2 3" style={line("#8A5A2B", 1.6)} /></g> },
  night: { eyes: "closed", beak: "small", wings: "rest", behind: <g><path d="M38 34 Q58 6 84 22 L92 10" style={{ fill: SKY }} /><circle cx="93" cy="9" r="5" style={{ fill: "#fff" }} /></g>, extra: <text x="92" y="44" style={{ font: "800 15px sans-serif", fill: NAVY2 }}>z<tspan dy="-7" fontSize="11">z</tspan></text> },
});

/** 새티콘 한 장. label을 끄면 그림만(말풍선 안에 작게 넣을 때) */
export default function BirdSticker({ id, size = 96, label = true, className }: { id: StickerId; size?: number; label?: boolean; className?: string }) {
  const all = looks();
  const L = all[id] ?? all.joy;
  const text = stickerLabel(id);
  return (
    <svg viewBox="0 -8 120 146" width={size} height={size * (146 / 120)} className={className} role="img" aria-label={`새티콘: ${text}`}>
      <g transform={L.tilt ? `rotate(${L.tilt} 60 70)` : undefined}>
        {L.behind}
        {/* 꼬리·머리 깃 */}
        <path d="M52 24 Q54 10 62 14 Q64 6 72 12 Q66 20 64 28Z" style={{ fill: NAVY2 }} />
        <WingPair kind={L.wings} />
        {/* 둥근 몸과 하얀 배 */}
        <ellipse cx="60" cy="66" rx="36" ry="38" style={{ fill: NAVY }} />
        <ellipse cx="60" cy="82" rx="24" ry="20" style={{ fill: CREAM }} />
        <ellipse cx="48" cy="40" rx="10" ry="6" style={{ fill: "rgba(255,255,255,.18)" }} transform="rotate(-25 48 40)" />
        {L.blush && <><ellipse cx="38" cy="68" rx="6" ry="4" style={{ fill: PINK, opacity: .85 }} /><ellipse cx="82" cy="68" rx="6" ry="4" style={{ fill: PINK, opacity: .85 }} /></>}
        <EyePair kind={L.eyes} />
        <BeakShape kind={L.beak} />
        {/* 발 */}
        <path d="M50 103 v6 m-4 0 h8 M70 103 v6 m-4 0 h8" style={line(GOLD, 3)} />
        {L.extra}
      </g>
      {label && (
        <text x="60" y="131" textAnchor="middle" style={{ font: "800 19px Pretendard, 'Apple SD Gothic Neo', sans-serif", fill: INK, stroke: "#fff", strokeWidth: 5, paintOrder: "stroke", strokeLinejoin: "round" }}>{text}</text>
      )}
    </svg>
  );
}
