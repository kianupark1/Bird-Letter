import Link from "next/link";
import { BIRDS_SLOW_TO_FAST, REFERENCE_KM } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { Magpie } from "@/components/Illustrations";
import BirdIcon from "@/components/BirdIcon";
import { ROUTES } from "@/lib/routes";
import { STORE } from "@/lib/release";

const SLOGAN = "기다림도 소통의 일부입니다.";

export const metadata = {
  title: "새 편지 — 카톡 말고, 새가 물어다 주는 편지",
  description: "실제 거리만큼 새가 날아가서 도착하는 메신저. 사진은 폴라로이드로, 도착하면 두루마리처럼 펼쳐져요. 무료. 기다림도 소통의 일부입니다.",
  openGraph: {
    title: "새 편지 — 카톡 말고, 새가 물어다 주는 편지",
    description: "실제 거리만큼 새가 날아가서 도착하는 메신저. 무료 · 아이폰·안드로이드.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website" as const,
  },
};

const STEPS = [
  { n: "1", title: "새를 골라요", desc: "빠른 매·믿음직한 비둘기·느긋한 까치·제일 느린 참새, 4종의 새 중에서요." },
  { n: "2", title: "편지를 써요", desc: "내가 있는 곳과 받는 사람이 있는 곳을 고르고, 마음을 적어요. 길이는 마음대로예요." },
  { n: "3", title: "새가 날아가요", desc: "서울에서 부산까지 실제 거리만큼, 지도 위를 날아가는 모습을 볼 수 있어요." },
  { n: "4", title: "도착!", desc: "기다린 시간만큼 반가운 편지가 내려앉아요." },
];

export default function Welcome() {
  return (
    <main className="app welcome">
      <Magpie />
      <h1>카톡 말고, 새가 물어다 주는 편지</h1>
      <p className="sub">
        새편지는 실제 거리만큼 새가 날아가서 도착하는 메신저예요.
        날아오는 동안 지도로 같이 지켜보고, 도착하면 편지가 두루마리처럼 펼쳐져요.
      </p>
      <p className="proverb">{SLOGAN}</p>
      <div className="wl-cta">
        <a href={STORE.iosUrl} className="cta">🍎 아이폰 · 앱스토어에서 받기</a>
        <Link href="/" className="cta wl-android">🤖 안드로이드 · 지금 바로 시작</Link>
        <p className="small">안드로이드는 크롬에서 열고 메뉴의 '앱 설치'를 한 번 누르면 앱처럼 써요 · 무료</p>
      </div>

      <h2>이런 게 달라요</h2>
      <ul className="wl-feat">
        <li><b>🕊 진짜 거리만큼 날아가요</b><span>서울→부산 매 3시간 37분, 참새 11시간 36분. 보낸 사람·받는 사람이 지도로 같이 기다려요.</span></li>
        <li><b>📸 사진은 폴라로이드로</b><span>폴라로이드 틀에 담겨 가고, 도착하면 천천히 선명해져요. 폰에 저장도 돼요.</span></li>
        <li><b>💌 앱이 없는 사람에게도</b><span>엄마·친구가 앱이 없어도 링크로 날아오는 걸 보고, 도착하면 바로 열어요.</span></li>
        <li><b>🌏 모르는 누군가와 펜팔</b><span>진짜 이름 대신 펜팔 이름, 위치는 도시까지만. 만 14세 이상.</span></li>
      </ul>

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

      <h2>4종의 새</h2>
      <p className="small" style={{ marginTop: 0 }}>실제 새의 비행 속도를 바탕으로 날아가요. 서울 → 부산({REFERENCE_KM}km) 기준 소요 시간이에요. 아주 가끔(새마다 50~100통에 1번) 길을 잃거나 나무에 걸려 늦어질 수 있고, 편지는 꼭 도착해요.</p>
      <div className="birdgrid">
        {BIRDS_SLOW_TO_FAST.map((b) => (
          <div key={b.id} className="birdcell">
            <BirdIcon id={b.id} size={60} />
            <b>{b.name}</b>
            <small>시속 약 {b.kmh}km<br />{formatMinutes(b.minutesSeoulBusan)}</small>
          </div>
        ))}
      </div>

      <h2>전국 어디로든, 이런 길을 날아요</h2>
      <div className="list">
        {ROUTES.map((r) => (
          <div key={r.id} className="listrow">
            <span>{r.title}</span>
            <span className="note">{r.points.map((q) => q.name).join(" → ")}</span>
          </div>
        ))}
      </div>

      <div className="wl-cta" style={{ marginTop: 24 }}>
        <a href={STORE.iosUrl} className="cta">🍎 앱스토어에서 받기</a>
        <Link href="/" className="cta wl-android">🤖 안드로이드 · 지금 바로 시작</Link>
      </div>
      <p className="small" style={{ textAlign: "center" }}>{SLOGAN}</p>
      <div className="legal-links">
        <Link href="/privacy">개인정보 처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <Link href="/policy">운영정책</Link>
      </div>
    </main>
  );
}
