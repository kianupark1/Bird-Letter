/**
 * 새 6종 전용 일러스트(이모지 대신). 기기마다 모양이 달라지는 이모지를 피하고 오방색으로 통일했어요.
 * 색은 CSS 변수라서 라이트/다크 모드에서 자동으로 바뀌어요(globals.css의 --b-*).
 * 모두 오른쪽을 보는 옆모습, viewBox 200x160. HTML에서도, 지도(svg) 안에서도 x/y를 주면 쓸 수 있어요.
 */
import type { CSSProperties } from "react";

const c = (v: string): CSSProperties => ({ fill: `var(${v})` });
const s = (v: string, w: number): CSSProperties => ({ stroke: `var(${v})`, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" });

const NAVY = "--namsaek", TEAL = "--cheongrok", GOLD = "--hwangto", RED = "--dahong";
const CREAM = "--b-cream", INK = "--b-ink", BROWN = "--b-brown", BROWN2 = "--b-brown2", GREY = "--b-grey", GREY2 = "--b-grey2", EDGE = "--b-edge";

function Eye({ x, y }: { x: number; y: number }) {
  return (
    <>
      <circle cx={x} cy={y} r="4.6" style={c(CREAM)} />
      <circle cx={x + 1} cy={y} r="2.4" style={c(INK)} />
    </>
  );
}

function Hawk() {
  return (
    <>
      <path d="M44 94 L6 128 L54 112 Z" style={c(BROWN2)} />
      <ellipse cx="96" cy="88" rx="52" ry="34" style={c(BROWN)} />
      <ellipse cx="106" cy="104" rx="30" ry="19" style={c(CREAM)} />
      <path d="M92 98 h22 M92 107 h25 M97 116 h18" style={s(BROWN, 3)} />
      <path d="M62 84 Q96 48 132 84 Q100 98 62 84 Z" style={c(BROWN2)} />
      <circle cx="140" cy="62" r="22" style={c(BROWN)} />
      <path d="M134 50 L158 58" style={s(INK, 4)} />
      <circle cx="148" cy="62" r="4.6" style={c(GOLD)} />
      <circle cx="149" cy="62" r="2.2" style={c(INK)} />
      <path d="M158 60 Q186 58 182 82 Q174 70 158 74 Z" style={c(GOLD)} />
      <path d="M86 120 L82 146 M106 120 L110 146" style={s(GOLD, 4.5)} />
      <path d="M76 146 h12 M104 146 h12" style={s(INK, 3)} />
    </>
  );
}

function Swallow() {
  return (
    <>
      <path d="M52 86 L2 98 L28 100 L6 128 L58 104 Z" style={c(NAVY)} />
      <ellipse cx="98" cy="88" rx="50" ry="28" style={c(NAVY)} />
      <ellipse cx="104" cy="101" rx="32" ry="15" style={c(CREAM)} />
      <path d="M60 82 Q92 42 136 78 Q100 94 60 82 Z" style={c(TEAL)} />
      <circle cx="140" cy="64" r="20" style={c(NAVY)} />
      <ellipse cx="152" cy="76" rx="12" ry="8" style={c(RED)} />
      <path d="M126 56 Q134 46 146 48" style={s(RED, 4)} />
      <Eye x={146} y={60} />
      <path d="M158 62 L178 67 L158 72 Z" style={c(INK)} />
      <path d="M90 114 L86 136 M108 114 L112 136" style={s(INK, 3.5)} />
    </>
  );
}

function Pigeon() {
  return (
    <>
      <path d="M46 88 L10 108 L50 108 Z" style={c(GREY2)} />
      <ellipse cx="96" cy="92" rx="54" ry="38" style={c(GREY)} />
      <path d="M60 90 Q96 56 130 90 Q98 106 60 90 Z" style={c(GREY2)} />
      <path d="M80 82 q12 -10 24 -4 M78 92 q14 -8 28 -2" style={s(CREAM, 3.5)} />
      <circle cx="141" cy="60" r="20" style={c(GREY)} />
      <ellipse cx="130" cy="80" rx="17" ry="13" style={c(TEAL)} />
      <circle cx="148" cy="57" r="5" style={c(GOLD)} />
      <circle cx="149" cy="57" r="2.3" style={c(INK)} />
      <path d="M158 56 L178 62 L158 69 Z" style={c(INK)} />
      <ellipse cx="160" cy="58" rx="4" ry="3" style={c(CREAM)} />
      <path d="M86 126 L82 148 M106 126 L110 148" style={s(RED, 4.5)} />
    </>
  );
}

function Magpie() {
  return (
    <>
      <path d="M40 92 L6 122 L48 110 Z" style={c(NAVY)} />
      <ellipse cx="96" cy="88" rx="52" ry="34" style={c(NAVY)} />
      <ellipse cx="104" cy="104" rx="30" ry="18" style={c(CREAM)} />
      <path d="M66 82 Q96 52 128 82 Q100 96 66 82 Z" style={c(TEAL)} />
      <circle cx="140" cy="62" r="22" style={c(NAVY)} />
      <Eye x={148} y={58} />
      <path d="M160 62 L186 68 L160 74 Z" style={c(GOLD)} />
      <path d="M86 120 L82 146 M106 120 L110 146" style={s(GOLD, 4.5)} />
    </>
  );
}

function Bungbungi() {
  return (
    <>
      <path d="M62 62 L82 80 M138 62 L118 80" style={s(INK, 5)} />
      <path d="M62 50 V62 M138 50 V62" style={s(INK, 4)} />
      <ellipse className="rotor" cx="62" cy="48" rx="30" ry="4.5" style={c(INK)} />
      <ellipse className="rotor" cx="138" cy="48" rx="30" ry="4.5" style={c(INK)} />
      <circle cx="100" cy="94" r="44" style={c(GOLD)} />
      <ellipse cx="96" cy="112" rx="28" ry="20" style={c(CREAM)} />
      <path d="M58 100 Q44 100 40 112 Q52 110 60 112 Z" style={c(GOLD)} />
      <circle cx="118" cy="84" r="17" style={c(NAVY)} />
      <circle cx="118" cy="84" r="12.5" style={c(CREAM)} />
      <circle cx="121" cy="85" r="6.5" style={c(INK)} />
      <circle cx="123" cy="82" r="2" style={c(CREAM)} />
      <path d="M142 96 L168 102 L142 110 Z" style={c(RED)} />
      <path d="M68 140 H132 M80 128 L76 140 M120 128 L124 140" style={s(INK, 4.5)} />
    </>
  );
}

function Crane() {
  const edge: CSSProperties = { stroke: `var(${EDGE})`, strokeWidth: 2 };
  return (
    <>
      <path d="M118 92 Q142 84 138 62 Q136 44 150 36" style={s(EDGE, 13)} />
      <path d="M118 92 Q142 84 138 62 Q136 44 150 36" style={s(CREAM, 10)} />
      <path d="M150 36 Q140 44 139 60" style={s(INK, 6)} />
      <path d="M54 96 L8 88 L26 104 L8 118 L58 110 Z" style={c(INK)} />
      <ellipse cx="92" cy="98" rx="44" ry="26" style={{ ...c(CREAM), ...edge }} />
      <path d="M104 96 Q86 84 64 96 Q86 108 104 96 Z" style={c(CREAM)} />
      <path d="M62 94 L80 100 L62 108 Z" style={c(INK)} />
      <circle cx="152" cy="32" r="12" style={{ ...c(CREAM), ...edge }} />
      <path d="M141 29 Q152 13 163 29 Q152 24 141 29 Z" style={c(RED)} />
      <path d="M144 38 Q154 44 161 38" style={s(INK, 4)} />
      <circle cx="155" cy="31" r="2.4" style={c(INK)} />
      <path d="M163 33 L194 38 L163 42 Z" style={c(GOLD)} />
      <path d="M88 120 L90 156 M104 120 L108 156" style={s(INK, 3.5)} />
    </>
  );
}

/** 부리에 문 편지(봉투). 새마다 부리 위치가 달라서 걸리는 자리를 따로 정했어요 */
const LETTER_AT: Record<string, { x: number; y: number; r: number }> = {
  hawk: { x: 176, y: 100, r: -12 },
  swallow: { x: 172, y: 90, r: -10 },
  pigeon: { x: 172, y: 86, r: -10 },
  magpie: { x: 178, y: 92, r: -10 },
  bungbungi: { x: 166, y: 126, r: -8 },
  crane: { x: 182, y: 62, r: 8 },
};

function Letter({ id }: { id: string }) {
  const at = LETTER_AT[id] ?? LETTER_AT.pigeon;
  return (
    <g transform={`translate(${at.x} ${at.y}) rotate(${at.r})`}>
      <rect x="-23" y="-16" width="46" height="32" rx="3.5" style={{ ...c(CREAM), stroke: `var(${RED})`, strokeWidth: 3 }} />
      <path d="M-22 -14 L0 4 L22 -14" style={s(RED, 3)} />
      <circle cx="0" cy="4" r="5.5" style={c(RED)} />
    </g>
  );
}

const ART: Record<string, () => React.JSX.Element> = {
  hawk: Hawk,
  swallow: Swallow,
  pigeon: Pigeon,
  magpie: Magpie,
  bungbungi: Bungbungi,
  crane: Crane,
};

type Props = {
  id: string;
  /** 가로 크기(px). 세로는 0.8배 */
  size?: number;
  className?: string;
  /** 지도(svg) 안에 넣을 때의 좌표 */
  x?: number;
  y?: number;
  title?: string;
  /** true면 편지를 부리에 문 모습 */
  letter?: boolean;
};

export default function BirdIcon({ id, size = 40, className, x, y, title, letter }: Props) {
  const Art = ART[id] ?? Pigeon;
  return (
    <svg
      viewBox="0 0 200 160"
      width={size}
      height={size * 0.8}
      x={x}
      y={y}
      className={`birdicon ${className ?? ""}`}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
      style={letter ? { overflow: "visible" } : undefined}
    >
      {letter && <Letter id={id} />}
      <Art />
    </svg>
  );
}
