"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function DashboardNavbar() {
  const searchParams = useSearchParams();
  const params = searchParams.toString();
  const baseDashboard = params ? `/dashboard?${params}` : "/dashboard";
  const dashboardLinks = [
    ["Overview", baseDashboard],
    ["Tasks", `${baseDashboard}#tasks`],
    ["Referrals", `${baseDashboard}#referrals`],
    ["Leaderboard", "/leaderboard"],
  ] as const;

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-bg/80 backdrop-blur-sm">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
        <Link
          href={baseDashboard}
          className="font-display text-xl font-bold tracking-wide"
        >
          QUEST
        </Link>

        <div className="flex items-center gap-7">
          {dashboardLinks.map(([label, href]) => (
            <Link
              key={label}
              href={href}
              className="text-sm text-muted transition hover:text-white"
            >
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
