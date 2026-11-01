/**
 * 더 귀여운 새 3종(까치·비둘기·매) — 2026-11-01 대표님: "전체적으로 새 디자인을 더 귀엽게".
 * 동글동글한 한 덩어리 몸, 큰 눈(반짝이 두 개), 볼터치, 작은 부리, 짧은 발. 오른쪽을 보는 옆모습, viewBox 200x160(BirdIcon과 같음).
 * 색은 고정값(어두운 화면에서도 새 색이 바뀌지 않게), 테두리는 --cb-rim(어두운 화면에서 밝은 테두리로 배경과 구분).
 */
import type { CSSProperties, JSX } from "react";

const RIM: CSSProperties = { stroke: "var(--cb-rim, rgba(42,33,24,.18))", strokeWidth: 3, strokeLinejoin: "round" };
const f = (fill: string, rim = false): CSSProperties => ({ fill, ...(rim ? RIM : {}) });
const line = (stroke: string, w: number, op = 1): CSSProperties => ({ stroke, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none", opacity: op });

/** 큰 눈: 눈동자 + 큰 반짝이 + 작은 반짝이 */
function Eye({ x, y, r = 11, ring }: { x: number; y: number; r?: number; ring?: string }) {
  return (
    <>
      {ring && <ellipse cx={x} cy={y} rx={r + 5} ry={r * 1.12 + 5} fill={ring} />}
      <ellipse cx={x} cy={y} rx={r} ry={r * 1.12} fill="#241a12" />
      <circle cx={x + r * 0.32} cy={y - r * 0.4} r={r * 0.36} fill="#fff" />
      <circle cx={x - r * 0.36} cy={y + r * 0.42} r={r * 0.16} fill="#fff" />
    </>
  );
}
const Blush = ({ x, y }: { x: number; y: number }) => <ellipse cx={x} cy={y} rx="11" ry="6.5" fill="#F28B82" opacity=".55" />;
const Feet = ({ color = "#E0A83C" }: { color?: string }) => (
  <g style={line(color, 5)}>
    <path d="M86 140 v10 M80 151 h12" />
    <path d="M112 140 v10 M106 151 h12" />
  </g>
);

function Magpie() {
  return (
    <>
      {/* 긴 꼬리(남색 윤기) */}
      <path d="M44 104 Q14 104 4 128 Q26 132 52 118 Z" style={f("#1E3A5C", true)} />
      <path d="M40 108 Q20 112 12 124" style={line("#3EA890", 3, 0.7)} />
      <Feet />
      {/* 동글한 몸: 까만 머리·등 + 하얀 배 */}
      <ellipse cx="100" cy="92" rx="62" ry="54" style={f("#2A2118", true)} />
      <path d="M58 104 Q66 140 104 142 Q146 140 154 106 Q132 124 104 124 Q76 124 58 104 Z" fill="#FBF3E4" />
      {/* 작은 날개: 남색 + 하얀 무늬 */}
      <path d="M62 86 Q90 70 108 92 Q92 116 64 104 Z" style={f("#1E3A5C", true)} />
      <path d="M72 92 Q86 86 96 96" style={line("#FBF3E4", 5)} />
      {/* 머리 윤기 */}
      <path d="M74 56 Q96 40 122 46" style={line("#fff", 4, 0.28)} />
      <Eye x={128} y={78} ring="#FBF3E4" />
      <Blush x={136} y={104} />
      {/* 작은 부리(노랑, 까만 몸에서도 보이게) */}
      <path d="M156 84 L174 90 L156 96 Z" style={f("#E0A83C", true)} />
    </>
  );
}

function Pigeon() {
  return (
    <>
      <path d="M44 106 Q20 110 12 126 Q32 128 52 118 Z" style={f("#6F8094", true)} />
      <Feet color="#E8683F" />
      <ellipse cx="100" cy="92" rx="62" ry="54" style={f("#9AA8B8", true)} />
      {/* 연한 배 */}
      <path d="M60 104 Q68 140 104 142 Q144 140 152 108 Q130 124 104 124 Q78 124 60 104 Z" fill="#C9D3DE" />
      {/* 청록·보라 목띠 */}
      <path d="M112 102 Q130 112 152 102 Q150 116 132 120 Q116 118 112 102 Z" fill="#3EA890" />
      <path d="M118 112 Q132 118 148 112" style={line("#8E6FB8", 4, 0.8)} />
      {/* 날개 + 줄무늬 두 개 */}
      <path d="M60 84 Q90 68 110 92 Q92 118 62 104 Z" style={f("#B5C1CE", true)} />
      <path d="M70 92 Q84 88 94 96 M74 101 Q86 98 96 104" style={line("#6F8094", 3.4)} />
      <path d="M74 56 Q96 40 122 46" style={line("#fff", 4, 0.35)} />
      <Eye x={128} y={76} />
      <Blush x={134} y={96} />
      {/* 부리 + 하얀 콧등 */}
      <path d="M156 82 L172 88 L156 94 Z" style={f("#3A2E26", true)} />
      <ellipse cx="157" cy="81" rx="4" ry="3" fill="#FBF3E4" />
    </>
  );
}

function Hawk() {
  return (
    <>
      <path d="M44 104 Q18 106 8 124 Q20 132 50 118 Z" style={f("#5B3A29", true)} />
      <path d="M22 116 l6 4 M30 112 l6 4" style={line("#E0A83C", 2.6, 0.8)} />
      <Feet />
      <ellipse cx="100" cy="92" rx="62" ry="54" style={f("#8A5A3C", true)} />
      {/* 크림색 얼굴·배 */}
      <path d="M104 64 Q150 58 158 92 Q160 128 112 140 Q72 142 64 112 Q100 120 112 100 Q102 82 104 64 Z" fill="#FBF3E4" />
      {/* 배의 작은 V 무늬 */}
      <path d="M96 124 l4 4 l4 -4 M112 128 l4 4 l4 -4 M126 120 l4 4 l4 -4" style={line("#B58257", 2.6)} />
      {/* 날개 */}
      <path d="M58 82 Q88 64 108 90 Q92 118 60 104 Z" style={f("#5B3A29", true)} />
      <path d="M66 94 q6 6 12 4 M78 100 q6 6 12 3" style={line("#E0A83C", 2.6, 0.7)} />
      {/* 눈 위 갈색 줄(씩씩한 표정, 그래도 귀엽게) */}
      <path d="M112 62 Q128 56 144 64" style={line("#5B3A29", 6)} />
      <path d="M74 56 Q90 44 108 46" style={line("#fff", 4, 0.28)} />
      <Eye x={128} y={80} />
      <Blush x={136} y={102} />
      {/* 노란 갈고리 부리 */}
      <path d="M154 82 Q172 82 172 96 Q166 92 154 94 Z" style={f("#E0A83C", true)} />
    </>
  );
}

const ART: Record<string, () => JSX.Element> = { magpie: Magpie, pigeon: Pigeon, hawk: Hawk };
export const CUTE_BIRDS = Object.keys(ART);

export default function CuteBird({ id, size = 64, className }: { id: string; size?: number; className?: string }) {
  const Art = ART[id] ?? Pigeon;
  return (
    <svg viewBox="0 0 200 160" width={size} height={(size * 160) / 200} className={className} aria-hidden>
      <Art />
    </svg>
  );
}
