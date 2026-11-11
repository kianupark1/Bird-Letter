/**
 * 내 새 옷 입히기(2026-11-11 대표님: "유료 하기 전에 새 옷 입히는 거, 귀여움 강조, 수익 모델에 넣어").
 * CuteArt A(서 있는 새) 좌표 위에 덧그리는 옷·소품. viewBox 200x160, 머리 중심 (140,60) 반지름 26.
 * C(나는 새)는 머리 중심 (152,72) 반지름 22라서 머리 소품만 옮겨서 그림(outfitHeadC).
 * 모습만 바뀌고 속도·도착 시간·사고 확률은 그대로(시간을 돈으로 사는 것처럼 보이지 않게). 뽑기 없음.
 * 이름·가격은 「가정」(재무→법무→대표 승인 전), 시안 docs/시안/images/v13-*.png
 */
import type { CSSProperties, JSX } from "react";

export type Slot = "head" | "face" | "neck" | "body";
export type Outfit = { id: string; name: string; slot: Slot; price: number; tag?: string; season?: string };

/** 가격(2026-11-11 대표님: "옷은 가격 조금 내려서"): 한 개 900원·왕관 1,100원·우체부 세트 1,500원, 꽃핀은 가입 선물 무료. 실제 값은 App Store Connect 가격대에 맞춤 「미확인」 */
export const OUTFITS: Outfit[] = [
  { id: "flower", name: "꽃핀", slot: "head", price: 0, tag: "가입 선물" },
  { id: "ribbon", name: "다홍 리본", slot: "head", price: 900 },
  { id: "postman", name: "우체부 모자", slot: "head", price: 900, tag: "새편지 대표" },
  { id: "beanie", name: "방울 털모자", slot: "head", price: 900 },
  { id: "gat", name: "꼬마 갓", slot: "head", price: 900 },
  { id: "crown", name: "작은 왕관", slot: "head", price: 1100 },
  { id: "santa", name: "산타 모자", slot: "head", price: 900, season: "12월 한정" },
  { id: "glasses", name: "동글 안경", slot: "face", price: 900 },
  { id: "scarf", name: "줄무늬 목도리", slot: "neck", price: 900 },
  { id: "bowtie", name: "나비넥타이", slot: "neck", price: 900 },
  { id: "satchel", name: "우체부 가방", slot: "body", price: 900 },
];

const RIM: CSSProperties = { stroke: "var(--cb-rim, rgba(42,33,24,.22))", strokeWidth: 2.2, strokeLinejoin: "round" };
const f = (fill: string): CSSProperties => ({ fill, ...RIM });
const ln = (stroke: string, w: number): CSSProperties => ({ stroke, strokeWidth: w, strokeLinecap: "round", strokeLinejoin: "round", fill: "none" });

const DAHONG = "#C1481F", NAM = "#1E3A5C", HWANG = "#E0A83C", CHEONG = "#1B6E5C", HANJI = "#FFF9EC";

/** 머리 소품(머리 중심 140,60 기준) */
const HEAD: Record<string, () => JSX.Element> = {
  flower: () => (
    <g transform="translate(124 40)">
      {[0, 72, 144, 216, 288].map((a) => <ellipse key={a} cx="0" cy="-7" rx="5" ry="7" transform={`rotate(${a})`} style={f("#F7A8B8")} />)}
      <circle r="4.5" style={f(HWANG)} />
    </g>
  ),
  ribbon: () => (
    <g transform="translate(126 38) rotate(-18)">
      <path d="M0 0 L-16 -10 Q-20 0 -16 10 Z" style={f(DAHONG)} />
      <path d="M0 0 L16 -10 Q20 0 16 10 Z" style={f(DAHONG)} />
      <circle r="5" style={f("#A93A14")} />
    </g>
  ),
  postman: () => (
    <g>
      <path d="M116 46 Q116 26 140 24 Q164 26 164 46 Z" style={f(NAM)} />
      <rect x="114" y="40" width="52" height="8" rx="3" style={f(DAHONG)} />
      <path d="M162 46 Q176 46 182 52 Q170 54 160 50 Z" style={f("#14283F")} />
      <g transform="translate(134 29)"><rect width="12" height="8" rx="1.5" fill={HANJI} /><path d="M0.5 0.5 L6 4.5 L11.5 0.5" style={ln(DAHONG, 1.4)} /></g>
    </g>
  ),
  beanie: () => (
    <g>
      <path d="M114 48 Q114 22 140 20 Q166 22 166 48 Z" style={f(CHEONG)} />
      <path d="M124 26 v20 M140 21 v26 M156 26 v20" style={ln("#2E8A74", 3)} />
      <rect x="111" y="42" width="58" height="11" rx="5.5" style={f(HWANG)} />
      <circle cx="140" cy="16" r="8" style={f(HANJI)} />
    </g>
  ),
  gat: () => (
    <g>
      <ellipse cx="140" cy="38" rx="36" ry="6" fill="rgba(30,26,23,.55)" stroke="rgba(30,26,23,.8)" strokeWidth="1.6" />
      <path d="M128 38 L130 16 Q140 12 150 16 L152 38 Z" fill="rgba(30,26,23,.78)" stroke="rgba(30,26,23,.9)" strokeWidth="1.6" />
      <path d="M118 40 Q116 66 124 82" style={ln("#2A2118", 1.6)} />
      {[0, 1, 2, 3, 4].map((i) => <circle key={i} cx={119 + i * 1.2} cy={50 + i * 7} r="2.2" fill={DAHONG} />)}
    </g>
  ),
  crown: () => (
    <g>
      <path d="M124 40 L122 20 L132 30 L140 16 L148 30 L158 20 L156 40 Z" style={f("#F0BC5C")} />
      <circle cx="140" cy="16" r="3.2" fill={DAHONG} /><circle cx="122" cy="20" r="2.6" fill={CHEONG} /><circle cx="158" cy="20" r="2.6" fill={CHEONG} />
      <rect x="124" y="35" width="32" height="5" rx="2" fill="#E0A83C" />
    </g>
  ),
  santa: () => (
    <g>
      <path d="M114 48 Q118 22 146 14 Q166 10 176 24 Q160 18 152 30 Q166 34 166 46 Z" style={f(DAHONG)} />
      <rect x="110" y="42" width="60" height="12" rx="6" style={f(HANJI)} />
      <circle cx="178" cy="26" r="7" style={f(HANJI)} />
    </g>
  ),
};
const FACE: Record<string, () => JSX.Element> = {
  glasses: () => (
    <g>
      <circle cx="148" cy="58" r="12" fill="rgba(255,255,255,.18)" style={ln("#2A2118", 3)} />
      <path d="M136 57 L120 54" style={ln("#2A2118", 3)} />
    </g>
  ),
};
const NECK: Record<string, () => JSX.Element> = {
  scarf: () => (
    <g>
      <path d="M116 80 Q140 92 164 80 L166 90 Q140 102 114 90 Z" style={f(DAHONG)} />
      <path d="M124 92 L118 120 L130 120 L134 94 Z" style={f(DAHONG)} />
      <path d="M124 86 l3 1.5 M136 90 l3 .5 M148 90 l3 -.5 M158 86 l3 -1.5 M120 106 h10 M119 113 h10" style={ln(HWANG, 2.6)} />
    </g>
  ),
  bowtie: () => (
    <g transform="translate(148 88) rotate(-8)">
      <path d="M0 0 L-12 -7 L-12 7 Z" style={f(NAM)} />
      <path d="M0 0 L12 -7 L12 7 Z" style={f(NAM)} />
      <circle r="3.6" style={f(DAHONG)} />
    </g>
  ),
};
const BODY: Record<string, () => JSX.Element> = {
  satchel: () => (
    <g>
      <path d="M130 80 L104 112" style={ln("#7A4A2A", 4)} />
      <rect x="86" y="106" width="28" height="20" rx="4" style={f("#A0643C")} />
      <path d="M86 110 Q100 120 114 110" style={{ ...ln("#7A4A2A", 2.4) }} />
      <g transform="translate(94 112)"><rect width="12" height="8" rx="1.5" fill={HANJI} /><path d="M0.5 0.5 L6 4.5 L11.5 0.5" style={ln(DAHONG, 1.4)} /></g>
    </g>
  ),
};

/** 입힌 것들(슬롯마다 하나)을 A 그림 위에 덧그림 */
export function OutfitArt({ items }: { items: string[] }) {
  const pick = (map: Record<string, () => JSX.Element>) => items.filter((i) => i in map).slice(0, 1).map((i) => <g key={i}>{map[i]()}</g>);
  return (
    <>
      {pick(BODY)}
      {pick(NECK)}
      {pick(FACE)}
      {pick(HEAD)}
    </>
  );
}

/** 나는 새(C) 위에는 머리·얼굴 소품만, 머리 위치에 맞춰 옮겨 그림 */
export function OutfitHeadC({ items }: { items: string[] }) {
  const s = 22 / 26;
  return (
    <g transform={`translate(152 72) scale(${s}) translate(-140 -60)`}>
      {items.filter((i) => i in FACE).slice(0, 1).map((i) => <g key={i}>{FACE[i]()}</g>)}
      {items.filter((i) => i in HEAD).slice(0, 1).map((i) => <g key={i}>{HEAD[i]()}</g>)}
    </g>
  );
}

export const wonText = (n: number) => (n === 0 ? "무료" : `${n.toLocaleString("ko-KR")}원`);

/** 세트(우체부 모자+가방) */
export const OUTFIT_SETS = [{ id: "postman-set", name: "우체부 세트", items: ["postman", "satchel"], price: 1500 }];
