/** 온보딩용 간단한 SVG 일러스트. 나중에 디자이너 에셋으로 교체 가능 */

export function Magpie() {
  return (
    <svg viewBox="0 0 200 160" role="img" aria-label="까치 일러스트" className="illust">
      <path d="M40 92 L6 118 L46 108 Z" fill="#1E3A5C" />
      <ellipse cx="96" cy="88" rx="52" ry="34" fill="#1E3A5C" />
      <ellipse cx="104" cy="104" rx="30" ry="18" fill="#FBF3E4" />
      <path d="M66 82 Q96 52 128 82 Q100 96 66 82 Z" fill="#1B6E5C" />
      <circle cx="140" cy="62" r="22" fill="#1E3A5C" />
      <circle cx="148" cy="58" r="3.5" fill="#FBF3E4" />
      <circle cx="149" cy="58" r="1.5" fill="#2A2118" />
      <path d="M160 62 L184 68 L160 74 Z" fill="#E0A83C" />
      <path d="M86 120 L82 144 M106 120 L110 144" stroke="#E0A83C" strokeWidth="4" strokeLinecap="round" />
      <path d="M20 40 q8 -10 16 0 M168 28 q8 -10 16 0" stroke="#E0A83C" strokeWidth="3" fill="none" strokeLinecap="round" />
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
