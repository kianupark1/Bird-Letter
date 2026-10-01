import type { Route } from "@/lib/routes";

type Props = { route: Route; p: number; emoji: string };

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
    <svg className="map" viewBox="0 0 300 220" role="img" aria-label={`${route.title} 여정 지도`}>
      <path className="route-line" d={toPath(pts)} />
      <path className="route-done" d={toPath(done)} />
      {route.points.map((pt) => (
        <g key={pt.name}>
          <circle cx={pt.xy[0]} cy={pt.xy[1]} r="4" fill="var(--hwangto)" />
          <text x={pt.xy[0] + 8} y={pt.xy[1] + 3}>{pt.name}</text>
        </g>
      ))}
      <text x={pos[0] - 10} y={pos[1] - 6} style={{ fontSize: 20 }}>{emoji}</text>
    </svg>
  );
}
