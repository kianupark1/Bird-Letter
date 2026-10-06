import Link from "next/link";
import type { ReactNode } from "react";
import { IS_BETA, LEGAL_DRAFT_DATE, OPERATOR } from "@/lib/release";

/** 개인정보 처리방침·이용약관·운영정책이 같이 쓰는 틀 */
export function LegalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="app">
      <h1>{title}</h1>
      <p className="sub">{IS_BETA ? `초안 ${LEGAL_DRAFT_DATE} · 정식 출시 전에 전문가 검토를 받아요` : `시행일 ${LEGAL_DRAFT_DATE}`}</p>
      {children}
      <div className="legal-links">
        <Link href="/privacy">개인정보 처리방침</Link>
        <Link href="/terms">이용약관</Link>
        <Link href="/policy">운영정책</Link>
      </div>
      <Link href="/settings" className="ghost">설정으로 돌아가기</Link>
    </main>
  );
}

/** 제목 + 본문 한 덩어리. 줄바꿈은 그대로 보여요. */
export function Sec({ h, children }: { h: string; children: ReactNode }) {
  return (
    <>
      <h2>{h}</h2>
      <div className="paper" style={{ marginTop: 0 }}>{children}</div>
    </>
  );
}

/** 운영자 문의처. 아직 비어 있으면 그렇다고 솔직하게 알려요. */
export function Contact() {
  if (!OPERATOR.name || !OPERATOR.email) return <>운영자 이름과 문의 이메일은 정식 출시 전에 이곳에 채워 넣어요.</>;
  return <>운영자: {OPERATOR.name}{"\n"}문의: {OPERATOR.email}</>;
}

/** 출시 전에 사람이 확인해야 할 항목(IS_BETA일 때만 보임) */
export function BetaChecklist({ items }: { items: string[] }) {
  if (!IS_BETA) return null;
  return (
    <Sec h="정식 출시 전에 확인할 것">
      {items.map((t) => `· ${t}`).join("\n")}
    </Sec>
  );
}
