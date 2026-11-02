/** 온보딩용 간단한 SVG 일러스트. 나중에 디자이너 에셋으로 교체 가능 */
import { CuteArt } from "./CuteBird";

/** 온보딩·소개 화면의 까치: 앱 아이콘과 같은 "편지를 문 나는 까치"(2026-11-01 귀여운 새 그림) */
export function Magpie() {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label="편지를 문 까치 일러스트" className="illust">
      <CuteArt id="magpie" variant="C" letter flap />
    </svg>
  );
}

export function Envelope() {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label="봉투 일러스트" className="illust">
      <rect x="22" y="40" width="156" height="98" rx="8" fill="#FFFFFF" stroke="#C1481F" strokeWidth="3" />
      <path d="M22 48 L100 102 L178 48" fill="none" stroke="#C1481F" strokeWidth="3" strokeLinejoin="round" />
      <circle cx="100" cy="100" r="13" fill="#C1481F" />
      <path d="M94 100 q6 -9 12 0 q-6 9 -12 0" fill="#FBF3E4" />
      <path d="M150 22 q10 -12 20 0 q-10 12 -20 0" fill="#E0A83C" />
      <path d="M30 24 q8 -10 16 0" stroke="#1E3A5C" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
