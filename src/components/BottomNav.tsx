"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IS_TOSS } from "@/lib/target";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICONS: Record<string, React.JSX.Element> = {
  home: <path {...stroke} d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5" />,
  send: <><rect {...stroke} x="3.5" y="6" width="17" height="12" rx="2" /><path {...stroke} d="m4 7 8 6 8-6" /></>,
  friends: <><circle {...stroke} cx="9" cy="9" r="3" /><path {...stroke} d="M3.5 19c.5-3 2.6-4.5 5.5-4.5s5 1.5 5.5 4.5M16 6.5a3 3 0 0 1 0 5.5M18 14.8c1.7.5 2.7 1.9 3 4.2" /></>,
  pen: <><circle {...stroke} cx="12" cy="12" r="8.5" /><path {...stroke} d="M3.5 12h17M12 3.5c2.5 2.4 3.6 5.2 3.6 8.5s-1.1 6.1-3.6 8.5c-2.5-2.4-3.6-5.2-3.6-8.5s1.1-6.1 3.6-8.5z" /></>,
  rank: <><path {...stroke} d="M8 21h8M12 16v5M7 4h10v5a5 5 0 0 1-10 0V4z" /><path {...stroke} d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>,
  settings: <><circle {...stroke} cx="12" cy="12" r="3" /><path {...stroke} d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
};
// 하단 메뉴는 4개(편지·친구·펜팔·랭킹). 펜팔은 중요한 기능이라 따로 탭으로(2026-10-19). 내 정보·설정은 오른쪽 위 톱니바퀴(GearLink).
const TABS = [
  { href: "/", label: "편지", icon: "send" },
  { href: "/friends", label: "친구", icon: "friends" },
  { href: "/pen", label: "펜팔", icon: "pen" },
  { href: "/rank", label: "랭킹", icon: "rank" },
];

export default function BottomNav() {
  const path = usePathname();
  if (IS_TOSS) return null; // 토스 빌드는 토스 내비게이션 바를 쓴다
  // 목록 화면(탭)에서만 보여요(대화방·편지 쓰기·편지 읽기에서는 숨겨서 화면을 넓게 써요)
  if (!TABS.some((t) => t.href === path)) return null;
  return (
    <nav className="bottomnav" aria-label="메뉴">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} prefetch aria-current={path === t.href ? "page" : undefined}>
          <svg viewBox="0 0 24 24" width="30" height="30" aria-hidden>{ICONS[t.icon]}</svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
