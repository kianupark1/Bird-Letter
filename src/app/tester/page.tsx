import Link from "next/link";
import BirdIcon from "@/components/BirdIcon";
import { TESTER } from "@/lib/release";

export const metadata = {
  title: "새 편지 안드로이드 테스터 12분을 찾아요",
  description: "구글 플레이 출시 전에 2주 동안 먼저 써 주실 분을 찾아요. 안드로이드 폰과 구글 계정만 있으면 돼요.",
  openGraph: {
    title: "새 편지 안드로이드 테스터 12분을 찾아요 🕊",
    description: "구글 플레이 출시 전에 2주 동안 먼저 써 주실 분을 찾아요.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
    locale: "ko_KR",
    type: "website" as const,
  },
};

const STEPS = [
  { n: "1", title: "테스터 모임에 가입해요", desc: "아래 버튼으로 구글 그룹에 들어와요. 구글 계정으로 한 번만 누르면 돼요." },
  { n: "2", title: "앱을 받아요", desc: "테스트가 열리면 참여 링크에서 ‘테스터 되기’를 누르고, 플레이 스토어에서 새 편지를 설치해요." },
  { n: "3", title: "2주만 지우지 말아 주세요", desc: "14일 동안 앱이 폰에 있어야 출시할 수 있어요. 편지 한 통 보내 주시면 더 고마워요." },
];

/**
 * 안드로이드 테스터 모집 화면(2026-10-26, 대표님: "테스터 모으는 기준으로 시작해보자").
 * 우리가 이메일·번호를 받지 않아요: 테스터는 구글 그룹에 스스로 가입하고, 구글이 그 그룹을 테스터 명단으로 써요.
 */
export default function Tester() {
  return (
    <main className="app tester">
      <div className="saekdong" aria-hidden />
      <BirdIcon id="magpie" size={120} letter className="bob" />
      <h1>안드로이드 테스터<br />12분을 찾아요</h1>
      <p className="sub">구글 플레이 출시 전에 2주 동안 먼저 써 주실 분을 찾고 있어요.<br />안드로이드 폰과 구글 계정만 있으면 돼요.</p>

      <ol className="tsteps">
        {STEPS.map((s) => (
          <li key={s.n}><span className="tn">{s.n}</span><span><b>{s.title}</b><br />{s.desc}</span></li>
        ))}
      </ol>

      <div className="tbtns">
        {TESTER.optIn && <a className="sbtn sms" href={TESTER.optIn}><span aria-hidden>📲</span> 테스트 참여하기</a>}
        {TESTER.group
          ? <a className="sbtn kakao" href={TESTER.group}><span aria-hidden>🙋</span> 테스터 모임 가입하기</a>
          : <p className="tsoon">가입 버튼은 곧 열려요 · 먼저 저에게 “할게요”라고 알려 주세요</p>}
      </div>

      <div className="tnote">
        <p><b>아이폰을 쓰시나요?</b> 앱스토어 앱이 먼저 나와요. 그동안은 <Link href="/">웹으로 바로 써 볼 수 있어요</Link>.</p>
        <p>테스터 모임은 구글 그룹이라 새 편지는 이메일·전화번호를 따로 받지 않아요. 불편한 점을 알려 주시면 바로 고칠게요.</p>
      </div>
    </main>
  );
}
