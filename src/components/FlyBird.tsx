/**
 * 지도 위를 "날아가는" 새(2026-10-17, 대표님: "새가 날아가는 느낌이 안 나고 안 귀여워"):
 * 날개를 퍼덕이고(위아래), 몸이 살짝 둥실거리고, 땅에 그림자가 따라와요. 가는 방향으로 몸을 기울여요.
 * 새마다 색과 특징(제비 갈라진 꼬리, 까치 긴 꼬리, 두루미 붉은 정수리·긴 다리, 붕붕이 프로펠러)이 달라요.
 * 오른쪽을 보는 모습이 기본, 가운데가 (0,0). 부리에 편지를 물고 있어요.
 */
type Look = { body: string; wing: string; wing2: string; belly: string; head: string; beak: string; cheek?: string; tail: "fan" | "fork" | "long" | "short"; extra?: "crane" | "pigeon" | "swallow" | "hawk" };
const LOOKS: Record<string, Look> = {
  hawk: { body: "#8A5A3C", wing: "#6B4229", wing2: "#5B3A29", belly: "#F1E2C8", head: "#8A5A3C", beak: "#E0A83C", tail: "fan", extra: "hawk" },
  pigeon: { body: "#9AA8B8", wing: "#7F8FA2", wing2: "#6F8094", belly: "#C9D3DD", head: "#8C9AAC", beak: "#E9C88A", cheek: "#F29B8E", tail: "short", extra: "pigeon" },
  swallow: { body: "#1E3A5C", wing: "#18304D", wing2: "#132741", belly: "#FBF3E4", head: "#1E3A5C", beak: "#2A2118", cheek: "#C1481F", tail: "fork", extra: "swallow" },
  magpie: { body: "#22283A", wing: "#2D4A6E", wing2: "#1B2233", belly: "#FBF3E4", head: "#22283A", beak: "#2A2118", cheek: "#F29B8E", tail: "long" },
  crane: { body: "#FBF8F2", wing: "#F1ECE2", wing2: "#2A2118", belly: "#FFFFFF", head: "#FBF8F2", beak: "#C9A86A", cheek: "#F29B8E", tail: "short", extra: "crane" },
};

export default function FlyBird({ birdId, x, y, angle = 0, size = 1, still }: { birdId: string; x: number; y: number; angle?: number; size?: number; still?: boolean }) {
  const left = Math.abs(angle) > 90;
  const tilt = Math.max(-38, Math.min(38, left ? (angle > 0 ? 180 - angle : -180 - angle) : angle));
  const flip = left ? "scale(-1 1)" : "";
  const anim = (values: string, dur: string, type: "rotate" | "translate" | "scale" = "rotate") =>
    still ? null : <animateTransform attributeName="transform" type={type} values={values} dur={dur} repeatCount="indefinite" />;

  if (birdId === "bungbungi") {
    return (
      <g transform={`translate(${x} ${y})`} className="flybird" aria-hidden>
        <ellipse cx="4" cy="24" rx="15" ry="3.6" className="fb-shadow" />
        <g transform={`scale(${size}) ${flip} rotate(${tilt * 0.5})`}>
          <g>{anim("0 0; 0 -3; 0 0", "1.1s", "translate")}
            <path d="M-12 -14 h24 M0 -14 v6" stroke="#5B3A29" strokeWidth="2" strokeLinecap="round" />
            {[-12, 12].map((px) => <g key={px} transform={`translate(${px} -15)`}><ellipse rx="9" ry="1.8" fill="#6F8094" opacity=".8">{anim("1 1; 0.2 1; 1 1", "0.18s", "scale")}</ellipse></g>)}
            <rect x="-15" y="-8" width="30" height="20" rx="9" fill="#F0BC5C" stroke="#C88A1E" strokeWidth="1.5" />
            <circle cx="6" cy="1" r="6" fill="#FBF3E4" stroke="#5B3A29" strokeWidth="1.5" /><circle cx="7.5" cy="1" r="2.8" fill="#241a12" /><circle cx="8.6" cy="-0.2" r="1" fill="#fff" />
            <ellipse cx="-6" cy="6" rx="3" ry="2" fill="#F29B8E" opacity=".8" />
            <g transform="translate(13 9) rotate(-10)"><rect x="0" y="-4" width="12" height="8" rx="1.5" fill="#fff" stroke="#C1481F" strokeWidth="1.2" /><path d="M0.5 -3.4 L6 0.6 L11.5 -3.4" fill="none" stroke="#C1481F" strokeWidth="1" /></g>
          </g>
        </g>
      </g>
    );
  }

  const L = LOOKS[birdId] ?? LOOKS.pigeon;
  const flap = (far: boolean) => anim(far ? "-24 0 -3; 30 0 -3; -24 0 -3" : "-34 0 -3; 26 0 -3; -34 0 -3", "0.55s");
  const wing = (far: boolean) => (
    <g>
      {flap(far)}
      <path d={far ? "M2 -3 C-6 -22 -20 -30 -30 -26 C-22 -18 -12 -8 -2 -1Z" : "M2 -3 C-4 -24 -18 -34 -32 -30 C-24 -20 -12 -8 -3 0Z"} fill={far ? L.wing2 : L.wing} />
      {!far && <path d="M-6 -12 C-14 -20 -22 -24 -28 -26" stroke="rgba(255,255,255,.28)" strokeWidth="1.4" fill="none" strokeLinecap="round" />}
      {!far && birdId === "magpie" && <path d="M-8 -10 C-12 -15 -16 -18 -20 -19 L-14 -11Z" fill="#FBF3E4" />}
      {!far && birdId === "crane" && <path d="M-22 -26 C-26 -28 -30 -29 -32 -30 C-28 -24 -24 -21 -20 -19Z" fill="#2A2118" />}
    </g>
  );
  const tail =
    L.tail === "fork" ? <path d="M-14 0 L-32 -6 L-24 1 L-33 7 Z" fill={L.body} />
    : L.tail === "long" ? <path d="M-13 -1 L-38 -4 L-38 3 L-13 4Z" fill={L.body} />
    : L.tail === "fan" ? <path d="M-13 -2 L-28 -8 L-30 2 L-27 8 L-13 4Z" fill={L.wing2} />
    : <path d="M-13 -2 L-25 -5 L-25 5 L-13 4Z" fill={L.wing2} />;
  const headX = birdId === "crane" ? 24 : 15;

  return (
    <g transform={`translate(${x} ${y})`} className="flybird" aria-hidden>
      {/* 땅에 비친 그림자: 둥실거릴 때 같이 커졌다 작아져요 */}
      <ellipse cx="4" cy="26" rx="16" ry="3.8" className="fb-shadow">{anim("1 1; 0.86 0.86; 1 1", "1.2s", "scale")}</ellipse>
      <g transform={`scale(${size}) ${flip} rotate(${tilt})`}>
        <g>
          {anim("0 0; 0 -3.5; 0 0", "1.2s", "translate")}
          {wing(true)}
          {tail}
          {birdId === "crane" && <path d="M-12 3 L-34 8 M-12 1 L-34 5" stroke="#2A2118" strokeWidth="1.6" strokeLinecap="round" />}
          <ellipse cx="0" cy="0" rx="16" ry="9" fill={L.body} />
          <ellipse cx="3" cy="3.5" rx="11" ry="5" fill={L.belly} />
          {L.extra === "hawk" && <path d="M-1 2 l2 2 M3 2.5 l2 2 M7 2 l2 2" stroke="#8A5A3C" strokeWidth="1" strokeLinecap="round" />}
          {birdId === "crane" && <path d="M12 -2 C17 -4 20 -6 23 -6" stroke="#FBF8F2" strokeWidth="5" strokeLinecap="round" fill="none" />}
          <circle cx={headX} cy="-5" r="7.5" fill={L.head} />
          {L.extra === "pigeon" && <path d={`M${headX - 6} -1 q6 4 11 0`} stroke="#3EA890" strokeWidth="2.2" fill="none" strokeLinecap="round" />}
          {L.extra === "swallow" && <circle cx={headX + 3} cy="-1.5" r="3.4" fill="#C1481F" />}
          {birdId === "crane" && <circle cx={headX - 1} cy="-11" r="2.6" fill="#C1481F" />}
          {(birdId === "magpie" || birdId === "swallow") && <circle cx={headX - 3} cy="-1" r="2.4" fill={L.belly} opacity=".9" />}
          {L.cheek && L.extra !== "swallow" && <ellipse cx={headX + 1} cy="-1" rx="2.4" ry="1.5" fill={L.cheek} opacity=".75" />}
          <circle cx={headX + 3} cy="-7" r="2.1" fill="#241a12" /><circle cx={headX + 3.8} cy="-7.8" r=".8" fill="#fff" />
          {L.extra === "hawk"
            ? <path d={`M${headX + 6} -7 q6 1 5 6 q-2 -2 -5 -2z`} fill={L.beak} />
            : <path d={`M${headX + 6} -7 L${headX + (birdId === "crane" ? 15 : 12)} -4.5 L${headX + 6} -3Z`} fill={L.beak} />}
          {/* 부리에 문 편지 */}
          <g transform={`translate(${headX + (birdId === "crane" ? 12 : 9)} -3) rotate(14)`}>
            <rect x="0" y="-4" width="12" height="8" rx="1.5" fill="#fff" stroke="#C1481F" strokeWidth="1.2" />
            <path d="M0.5 -3.4 L6 0.6 L11.5 -3.4" fill="none" stroke="#C1481F" strokeWidth="1" />
            <path d="M6 2.6 c-1.6 -1.3 -2.6 -2 -1.4 -2.8 c.6 -.3 1.1 0 1.4 .4 c.3 -.4 .8 -.7 1.4 -.4 c1.2 .8 .2 1.5 -1.4 2.8z" fill="#C1481F" />
          </g>
          {wing(false)}
        </g>
      </g>
    </g>
  );
}
