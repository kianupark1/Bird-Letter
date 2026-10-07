"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BIRDS } from "@/lib/birds";
import { formatMinutes } from "@/lib/geo";
import { Envelope, Magpie } from "@/components/Illustrations";
import { ONBOARDED_KEY } from "@/lib/letters";
import BirdIcon from "@/components/BirdIcon";

const LAST = 2;

export default function Onboarding() {
  const router = useRouter();
  const [i, setI] = useState(0);

  const finish = (to: string) => {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {}
    router.replace(to);
  };

  return (
    <main className="app onboarding">
      <button className="skip" onClick={() => finish("/")} aria-label="건너뛰기">건너뛰기</button>

      <section className="slide" aria-live="polite">
        {i === 0 && (
          <>
            <Magpie />
            <h1>소식은 날아서 와요</h1>
            <p className="proverb">“아침 까치가 울면 반가운 손님이 온다”</p>
            <p className="sub">새 편지는 실제 거리와 새의 속도만큼 걸려 도착하는 느린 편지예요. 기다리는 시간까지 선물이 돼요.</p>
          </>
        )}
        {i === 1 && (
          <>
            <h1>어떤 새를 보낼까요?</h1>
            <p className="sub">새마다 실제 비행 속도가 달라요. 서울에서 부산까지 걸리는 시간이에요. 아주 가끔은 길을 잃거나 나무에 걸려 늦어지기도 해요.</p>
            <div className="birdgrid">
              {BIRDS.map((b) => (
                <div key={b.id} className="birdcell">
                  <BirdIcon id={b.id} size={64} />
                  <b>{b.name}</b>
                  <small>시속 약 {b.kmh}km<br />{formatMinutes(b.minutesSeoulBusan)}</small>
                </div>
              ))}
            </div>
          </>
        )}
        {i === 2 && (
          <>
            <Envelope />
            <h1>첫 편지를 보내 볼까요?</h1>
            <p className="sub">받는 사람은 계정이 없어도 링크로 편지를 볼 수 있어요. 소중한 사람에게 새를 날려 보내세요.</p>
          </>
        )}
      </section>

      <div className="dots" aria-hidden>
        {[0, 1, 2].map((n) => <i key={n} className={n === i ? "on" : ""} />)}
      </div>

      {i < LAST ? (
        <button className="cta" onClick={() => setI(i + 1)}>다음</button>
      ) : (
        <button className="cta" onClick={() => finish("/send")}>첫 편지 쓰기</button>
      )}
      {i > 0 && <button className="ghost" onClick={() => setI(i - 1)}>이전</button>}
    </main>
  );
}
