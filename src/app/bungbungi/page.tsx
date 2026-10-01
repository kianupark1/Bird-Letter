import Link from "next/link";
import { IS_TOSS } from "@/lib/target";
import { BIRDS, REFERENCE_KM } from "@/lib/birds";
import { ROUTES } from "@/lib/routes";
import { formatMinutes, travelMinutes } from "@/lib/geo";

export const metadata = { title: "붕붕이 · 새 편지" };

export default function Bungbungi() {
  const bird = BIRDS.find((b) => b.id === "bungbungi")!;
  return (
    <main className="app">
      <div className="bung-hero" aria-hidden>
        <span className="bung-copter">{bird.emoji}</span>
      </div>
      <h1>붕붕이</h1>
      <p className="sub">새인 줄 알았죠? 프로펠러 달린 드론 새예요. 약속 시간은 칼같이 지켜요.</p>

      <h2>한눈에 보기</h2>
      <div className="stats">
        <div><b>약 {bird.minutesSeoulBusan}분</b><span>서울 → 부산 ({REFERENCE_KM}km)</span></div>
        <div><b>재미</b><span>마스코트 새</span></div>
      </div>

      <h2>노선별 도착 시간</h2>
      <div className="list">
        {ROUTES.map((r) => (
          <div key={r.id} className="listrow">
            <span>{r.title} <span className="note">· {r.km}km</span></span>
            <b className="time">{formatMinutes(travelMinutes(bird, r.km))}</b>
          </div>
        ))}
      </div>

      <h2>붕붕이는요</h2>
      <div className="paper" style={{ marginTop: 0 }}>
        {"· 배터리 걱정은 붕붕이도 해요. 그래도 이 노선은 한 번에 날아가요.\n· 날 때 “붕붕” 소리가 나요. 도착하면 조용히 편지를 내려놓아요.\n· 매보다는 느리지만 두루미보다는 훨씬 빨라요."}
      </div>

      <Link href="/send?bird=bungbungi" className="cta">붕붕이로 편지 보내기</Link>
      {!IS_TOSS && <Link href="/" className="ghost">홈으로</Link>}
    </main>
  );
}
