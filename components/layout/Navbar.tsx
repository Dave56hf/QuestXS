"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import Button from "@/components/ui/Button";

const dashboardCodeStorageKey = "questxs_dashboard_code";

const links = [
  ["Features", "#features"],
  ["How It Works", "#how-it-works"],
  ["Benefits", "#benefits"],
  ["Roadmap", "#roadmap"],
  ["FAQ", "#faq"],
  ["Leaderboard", "/leaderboard"],
];

const dashboardLinks = [
  ["Overview", "/dashboard"],
  ["Leaderboard", "/leaderboard"],
];

export default function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [storedDashboardCode, setStoredDashboardCode] = useState<string | null>(
    () => {
      if (typeof window === "undefined") return null;
      return window.localStorage.getItem(dashboardCodeStorageKey);
    },
  );
  const isWaitlist = pathname === "/waitlist";
  const isDashboardNav =
    pathname.startsWith("/dashboard") || pathname.startsWith("/leaderboard");
  const dashboardCode = searchParams.get("code") ?? storedDashboardCode;
  const overviewHref = dashboardCode
    ? `/dashboard?code=${encodeURIComponent(dashboardCode)}`
    : "/dashboard";
  const leaderboardHref = dashboardCode
    ? `/leaderboard?code=${encodeURIComponent(dashboardCode)}`
    : "/leaderboard";
  const navLinks = isDashboardNav
    ? dashboardLinks.map(([label, href]) => [
        label,
        label === "Overview"
          ? overviewHref
          : label === "Leaderboard"
            ? leaderboardHref
            : href,
      ])
    : links.map(([label, href]) => [
        label,
        label === "Leaderboard" && dashboardCode
          ? `${href}?code=${encodeURIComponent(dashboardCode)}`
          : href,
      ]);

  useEffect(() => {
    const code = searchParams.get("code");

    if (code) {
      window.localStorage.setItem(dashboardCodeStorageKey, code);
      setStoredDashboardCode(code);
      return;
    }

    setStoredDashboardCode(
      window.localStorage.getItem(dashboardCodeStorageKey),
    );
  }, [searchParams]);

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link href="/" className="font-display text-xl font-bold tracking-wide">
          QUEST
        </Link>

        <div className="hidden items-center gap-7 md:flex">
          {isWaitlist ? (
            <Link
              href="/"
              className="text-sm text-muted transition hover:text-white"
            >
              Back to Home
            </Link>
          ) : (
            navLinks.map(([label, href]) => {
              const isRoute = href.startsWith("/");
              if (isRoute) {
                return (
                  <Link
                    key={label}
                    href={href}
                    className="text-sm text-muted transition hover:text-white"
                  >
                    {label}
                  </Link>
                );
              }
              return (
                <a
                  key={label}
                  href={href}
                  className="text-sm text-muted transition hover:text-white"
                >
                  {label}
                </a>
              );
            })
          )}
        </div>

        {!isDashboardNav && (
          <Button href="/waitlist" variant="outline" size="sm">
            Join Waitlist
          </Button>
        )}
      </nav>
    </header>
  );
}
