"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { IS_TOSS } from "@/lib/target";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/send", label: "편지 쓰기", icon: "✉️" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export default function BottomNav() {
  const path = usePathname();
  if (IS_TOSS) return null; // 토스 빌드는 토스 내비게이션 바를 쓴다
  if (path.startsWith("/onboarding") || path.startsWith("/welcome")) return null;
  return (
    <nav className="bottomnav" aria-label="메뉴">
      {TABS.map((t) => (
        <Link key={t.href} href={t.href} aria-current={path === t.href ? "page" : undefined}>
          <span aria-hidden>{t.icon}</span>
          {t.label}
        </Link>
      ))}
    </nav>
  );
}
