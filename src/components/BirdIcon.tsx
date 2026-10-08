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

const SH: CSSProperties = { fill: "rgba(20,12,6,.22)" };
const HL: CSSProperties = { fill: "rgba(255,255,255,.30)" };
const PUPIL = "#241a12";
const sp = (w: number): CSSProperties => ({ stroke: PUPIL, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" });
const soft = (v: string, w: number, op: number): CSSProperties => ({ ...s(v, w), opacity: op });
const dark = (w: number, op: number): CSSProperties => ({ stroke: "rgba(30,20,12,.55)", strokeWidth: w, strokeLinecap: "round", fill: "none", opacity: op });

/** 반짝이는 눈: 흰자, 눈동자, 하이라이트 */
function Eye({ x, y, r = 5, ring }: { x: number; y: number; r?: number; ring?: string }) {
  return (
    <>
      <circle cx={x} cy={y} r={r + 1.2} style={ring ? c(ring) : c(CREAM)} />
      <circle cx={x + 0.4} cy={y} r={r} style={c(CREAM)} />
      <circle cx={x + 1.3} cy={y + 0.2} r={r * 0.62} style={{ fill: PUPIL }} />
      <circle cx={x + 2.6} cy={y - 1.5} r={r * 0.24} style={{ fill: "#fff" }} />
    </>
  );
}

/** 발: 발가락 세 개 + 뒷발가락 */
function Foot({ x, y, color = GOLD }: { x: number; y: number; color?: string }) {
  return <path d={`M${x} ${y} l11 2.5 M${x} ${y} l9 -3 M${x} ${y} l-7 3.5 M${x + 11} ${y + 2.5} l2 1.5`} style={s(color, 3)} />;
}

function Hawk() {
  return (
    <>
      {/* 꼬리 깃털 두 장 + 줄무늬 */}
      <path d="M52 90 L6 108 L14 122 L60 104 Z" style={c(BROWN2)} />
      <path d="M56 98 L8 130 L26 138 L66 110 Z" style={c(BROWN)} />
      <path d="M30 100 l4 10 M20 106 l4 10 M32 118 l5 8 M22 124 l5 7" style={dark(2.4, 0.8)} />
      {/* 몸통과 그림자 */}
      <ellipse cx="96" cy="88" rx="52" ry="34" style={c(BROWN)} />
      <path d="M48 100 Q96 134 146 100 Q122 122 96 122 Q66 122 48 100 Z" style={SH} />
      {/* 가슴: 크림색 배와 세로 줄무늬 */}
      <ellipse cx="106" cy="104" rx="30" ry="19" style={c(CREAM)} />
      <path d="M96 104 v9 M104 101 v13 M112 101 v13 M120 104 v9" style={s(BROWN, 2.6)} />
      {/* 날개: 겹친 깃털과 끝 무늬 */}
      <path d="M62 84 Q96 42 136 82 Q102 102 62 84 Z" style={c(BROWN2)} />
      <path d="M70 80 Q96 56 124 78" style={{ ...s(BROWN, 5), opacity: 0.7 }} />
      <path d="M64 86 q4 11 13 9 M79 91 q4 11 13 7 M95 93 q5 10 14 4 M111 90 q4 9 12 1" style={s(BROWN, 3)} />
      <path d="M80 74 q4 -6 10 -6 M96 70 q4 -6 10 -5 M110 72 q4 -5 9 -4" style={soft(CREAM, 2, 0.45)} />
      {/* 머리 */}
      <circle cx="140" cy="62" r="22" style={c(BROWN)} />
      <path d="M124 52 Q138 36 156 48" style={{ fill: "none", stroke: "rgba(255,255,255,.32)", strokeWidth: 3, strokeLinecap: "round" }} />
      <ellipse cx="138" cy="72" rx="13" ry="9" style={c(CREAM)} />
      <path d="M130 74 Q129 82 134 86" style={s(INK, 4)} />
      <path d="M133 50 L160 58" style={s(INK, 4.5)} />
      <Eye x={147} y={61} r={4.4} ring={GOLD} />
      {/* 갈고리 부리 */}
      <path d="M158 62 Q188 56 184 86 Q176 72 158 74 Z" style={c(GOLD)} />
      <path d="M176 76 Q184 80 184 86 Q178 78 172 74 Z" style={{ fill: PUPIL, opacity: 0.8 }} />
      <circle cx="166" cy="65" r="1.5" style={{ fill: PUPIL }} />
      {/* 다리: 깃털 바지, 발톱 */}
      <path d="M86 124 L82 146 M106 125 L110 146" style={s(GOLD, 4.8)} />
      <path d="M72 148 h14 M100 148 h14" style={s(GOLD, 3.4)} />
      <path d="M72 148 l-3 3 M114 148 l3 3" style={s(INK, 2.6)} />
    </>
  );
}

function Swallow() {
  return (
    <>
      {/* 꼬리: 길게 갈라진 제비 꼬리 + 흰 점 */}
      <path d="M54 86 L2 94 L6 100 L58 96 Z" style={c(NAVY)} />
      <path d="M56 94 L4 130 L12 132 L62 104 Z" style={c(NAVY)} />
      <ellipse cx="30" cy="95" rx="6" ry="2" style={c(CREAM)} />
      <ellipse cx="34" cy="116" rx="5" ry="2" transform="rotate(-36 34 116)" style={c(CREAM)} />
      <path d="M8 96 L52 91 M10 128 L56 100" style={soft(TEAL, 1.6, 0.7)} />
      {/* 몸통, 윤기, 배 */}
      <ellipse cx="98" cy="88" rx="50" ry="28" style={c(NAVY)} />
      <ellipse cx="88" cy="73" rx="30" ry="6" transform="rotate(-8 88 73)" style={HL} />
      <ellipse cx="106" cy="101" rx="32" ry="15" style={c(CREAM)} />
      <path d="M92 104 q4 4 8 0 M102 108 q4 4 8 0 M112 104 q4 4 8 0 M120 98 q3 3 7 0" style={soft(GREY2, 1.8, 0.7)} />
      {/* 날개: 길게 뒤로 뻗은 모양 + 깃털 결 */}
      <path d="M58 82 Q98 44 154 84 Q148 94 118 95 Q84 98 58 86 Z" style={c(NAVY)} />
      <path d="M66 82 Q98 56 140 82" style={s(TEAL, 5)} />
      <path d="M62 86 L100 90 M72 90 L112 93 M84 93 L130 91 M100 95 L146 88" style={soft(INK, 1.8, 0.25)} />
      <path d="M64 80 Q96 54 136 78" style={{ fill: "none", stroke: "rgba(255,255,255,.32)", strokeWidth: 2.4, strokeLinecap: "round" }} />
      {/* 머리: 붉은 이마와 멱 */}
      <circle cx="140" cy="64" r="20" style={c(NAVY)} />
      <path d="M126 56 Q134 44 148 46 Q140 52 134 62 Z" style={c(RED)} />
      <ellipse cx="152" cy="76" rx="12" ry="8" style={c(RED)} />
      <path d="M126 56 Q134 46 146 48" style={s(RED, 4)} />
      <Eye x={146} y={60} r={4.4} />
      <path d="M158 62 L180 67 L158 73 Z" style={c(INK)} />
      <path d="M158 67 L176 67" style={{ ...s(CREAM, 1.1), opacity: 0.6 }} />
      {/* 발 */}
      <path d="M90 114 L86 134 M108 114 L112 134" style={s(INK, 3.4)} />
      <path d="M80 136 h12 M106 136 h12" style={s(INK, 2.6)} />
    </>
  );
}

function Pigeon() {
  return (
    <>
      {/* 꼬리: 부채꼴 + 끝 띠 */}
      <path d="M46 86 L8 104 L12 118 L50 108 Z" style={c(GREY2)} />
      <path d="M10 106 L14 118" style={dark(5, 0.7)} />
      <path d="M46 92 L14 98" style={{ ...s(CREAM, 1.6), opacity: 0.4 }} />
      {/* 몸통과 가슴 윤기 */}
      <ellipse cx="96" cy="92" rx="54" ry="38" style={c(GREY)} />
      <path d="M52 108 Q96 140 146 106 Q124 128 96 128 Q68 128 52 108 Z" style={SH} />
      <ellipse cx="118" cy="104" rx="26" ry="16" style={HL} />
      {/* 날개와 날개 띠 두 줄, 깃털 끝 */}
      <path d="M58 90 Q96 52 134 90 Q100 108 58 90 Z" style={c(GREY2)} />
      <path d="M76 84 q14 -11 30 -5 M74 94 q16 -9 34 -2" style={s(CREAM, 3.2)} />
      <path d="M72 78 q16 -10 34 -5" style={dark(3, 0.55)} />
      <path d="M62 92 q4 9 12 7 M76 96 q4 9 12 5 M92 98 q5 8 12 3 M108 95 q4 7 11 0" style={soft(INK, 2.2, 0.3)} />
      {/* 머리, 윤기 나는 목 */}
      <circle cx="141" cy="60" r="20" style={c(GREY)} />
      <ellipse cx="130" cy="80" rx="18" ry="13" style={c(TEAL)} />
      <path d="M118 78 q10 -7 22 -2 M120 85 q10 -6 22 -1" style={soft(CREAM, 2, 0.45)} />
      <path d="M124 70 Q134 78 144 72" style={soft(RED, 3, 0.45)} />
      <path d="M126 46 Q140 36 154 46" style={{ fill: "none", stroke: "rgba(255,255,255,.34)", strokeWidth: 3, strokeLinecap: "round" }} />
      <Eye x={148} y={57} r={3.6} ring={GOLD} />
      <path d="M158 56 L180 63 L158 70 Z" style={c(INK)} />
      <ellipse cx="160" cy="58" rx="5" ry="3.4" style={c(CREAM)} />
      {/* 발: 붉은 다리와 발가락 */}
      <path d="M86 126 L82 146 M106 126 L110 146" style={s(RED, 4.6)} />
      <path d="M72 148 h14 M100 148 h14" style={s(RED, 3.2)} />
    </>
  );
}

function Magpie() {
  return (
    <>
      {/* 긴 꼬리: 깃털 세 장 + 청록 윤기 */}
      <path d="M44 88 L2 100 L8 108 L52 100 Z" style={c(NAVY)} />
      <path d="M42 94 L4 122 L14 128 L52 106 Z" style={c(NAVY)} />
      <path d="M48 98 L12 140 L24 140 L58 108 Z" style={c(NAVY)} />
      <path d="M6 103 L48 95 M10 124 L48 100 M18 138 L54 106" style={soft(TEAL, 2.4, 0.9)} />
      {/* 몸통, 윤기, 배 */}
      <ellipse cx="96" cy="88" rx="52" ry="34" style={c(NAVY)} />
      <ellipse cx="86" cy="70" rx="30" ry="6" transform="rotate(-8 86 70)" style={HL} />
      <path d="M48 100 Q96 134 146 100 Q122 122 96 122 Q66 122 48 100 Z" style={SH} />
      <ellipse cx="106" cy="104" rx="30" ry="18" style={c(CREAM)} />
      <path d="M94 100 q4 4 8 0 M104 106 q4 4 8 0 M114 100 q4 4 8 0 M96 112 q4 3 8 0 M110 113 q4 3 8 0" style={soft(GREY2, 1.8, 0.55)} />
      {/* 날개: 청록빛 + 깃털 끝, 어깨의 흰 무늬 */}
      <path d="M62 84 Q96 46 132 82 Q100 100 62 84 Z" style={c(TEAL)} />
      <path d="M66 84 Q96 60 124 80" style={{ ...s(NAVY, 5), opacity: 0.55 }} />
      <ellipse cx="104" cy="66" rx="15" ry="5.5" transform="rotate(-12 104 66)" style={c(CREAM)} />
      <path d="M66 86 q4 10 12 8 M80 91 q4 10 12 6 M96 93 q5 9 13 4 M112 90 q4 8 12 1" style={soft(NAVY, 3, 0.6)} />
      <path d="M72 74 Q96 56 120 74" style={{ fill: "none", stroke: "rgba(255,255,255,.32)", strokeWidth: 2.4, strokeLinecap: "round" }} />
      {/* 머리와 눈, 부리 */}
      <circle cx="140" cy="62" r="22" style={c(NAVY)} />
      <path d="M124 50 Q138 36 156 46" style={{ fill: "none", stroke: "rgba(255,255,255,.34)", strokeWidth: 3, strokeLinecap: "round" }} />
      <ellipse cx="152" cy="66" rx="9" ry="6" style={{ fill: "rgba(255,160,130,.25)" }} />
      <Eye x={148} y={58} r={4.8} />
      <path d="M160 58 L188 66 L160 76 Z" style={c(GOLD)} />
      <path d="M160 67 L186 66" style={dark(1.6, 0.55)} />
      <circle cx="168" cy="62" r="1.4" style={{ fill: PUPIL }} />
      {/* 발 */}
      <path d="M86 120 L82 146 M106 120 L110 146" style={s(GOLD, 4.6)} />
      <path d="M72 148 h14 M100 148 h14" style={s(GOLD, 3.2)} />
    </>
  );
}

function Bungbungi() {
  return (
    <>
      {/* 프로펠러: 받침대, 날개, 회전 흔적 */}
      <path d="M62 62 L82 80 M138 62 L118 80" style={s(INK, 5)} />
      <path d="M62 50 V62 M138 50 V62" style={s(INK, 4)} />
      <ellipse className="rotor" cx="62" cy="48" rx="30" ry="4.5" style={c(INK)} />
      <ellipse className="rotor" cx="138" cy="48" rx="30" ry="4.5" style={c(INK)} />
      <circle cx="62" cy="48" r="4.2" style={c(RED)} />
      <circle cx="138" cy="48" r="4.2" style={c(RED)} />
      <path d="M36 40 Q62 30 88 40 M112 40 Q138 30 164 40" style={soft(INK, 1.6, 0.3)} />
      {/* 몸통: 노란 동그란 몸 + 윤기 + 패널선 */}
      <circle cx="100" cy="94" r="44" style={c(GOLD)} />
      <ellipse cx="88" cy="68" rx="26" ry="8" transform="rotate(-18 88 68)" style={HL} />
      <path d="M62 112 Q100 140 138 108 Q116 130 98 132 Q76 132 62 112 Z" style={SH} />
      <path d="M70 84 Q100 70 128 86" style={{ ...s(INK, 1.6), opacity: 0.28 }} />
      <ellipse cx="96" cy="112" rx="28" ry="20" style={c(CREAM)} />
      <path d="M82 110 h28 M84 118 h24" style={soft(GOLD, 2, 0.6)} />
      <circle cx="104" cy="124" r="3" style={c(RED)} />
      {/* 꼬리 날개 */}
      <path d="M58 100 Q44 100 38 114 Q52 112 60 114 Z" style={c(GOLD)} />
      <path d="M44 108 L56 106" style={dark(1.6, 0.4)} />
      {/* 카메라 눈 */}
      <circle cx="118" cy="84" r="18" style={c(NAVY)} />
      <circle cx="118" cy="84" r="13" style={c(CREAM)} />
      <circle cx="121" cy="85" r="7.4" style={{ fill: PUPIL }} />
      <circle cx="124" cy="82" r="2.4" style={{ fill: "#fff" }} />
      <circle cx="118" cy="84" r="13" style={{ fill: "none", stroke: "rgba(255,255,255,.4)", strokeWidth: 1.4 }} />
      {/* 볼터치와 부리 */}
      <ellipse cx="136" cy="102" rx="7" ry="4.5" style={{ fill: "rgba(255,120,110,.35)" }} />
      <path d="M142 96 L170 102 L142 110 Z" style={c(RED)} />
      <path d="M142 103 L166 102" style={dark(1.4, 0.4)} />
      {/* 착륙 다리 */}
      <path d="M66 140 H134 M80 128 L76 140 M120 128 L124 140" style={s(INK, 4.6)} />
      <path d="M62 140 q-4 0 -4 -4 M138 140 q4 0 4 -4" style={s(INK, 3)} />
    </>
  );
}

function Crane() {
  const edge: CSSProperties = { stroke: `var(${EDGE})`, strokeWidth: 2 };
  return (
    <>
      {/* 긴 목: 흰 목 + 뒤쪽 검은 줄 */}
      <path d="M118 92 Q142 84 138 62 Q136 44 150 36" style={s(EDGE, 13)} />
      <path d="M118 92 Q142 84 138 62 Q136 44 150 36" style={s(CREAM, 10)} />
      <path d="M150 36 Q140 44 139 60 Q140 78 124 88" style={sp(4.6)} />
      {/* 꼬리 깃털: 검은 장식깃 */}
      <path d="M54 96 L6 86 L16 98 L4 114 L12 124 L58 112 Z" style={c(INK)} />
      <path d="M12 90 L50 98 M8 108 L52 104" style={soft(CREAM, 1.2, 0.35)} />
      {/* 몸통과 날개 */}
      <ellipse cx="92" cy="98" rx="44" ry="26" style={{ ...c(CREAM), ...edge }} />
      <path d="M52 108 Q92 130 130 108 Q108 120 92 120 Q70 120 52 108 Z" style={SH} />
      <path d="M104 96 Q86 80 62 94 Q86 110 104 96 Z" style={c(CREAM)} />
      <path d="M70 90 Q92 76 108 92" style={soft(GREY, 2.4, 0.7)} />
      <path d="M52 92 L72 95 L58 101 Z M54 101 L76 102 L60 110 Z M58 109 L78 107 L66 117 Z" style={{ fill: PUPIL }} />
      <path d="M78 84 q8 -8 18 -4 M72 92 q10 -8 24 -2" style={soft(GREY2, 2, 0.5)} />
      {/* 머리: 붉은 정수리, 검은 얼굴, 눈 */}
      <circle cx="152" cy="32" r="12.4" style={{ ...c(CREAM), ...edge }} />
      <path d="M140 29 Q152 11 164 29 Q152 22 140 29 Z" style={c(RED)} />
      <path d="M143 38 Q154 46 162 38 Q154 36 146 32 Z" style={{ fill: PUPIL }} />
      <Eye x={156} y={31} r={2.8} ring={CREAM} />
      <path d="M163 33 L196 38 L163 43 Z" style={c(GOLD)} />
      <path d="M164 38 L192 38" style={dark(1.2, 0.45)} />
      {/* 길고 가는 다리와 발가락 */}
      <path d="M88 120 L90 156 M104 120 L108 156" style={s(INK, 3.4)} />
      <circle cx="89" cy="138" r="2.2" style={c(GREY2)} />
      <circle cx="106" cy="138" r="2.2" style={c(GREY2)} />
      <path d="M80 157 h14 M100 157 h14" style={s(INK, 2.8)} />
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
      {/* 그림자 */}
      <rect x="-22" y="-12" width="46" height="32" rx="4" style={SH} />
      {/* 봉투 몸통 + 항공우편풍 테두리 */}
      <rect x="-23" y="-16" width="46" height="32" rx="3.5" style={{ ...c(CREAM), stroke: `var(${RED})`, strokeWidth: 3 }} />
      <rect x="-19" y="-12" width="38" height="24" rx="2" style={{ fill: "none", stroke: `var(${NAVY})`, strokeWidth: 1.6, strokeDasharray: "5 4" }} />
      {/* 뚜껑 접힌 선과 하이라이트 */}
      <path d="M-22 -14 L0 4 L22 -14" style={s(RED, 3)} />
      <path d="M-22 14 L-7 2 M22 14 L7 2" style={{ ...s(RED, 1.6), opacity: 0.55 }} />
      <path d="M-18 -12 L0 1 L-14 -12 Z" style={HL} />
      {/* 밀랍 도장 */}
      <circle cx="0" cy="4" r="6" style={c(RED)} />
      <circle cx="-1.8" cy="2.2" r="1.8" style={{ fill: "rgba(255,255,255,.55)" }} />
      <path d="M-2.6 5 q2.6 -3 5.2 0" style={{ ...s(CREAM, 1.2), opacity: 0.9 }} />
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
