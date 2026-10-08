import Link from "next/link";
import { BIRDS_SLOW_TO_FAST, REFERENCE_KM } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { Magpie } from "@/components/Illustrations";
import BirdIcon from "@/components/BirdIcon";
import { IS_BETA } from "@/lib/release";
import { ROUTES } from "@/lib/routes";

export const metadata = {
  title: "새 편지 — 소식은 날아서 와요",
  description: "실제 거리와 새의 비행 속도만큼 걸려 도착하는 한국형 슬로우 메시징. 체험판 공개 중.",
  openGraph: {
    title: "새 편지 — 소식은 날아서 와요",
    description: "실제 거리만큼 걸려 도착하는 느린 편지. 체험판 공개 중.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website" as const,
  },
};

const STEPS = [
  { n: "1", title: "새를 골라요", desc: "빠른 매부터 귀한 소식용 두루미까지, 6종의 새 중에서요." },
  { n: "2", title: "편지를 써요", desc: "내가 있는 곳과 받는 사람이 있는 곳을 고르고, 마음을 적어요. 길이는 마음대로예요." },
  { n: "3", title: "새가 날아가요", desc: "서울에서 부산까지 실제 거리만큼, 지도 위를 날아가는 모습을 볼 수 있어요." },
  { n: "4", title: "도착!", desc: "기다린 시간만큼 반가운 편지가 내려앉아요." },
];

export default function Welcome() {
  return (
    <main className="app welcome">
      {IS_BETA && <span className="beta">출시 준비 중 · 체험판</span>}
      <Magpie />
      <h1>소식은 날아서 와요</h1>
      <p className="proverb">“아침 까치가 울면 반가운 손님이 온다”</p>
      <p className="sub">
        새 편지는 실제 지리적 거리와 새의 비행 속도로 도착 시간이 정해지는 느린 편지 앱이에요.
        바로 보내는 메신저와 달리, 기다리는 시간까지 편지의 일부가 돼요.
      </p>
      <Link href="/" className="cta">먼저 체험해 보기</Link>

      <h2>이렇게 보내요</h2>
      <ol className="steplist">
        {STEPS.map((s) => (
          <li key={s.n}>
            <b>{s.n}</b>
            <div>
              <div className="name">{s.title}</div>
              <div className="note">{s.desc}</div>
            </div>
          </li>
        ))}
      </ol>

      <h2>6종의 새</h2>
      <p className="small" style={{ marginTop: 0 }}>실제 새의 비행 속도로 날아가요. 서울 → 부산({REFERENCE_KM}km) 기준 소요 시간이에요. 아주 가끔(새마다 50~100통에 1번) 길을 잃거나 나무에 걸려 늦어질 수 있고, 편지는 꼭 도착해요.</p>
      <div className="birdgrid">
        {BIRDS_SLOW_TO_FAST.map((b) => (
          <div key={b.id} className="birdcell">
            <BirdIcon id={b.id} size={60} />
            <b>{b.name}</b>
            <small>시속 약 {b.kmh}km<br />{formatMinutes(b.minutesSeoulBusan)}</small>
          </div>
        ))}
      </div>
      <Link href="/bungbungi" className="ghost">드론 새 마스코트, 붕붕이 만나기</Link>

      <h2>전국 어디로든, 이런 길을 날아요</h2>
      <div className="list">
        {ROUTES.map((r) => (
          <div key={r.id} className="listrow">
            <span>{r.title}</span>
            <span className="note">{r.points.map((q) => q.name).join(" → ")}</span>
          </div>
        ))}
      </div>

      <Link href="/" className="cta" style={{ marginTop: 24 }}>첫 편지 보내 보기</Link>
      <p className="small" style={{ textAlign: "center" }}>
        {IS_BETA ? "지금은 체험판이에요. " : ""}편지는 서버에 저장되고, 받는 사람은 링크로 열어요.
      </p>
      <div className="legal-links">
        <Link href="/privacy">개인정보 처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <Link href="/policy">운영정책</Link>
      </div>
    </main>
  );
}
