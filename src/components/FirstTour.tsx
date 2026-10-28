"use client";
/**
 * 처음 쓰는 사람을 위한 사용법 안내(2026-10-28, 대표님: "하나씩 누르면 설명해 주는 형식, 넘길 수 있는 옵션,
 * '사용법은 정말 쉽지만 간단히 알려 드릴까요?'라는 옵션").
 * 먼저 물어보고(건너뛰기 가능) → 화면의 진짜 버튼을 밝게 비추면서 한 장씩: 편지 보내기·새 종류·받는 곳·지도·초대·펜팔.
 * 새로 가입한 계정(환영 편지를 받는 계정)에게 한 번만, 설정의 "사용법 다시 보기"(/?tour=1)로 언제든 다시.
 */
import { useEffect, useLayoutEffect, useState } from "react";
import BirdIcon from "@/components/BirdIcon";
import { BIRDS_SLOW_TO_FAST } from "../../core/birds";
import { formatMinutes } from "../../core/geo";

const KEY = "saepyeonji.tour.v1";
export const tourDone = () => { try { return !!localStorage.getItem(KEY); } catch { return true; } };
const finish = (how: "done" | "skipped") => { try { localStorage.setItem(KEY, how); } catch {} };

type Step = { target?: string; icon: string; title: string; body: string; art?: "birds" | "place" | "end" };
const STEPS: Step[] = [
  { target: ".kfab", icon: "✉", title: "편지 보내기", body: "여기를 누르고 받을 사람 이름을 쓰면 바로 대화방이 열려요. 편지를 쓰고 ➤를 누르면 새가 날아가요." },
  { icon: "🕊", title: "새 고르기", body: "새마다 걸리는 시간이 달라요. 빠른 매는 몇 시간, 느긋한 까치는 하루가 넘게 걸려요. 오래 걸릴수록 더 설레요.", art: "birds" },
  { icon: "📍", title: "받는 곳", body: "처음 보낼 때 ‘어디 계세요?’가 나오면 도시 하나만 누르세요. 친구가 동네를 정해 두면 저절로 정해져요. 위치는 구까지만 써요.", art: "place" },
  { target: ".hcount", icon: "🗺", title: "지도로 같이 기다리기", body: "새가 지금 어디쯤 날고 있는지 보낸 사람도 받는 사람도 같이 봐요. 누르면 지도가 크게 열려요." },
  { target: '.bottomnav a[href="/friends"]', icon: "👥", title: "친구 초대", body: "친구 탭 오른쪽 위 [👤+]에서 카카오톡·문자로 초대해요. 친구가 링크를 누르고 가입하면 바로 친구가 돼요." },
  { target: '.bottomnav a[href="/pen"]', icon: "🌏", title: "펜팔", body: "모르는 누군가와 편지 친구가 될 수 있어요. 진짜 이름 대신 펜팔 이름과 도시만 보여요. (만 14세 이상)" },
  { icon: "🎉", title: "이제 시작해 볼까요?", body: "곧 새편지가 보낸 환영 편지가 도착해요. 도착하면 눌러서 펼쳐 보세요.", art: "end" },
];

type Rect = { top: number; left: number; width: number; height: number };
// 글씨 크기 설정 때문에 화면 전체가 확대·축소돼 있어요(body zoom) → 잰 자리를 그 배율로 나눠야 맞아요
const zoomOf = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--zoom")) || 1;

export default function FirstTour({ auto, welcomeSoon }: { auto: boolean; welcomeSoon?: boolean }) {
  const [phase, setPhase] = useState<"off" | "ask" | number>("off");
  const [rect, setRect] = useState<Rect | null>(null);

  useEffect(() => {
    const forced = new URLSearchParams(location.search).get("tour") === "1";
    if (forced) { setPhase("ask"); history.replaceState(history.state, "", location.pathname); return; }
    if (auto && !tourDone()) setPhase("ask");
  }, [auto]);

  const step = typeof phase === "number" ? STEPS[phase] : null;
  // 비출 버튼의 자리(화면이 바뀌거나 돌리면 다시 재요)
  useLayoutEffect(() => {
    if (!step?.target) { setRect(null); return; }
    const measure = () => {
      const el = document.querySelector(step.target!) as HTMLElement | null;
      if (!el) { setRect(null); return; }
      el.scrollIntoView({ block: "nearest" });
      const r = el.getBoundingClientRect(), z = zoomOf();
      setRect(r.width ? { top: r.top / z - 6, left: r.left / z - 6, width: r.width / z + 12, height: r.height / z + 12 } : null);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [step]);

  if (phase === "off") return null;
  const close = (how: "done" | "skipped") => { finish(how); setPhase("off"); };

  if (phase === "ask")
    return (
      <div className="tour-back" role="dialog" aria-modal="true" aria-label="사용법 안내">
        <div className="tour-card tour-ask">
          <div className="saekdong" aria-hidden />
          <BirdIcon id="magpie" size={96} letter className="bob" />
          <h2>새편지 사용법은 정말 쉬워요</h2>
          <p>1분만, 간단히 알려 드릴까요?</p>
          <button type="button" className="cta big tour-go" onClick={() => setPhase(0)}>네, 알려 주세요</button>
          <button type="button" className="tour-skip" onClick={() => close("skipped")}>괜찮아요, 바로 쓸게요</button>
        </div>
      </div>
    );

  const i = phase as number;
  const last = i === STEPS.length - 1;
  // 비추는 버튼이 화면 아래쪽이면 설명 카드는 위에, 위쪽이면 아래에
  const vh = window.innerHeight / zoomOf();
  const below = rect ? rect.top + rect.height / 2 < vh / 2 : false;
  const cardStyle: React.CSSProperties = rect
    ? below ? { top: Math.min(rect.top + rect.height + 14, vh - 260) } : { bottom: Math.max(vh - rect.top + 14, 16) }
    : { top: "50%", transform: "translateY(-50%)" };

  return (
    <div className={`tour-back${rect ? " clear" : ""}`} role="dialog" aria-modal="true" aria-label={`사용법 ${i + 1}/${STEPS.length}: ${step!.title}`}>
      {rect && <div className="tour-hole" style={rect} aria-hidden />}
      <div className="tour-card" style={cardStyle}>
        <div className="tour-top">
          <span className="tour-ic" aria-hidden>{step!.icon}</span>
          <b>{step!.title}</b>
          <span className="tour-n">{i + 1} / {STEPS.length}</span>
        </div>
        <p>{last && !welcomeSoon ? "편지가 도착하면 눌러서 펼쳐 보세요. 첫 편지는 가장 보고 싶은 사람에게!" : step!.body}</p>
        {step!.art === "birds" && (
          <div className="tour-birds">
            {[...BIRDS_SLOW_TO_FAST].reverse().map((b) => (
              <span key={b.id}><BirdIcon id={b.id} size={40} /><b>{b.name}</b><small>{formatMinutes(b.minutesSeoulBusan)}</small></span>
            ))}
            <em>서울 → 부산 기준</em>
          </div>
        )}
        {step!.art === "place" && (
          <div className="tour-place" aria-hidden>
            <span className="tq">○○님은 어디 계세요?</span>
            <span className="tc">{["서울", "부산", "대구", "인천", "광주", "대전"].map((c) => <i key={c}>{c}</i>)}</span>
          </div>
        )}
        {step!.art === "end" && <p className="tour-slogan">기다림도 소통의 일부입니다.</p>}
        <div className="tour-dots" aria-hidden>{STEPS.map((_, k) => <i key={k} className={k === i ? "on" : ""} />)}</div>
        <div className="tour-row">
          {!last && <button type="button" className="tour-skip" onClick={() => close("skipped")}>건너뛰기</button>}
          {i > 0 && <button type="button" className="tour-prev" onClick={() => setPhase(i - 1)}>이전</button>}
          <button type="button" className="cta tour-next" onClick={() => (last ? close("done") : setPhase(i + 1))}>{last ? "시작하기" : "다음"}</button>
        </div>
      </div>
    </div>
  );
}
