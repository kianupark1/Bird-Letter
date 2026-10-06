"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IS_TOSS } from "@/lib/target";

const stroke = { fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" } as const;
const ICONS: Record<string, React.JSX.Element> = {
  home: <path {...stroke} d="M3.5 11 12 4l8.5 7M6 9.5V20h12V9.5M10 20v-5h4v5" />,
  send: <><rect {...stroke} x="3.5" y="6" width="17" height="12" rx="2" /><path {...stroke} d="m4 7 8 6 8-6" /></>,
  settings: <><circle {...stroke} cx="12" cy="12" r="3" /><path {...stroke} d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" /></>,
};
const TABS = [
  { href: "/", label: "홈", icon: "home" },
  { href: "/send", label: "편지 쓰기", icon: "send" },
  { href: "/settings", label: "설정", icon: "settings" },
];

export default function BottomNav() {
  const path = usePathname();
  if (IS_TOSS) return null; // 토스 빌드는 토스 내비게이션 바를 쓴다
  if (path.startsWith("/onboarding") || path.startsWith("/welcome")) return null;
  return (
    <nav className="bottomnav" aria-label="메뉴">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
          <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden>{ICONS[t.icon]}</svg>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
