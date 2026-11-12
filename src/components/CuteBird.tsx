/**
 * 귀여운 새 3종(까치·비둘기·매) — 2026-11-01 대표님: "더 귀엽게" → "너무 뚱뚱해, 3안까지" → "1안으로, 지도에 나는 새와 앱 아이콘은 나는 모습(C)".
 *  A 날씬 동글: 둥근 머리 + 날씬한 물방울 몸, 서 있는 모습
 *  B 머리 큰 이모티콘: 큰 머리 + 작고 가는 몸, 긴 꼬리
 *  C 나는 모습: 날개를 위로 편 날씬한 옆모습(발은 접음)
 * 오른쪽을 보는 옆모습, viewBox 200x160(BirdIcon과 같음). 테두리는 --cb-rim(어두운 화면에서 밝게).
 */
import type { CSSProperties, JSX } from "react";

type Pal = { body: string; belly: string; wing: string; tail: string; beak: string; feet: string };
const PAL: Record<string, Pal> = {
  magpie: { body: "#2A2118", belly: "#FBF3E4", wing: "#1E3A5C", tail: "#1E3A5C", beak: "#E0A83C", feet: "#E0A83C" },
  pigeon: { body: "#9AA8B8", belly: "#C9D3DE", wing: "#B5C1CE", tail: "#6F8094", beak: "#3A2E26", feet: "#E8683F" },
  sparrow: { body: "#C9844E", belly: "#ECE4D6", wing: "#8E5A35", tail: "#7A4C2E", beak: "#3A2E26", feet: "#D9A07E" },
  hawk: { body: "#8A5A3C", belly: "#FBF3E4", wing: "#5B3A29", tail: "#5B3A29", beak: "#E0A83C", feet: "#E0A83C" },
};

const RIM: CSSProperties = { stroke: "var(--cb-rim, rgba(42,33,24,.2))", strokeWidth: 2.6, strokeLinejoin: "round" };
const f = (fill: string, rim = true): CSSProperties => ({ fill, ...(rim ? RIM : {}) });
const ln = (stroke: string, w: number, op = 1): CSSProperties => ({ stroke, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", opacity: op });

function Eye({ x, y, r, ring }: { x: number; y: number; r: number; ring?: boolean }) {
  return (
    <>
      {ring && <ellipse cx={x} cy={y} rx={r + 4} ry={r * 1.1 + 4} fill="#FBF3E4" />}
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.12} fill="#241a12" />
      <circle cx={x + r * 0.32} cy={y - r * 0.4} r={r * 0.38} fill="#fff" />
      <circle cx={x - r * 0.34} cy={y + r * 0.44} r={r * 0.17} fill="#fff" />
    </>
  );
}
const Blush = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => <ellipse cx={x} cy={y} rx={8 * s} ry={4.8 * s} fill="#F28B82" opacity=".55" />;

/** 매는 크림색 얼굴과 눈썹 */
function HeadMark({ id, hx, hy, r }: { id: string; hx: number; hy: number; r: number }) {
  // 참새: 흰 볼에 까만 점, 까만 턱
  if (id === "sparrow") return (
    <>
      <ellipse cx={hx + r * 0.05} cy={hy + r * 0.38} rx={r * 0.6} ry={r * 0.42} fill="#FBF6EC" />
      <circle cx={hx - r * 0.05} cy={hy + r * 0.42} r={r * 0.17} fill="#2A2118" />
      <path d={`M${hx + r * 0.55} ${hy + r * 0.72} Q${hx + r * 0.8} ${hy + r * 0.95} ${hx + r * 0.45} ${hy + r * 1.05}`} style={ln("#2A2118", r * 0.22)} />
    </>
  );
  if (id !== "hawk") return null;
  return (
    <>
      <path d={`M${hx - r * 0.1} ${hy - r * 0.2} Q${hx + r * 1.05} ${hy - r * 0.55} ${hx + r * 0.95} ${hy + r * 0.45} Q${hx + r * 0.4} ${hy + r * 1.05} ${hx - r * 0.2} ${hy + r * 0.7} Q${hx + r * 0.1} ${hy + r * 0.25} ${hx - r * 0.1} ${hy - r * 0.2} Z`} fill="#FBF3E4" />
      <path d={`M${hx - r * 0.05} ${hy - r * 0.42} Q${hx + r * 0.4} ${hy - r * 0.68} ${hx + r * 0.85} ${hy - r * 0.36}`} style={ln("#5B3A29", r * 0.2)} />
    </>
  );
}
function Beak({ id, x, y, s }: { id: string; x: number; y: number; s: number }) {
  const p = PAL[id];
  if (id === "hawk") return <path d={`M${x} ${y - 6 * s} Q${x + 16 * s} ${y - 6 * s} ${x + 16 * s} ${y + 7 * s} Q${x + 10 * s} ${y + 3 * s} ${x} ${y + 5 * s} Z`} style={f(p.beak)} />;
  return (
    <>
      <path d={`M${x} ${y - 5 * s} L${x + 15 * s} ${y} L${x} ${y + 5 * s} Z`} style={f(p.beak)} />
      {id === "pigeon" && <ellipse cx={x + 1} cy={y - 5 * s} rx={3.6 * s} ry={2.6 * s} fill="#FBF3E4" />}
    </>
  );
}

/** 부리에 문 편지(항공우편 봉투 + 하트 도장) */
function Envelope({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(12) scale(${s})`}>
      <rect x="0" y="-9" width="26" height="18" rx="2.5" fill="#FFF9EC" style={RIM} />
      <rect x="1.8" y="-7.2" width="22.4" height="14.4" rx="1.5" fill="none" stroke="#C1481F" strokeWidth="1.6" strokeDasharray="3.5 3" />
      <path d="M2 -7 L13 1.5 L24 -7" fill="none" stroke="#C1481F" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M13 6.4 C9.6 3.8 11.2 1.2 13 2.8 C14.8 1.2 16.4 3.8 13 6.4 Z" fill="#C1481F" />
    </g>
  );
}

/* ───── A 날씬 동글 ───── */
function A({ id, letter }: { id: string; letter?: boolean; flap?: boolean }) {
  const p = PAL[id];
  const long = id === "magpie";
  return (
    <>
      <path d={long ? "M70 112 L10 132 L16 142 L76 120 Z" : "M70 112 L28 128 L34 138 L76 120 Z"} style={f(p.tail)} />
      <path d="M100 124 v20 M93 145 h13 M116 122 v22 M109 145 h13" style={ln(p.feet, 4)} />
      <path d="M62 112 Q72 82 112 76 Q148 74 150 100 Q148 128 110 132 Q78 134 62 112 Z" style={f(p.body)} />
      <path d="M96 128 Q126 132 144 108 Q140 96 126 96 Q104 104 96 128 Z" fill={p.belly} />
      {id === "pigeon" && <path d="M120 84 Q138 92 150 84 Q150 96 134 100 Q122 98 120 84 Z" fill="#3EA890" />}
      <path d="M74 104 Q92 82 122 90 Q108 118 78 116 Z" style={f(p.wing)} />
      {id === "magpie" && <path d="M86 102 Q98 96 110 100" style={ln("#FBF3E4", 4.5)} />}
      {id === "pigeon" && <path d="M86 102 Q98 98 108 102 M90 109 Q100 106 110 109" style={ln("#6F8094", 3)} />}
      {id === "hawk" && <path d="M110 112 l3 3 l3 -3 M122 114 l3 3 l3 -3" style={ln("#B58257", 2.4)} />}
      <circle cx="140" cy="60" r="26" style={f(p.body)} />
      <HeadMark id={id} hx={140} hy={60} r={26} />
      <path d="M122 46 Q134 36 150 40" style={ln("#fff", 3.4, 0.3)} />
      <Eye x={147} y={58} r={8.5} ring={id === "magpie"} />
      <Blush x={151} y={74} />
      {letter && <Envelope x={168} y={66} s={0.95} />}
      <Beak id={id} x={164} y={62} s={1} />
    </>
  );
}

/* ───── B 머리 큰 이모티콘 ───── */
function B({ id, letter }: { id: string; letter?: boolean; flap?: boolean }) {
  const p = PAL[id];
  const long = id === "magpie";
  return (
    <>
      <path d={long ? "M66 112 Q30 122 6 142 Q34 140 72 122 Z" : "M66 112 Q42 122 26 138 Q48 136 72 122 Z"} style={f(p.tail)} />
      <path d="M92 128 v18 M86 147 h12 M106 128 v18 M100 147 h12" style={ln(p.feet, 4)} />
      <ellipse cx="96" cy="112" rx="34" ry="21" style={f(p.body)} />
      <path d="M80 124 Q100 136 122 120 Q118 106 104 108 Q88 112 80 124 Z" fill={p.belly} />
      <path d="M68 108 Q84 96 104 104 Q94 122 72 118 Z" style={f(p.wing)} />
      {id === "magpie" && <path d="M78 110 Q88 106 98 110" style={ln("#FBF3E4", 4)} />}
      {id === "pigeon" && <path d="M78 110 Q88 107 97 110" style={ln("#6F8094", 2.8)} />}
      <circle cx="126" cy="64" r="36" style={f(p.body)} />
      {id === "pigeon" && <path d="M100 86 Q126 104 152 86 Q150 100 126 104 Q104 100 100 86 Z" fill="#3EA890" />}
      {id === "magpie" && <path d="M108 92 Q128 104 152 88 Q146 100 128 102 Q112 100 108 92 Z" fill="#FBF3E4" />}
      <HeadMark id={id} hx={126} hy={64} r={36} />
      <path d="M102 44 Q118 30 140 34" style={ln("#fff", 4, 0.3)} />
      <Eye x={138} y={60} r={11} ring={id === "magpie"} />
      <Blush x={142} y={80} s={1.2} />
      {letter && <Envelope x={164} y={72} />}
      <Beak id={id} x={160} y={66} s={1.1} />
    </>
  );
}

/* ───── C 나는 모습 ───── */
function C({ id, letter, flap }: { id: string; letter?: boolean; flap?: boolean }) {
  // 날개 퍼덕임(지도 위 새): 어깨(96,90)를 중심으로 위아래
  const beat = (far: boolean) => flap ? <animateTransform attributeName="transform" type="rotate" values={far ? "-14 104 88; 20 104 88; -14 104 88" : "-22 96 90; 28 96 90; -22 96 90"} dur="0.55s" repeatCount="indefinite" /> : null;
  const p = PAL[id];
  const long = id === "magpie";
  return (
    <>
      <g>{beat(true)}<path d="M96 86 Q90 40 118 22 Q124 56 112 88 Z" style={{ ...f(p.wing), opacity: 0.55 }} /></g>
      <path d={long ? "M58 96 L8 110 L12 122 L62 104 Z" : "M58 96 L22 106 L26 118 L62 104 Z"} style={f(p.tail)} />
      <path d="M54 98 Q74 76 120 76 Q158 78 160 96 Q150 112 110 112 Q72 112 54 98 Z" style={f(p.body)} />
      <path d="M92 110 Q130 116 154 100 Q146 94 128 96 Q104 100 92 110 Z" fill={p.belly} />
      {id === "pigeon" && <path d="M136 80 Q150 86 158 82 Q160 94 146 96 Q136 92 136 80 Z" fill="#3EA890" />}
      {id === "hawk" && <path d="M110 104 l3 3 l3 -3 M122 106 l3 3 l3 -3" style={ln("#B58257", 2.4)} />}
      <g>
        {beat(false)}
        <path d="M84 90 Q66 40 92 12 Q112 50 108 90 Z" style={f(p.wing)} />
        {id === "magpie" && <path d="M86 70 Q90 50 96 38" style={ln("#FBF3E4", 5)} />}
        {id === "pigeon" && <path d="M86 62 Q92 56 98 60 M88 74 Q94 68 102 72" style={ln("#6F8094", 3)} />}
        {id === "hawk" && <path d="M84 50 l6 2 M86 62 l7 2 M88 74 l7 2" style={ln("#E0A83C", 2.4, 0.8)} />}
      </g>
      <circle cx="152" cy="72" r="22" style={f(p.body)} />
      <HeadMark id={id} hx={152} hy={72} r={22} />
      <path d="M138 58 Q148 50 162 54" style={ln("#fff", 3, 0.3)} />
      <Eye x={158} y={70} r={7.5} ring={id === "magpie"} />
      <Blush x={162} y={84} s={0.9} />
      {letter && <Envelope x={175} y={78} s={0.8} />}
      <Beak id={id} x={172} y={74} s={0.9} />
    </>
  );
}

type ArtProps = { id: string; letter?: boolean; flap?: boolean };
const V: Record<string, (p: ArtProps) => JSX.Element> = { A, B, C };
export const CUTE_BIRDS = Object.keys(PAL);
export const isCute = (id: string) => id in PAL;

/** svg 안에 바로 넣는 그림(viewBox 200x160 좌표). A = 앱 전체 새(2026-11-01 대표님 확정 1안), C = 지도 위 나는 새·앱 아이콘 */
export function CuteArt({ id, variant = "A", letter, flap }: ArtProps & { variant?: "A" | "B" | "C" }) {
  const Art = V[variant] ?? A;
  return <Art id={PAL[id] ? id : "pigeon"} letter={letter} flap={flap} />;
}

export default function CuteBird({ id, variant = "A", size = 64, className, letter }: { id: string; variant?: "A" | "B" | "C"; size?: number; className?: string; letter?: boolean }) {
  return (
    <svg viewBox="0 0 200 160" width={size} height={(size * 160) / 200} className={className} aria-hidden>
      <CuteArt id={id} variant={variant} letter={letter} />
    </svg>
  );
}
