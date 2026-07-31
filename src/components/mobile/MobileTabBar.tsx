"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Compass, Plus, Users, UserPlus } from "lucide-react";

const tabs = [
  { href: "/", label: "For You", icon: Home },
  { href: "/events", label: "Discover", icon: Compass },
  { href: "/survey", label: "", icon: Plus, fab: true },
  { href: "/#tribes", label: "Tribes", icon: Users },
  { href: "/#waitlist", label: "Join", icon: UserPlus },
];

// App-style bottom navigation, mobile only.
export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* Spacer so page content clears the fixed bar */}
      <div className="h-20 md:hidden" aria-hidden />
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-ink-900/95 pb-[env(safe-area-inset-bottom)] md:hidden"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-md items-center justify-around px-2 py-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const active =
              t.href === "/"
                ? pathname === "/"
                : pathname.startsWith(t.href.split("#")[0]) &&
                  t.href !== "/" &&
                  !t.href.includes("#");
            if (t.fab) {
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-label="Help shape SoMingle"
                  className="-mt-7 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand-gradient shadow-lg shadow-brand-purple/40"
                >
                  <Icon size={26} className="text-white" />
                </Link>
              );
            }
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex min-w-[56px] flex-col items-center gap-1 rounded-xl px-2 py-1 text-[11px] font-medium transition-colors ${
                  active ? "text-brand-pink" : "text-white/55 hover:text-white"
                }`}
              >
                <Icon size={20} />
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
