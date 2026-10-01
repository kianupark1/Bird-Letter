import type { Route } from "@/lib/routes";

type Props = { route: Route; p: number; emoji: string };

// 한반도·제주·울릉도·독도를 아주 단순하게 그린 배경. 최종본은 Kakao Maps SDK로 교체
const PENINSULA =
  "M98 14 Q120 2 150 6 Q182 10 200 38 Q214 64 226 96 Q238 126 240 156 Q242 186 222 196 Q215 192 205 175 Q185 146 150 140 Q120 138 104 128 Q98 112 104 86 Q96 62 98 14 Z";

/** 임시 SVG 지도. 최종본은 Kakao Maps SDK로 교체 */
export default function JourneyMap({ route, p, emoji }: Props) {
  const pts = route.points.map((pt) => pt.xy);
  const seg = pts.slice(1).map((pt, i) => Math.hypot(pt[0] - pts[i][0], pt[1] - pts[i][1]));
  const total = seg.reduce((a, b) => a + b, 0);
  let remain = p * total;
  let pos: [number, number] = pts[0];
  const done: [number, number][] = [pts[0]];
  for (let i = 0; i < seg.length; i++) {
    if (remain >= seg[i]) {
      remain -= seg[i];
      pos = pts[i + 1];
      done.push(pts[i + 1]);
    } else {
      const t = seg[i] === 0 ? 0 : remain / seg[i];
      pos = [pts[i][0] + (pts[i + 1][0] - pts[i][0]) * t, pts[i][1] + (pts[i + 1][1] - pts[i][1]) * t];
      done.push(pos);
      break;
    }
  }
  const toPath = (a: [number, number][]) => a.map((q, i) => `${i ? "L" : "M"}${q[0]},${q[1]}`).join(" ");

  return (
    <svg className="map" viewBox="0 -14 300 234" role="img" aria-label={`${route.title} 여정 지도`}>
      <path className="land" d={PENINSULA} />
      <ellipse className="land" cx="115" cy="204" rx="22" ry="8" />
      <ellipse className="land" cx="235" cy="55" rx="6" ry="4" />
      <circle className="land" cx="270" cy="75" r="2.5" />

      <g aria-hidden>
        <ellipse className="cloud" cx="50" cy="40" rx="22" ry="7" />
        <ellipse className="cloud" cx="262" cy="150" rx="20" ry="6" style={{ animationDelay: "-5s" }} />
        <ellipse className="cloud" cx="40" cy="170" rx="18" ry="6" style={{ animationDelay: "-9s" }} />
      </g>

      <path className="route-line" d={toPath(pts)} />
      <path className="route-done" d={toPath(done)} />
      {route.points.map((pt) => (
        <g key={pt.name}>
          <circle cx={pt.xy[0]} cy={pt.xy[1]} r="4.5" fill="var(--hwangto)" stroke="var(--sky)" strokeWidth="1.5" />
          <text className="lbl" x={pt.xy[0] + 9} y={pt.xy[1] + 4}>{pt.name}</text>
        </g>
      ))}
      <g className="mapbird" aria-hidden>
        <text x={pos[0] - 13} y={pos[1] - 8} style={{ fontSize: 26 }}>{emoji}</text>
      </g>
    </svg>
  );
}
