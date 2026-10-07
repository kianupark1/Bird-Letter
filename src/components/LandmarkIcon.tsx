/** 지도에 찍는 랜드마크 그림(남대문, 탑, 다리, 산, 섬, 성, 한옥, 해변, 등대, 공원). 20x20 칸의 가운데가 (0,0)이에요. */
import type { LandmarkKind } from "../../core/places";

const FILL = { fill: "var(--namsaek)" } as const;
const LINE = { fill: "none", stroke: "var(--namsaek)", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const PAPER = { fill: "var(--b-cream)" } as const;
const HOT = { fill: "var(--dahong)" } as const;

export default function LandmarkIcon({ kind, x, y, scale = 1 }: { kind: LandmarkKind | "sky"; x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`} aria-hidden>
      {kind === "gate" && (
        <>
          <path d="M-10 -3 Q0 -10 10 -3 L8 -1 H-8 Z" style={HOT} />
          <path d="M-6.5 -6.5 Q0 -12 6.5 -6.5 L5.5 -4.5 H-5.5 Z" style={HOT} />
          <rect x="-7" y="-1" width="3" height="8" style={FILL} />
          <rect x="4" y="-1" width="3" height="8" style={FILL} />
          <path d="M-4 7 V3.5 Q0 -0.5 4 3.5 V7" style={LINE} />
          <rect x="-10" y="7" width="20" height="3" style={FILL} />
        </>
      )}
      {kind === "tower" && (
        <>
          <path d="M0 -11 L1.3 -5 H-1.3 Z" style={FILL} />
          <path d="M-1.7 -5 L-3.4 9 H3.4 L1.7 -5 Z" style={FILL} />
          <ellipse cx="0" cy="-1.5" rx="5.5" ry="2.4" style={HOT} />
          <rect x="-6" y="9" width="12" height="2" style={FILL} />
        </>
      )}
      {kind === "bridge" && (
        <>
          <path d="M-10 6 H10" style={LINE} />
          <path d="M-4 6 V-7 M4 6 V-7" style={LINE} />
          <path d="M-10 6 Q-7 -3 -4 -7 Q0 4 4 -7 Q7 -3 10 6" style={LINE} />
          <path d="M-10 9 q2.5 -2 5 0 t5 0 t5 0 t5 0" style={{ ...LINE, strokeWidth: 1.2, opacity: 0.6 }} />
        </>
      )}
      {kind === "mountain" && (
        <>
          <path d="M-11 8 L-3 -7 L1 -1 L4.5 -5 L11 8 Z" style={FILL} />
          <path d="M-3 -7 L-5.6 -2.4 L-3.8 -3.6 L-3 -2 L-1.8 -3.8 Z" style={PAPER} />
        </>
      )}
      {kind === "island" && (
        <>
          <path d="M-9 6 Q-4 -3 0 -2 Q5 -4 9 6 Z" style={FILL} />
          <path d="M-11 9 q2.75 -2 5.5 0 t5.5 0 t5.5 0 t5.5 0" style={{ ...LINE, strokeWidth: 1.3 }} />
        </>
      )}
      {kind === "fortress" && (
        <>
          <path d="M-10 8 V-2 H-7 V-5 H-4 V-2 H-1.5 V-5 H1.5 V-2 H4 V-5 H7 V-2 H10 V8 Z" style={FILL} />
          <path d="M-2.5 8 V3 Q0 0 2.5 3 V8 Z" style={PAPER} />
        </>
      )}
      {kind === "hanok" && (
        <>
          <path d="M-11 -2 Q-5 -2.5 -4.5 -7.5 Q0 -10 4.5 -7.5 Q5 -2.5 11 -2 Q5 0 0 0 Q-5 0 -11 -2 Z" style={HOT} />
          <rect x="-6.5" y="0" width="13" height="6" style={FILL} />
          <rect x="-1.5" y="2" width="3" height="4" style={PAPER} />
          <rect x="-10" y="6" width="20" height="2.5" style={FILL} />
        </>
      )}
      {kind === "beach" && (
        <>
          <circle cx="0" cy="-3.5" r="4" style={HOT} />
          <path d="M-10 4 q2.5 -2 5 0 t5 0 t5 0 t5 0 M-10 8 q2.5 -2 5 0 t5 0 t5 0 t5 0" style={LINE} />
        </>
      )}
      {kind === "lighthouse" && (
        <>
          <path d="M-3 9 L-1.8 -3 H1.8 L3 9 Z" style={FILL} />
          <rect x="-3" y="-7" width="6" height="4" style={HOT} />
          <path d="M-3 -7 L0 -10 L3 -7 Z" style={FILL} />
          <path d="M-9 -5 H-5 M5 -5 H9" style={{ ...LINE, strokeWidth: 1.4 }} />
        </>
      )}
      {kind === "park" && (
        <>
          <circle cx="0" cy="-3" r="6" style={FILL} />
          <circle cx="-3.5" cy="-1" r="3.5" style={FILL} />
          <circle cx="3.5" cy="-1" r="3.5" style={FILL} />
          <rect x="-1.2" y="1" width="2.4" height="8" style={FILL} />
        </>
      )}
      {kind === "sky" && (
        <path d="M-8 3 Q-8 -2 -3 -2 Q-2 -6 2.5 -5 Q7 -5 7 -1 Q10 -1 10 2 Q10 4 7 4 H-6 Q-8 4 -8 3 Z" style={{ fill: "var(--b-cream)", stroke: "var(--namsaek)", strokeWidth: 1.2 }} />
      )}
    </g>
  );
}
