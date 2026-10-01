"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "홈", icon: "🏠" },
  { href: "/send", label: "편지 쓰기", icon: "✉️" },
  { href: "/settings", label: "설정", icon: "⚙️" },
];

export default function BottomNav() {
  const path = usePathname();
  if (path.startsWith("/onboarding")) return null;
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
