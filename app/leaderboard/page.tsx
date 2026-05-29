"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Card from "@/components/ui/Card";
import { API_LIMITS, QUESTXS_APP } from "@/lib/config";

interface LeaderboardEntry {
  rank: number;
  display: string;
  referral_code: string;
  total_points: number;
  tier: string;
}

function getTierBadgeClass(tier: string): string {
  switch (tier) {
    case "LEGEND":
      return "bg-accent/20 text-accent border border-accent/30 px-2 py-1 rounded-full text-xs font-mono uppercase";
    case "ELITE":
      return "bg-accent/10 text-accent/80 px-2 py-1 rounded-full text-xs font-mono uppercase";
    case "TOP 100":
      return "border border-border text-muted px-2 py-1 rounded-full text-xs font-mono uppercase";
    case "EARLY CONTRIBUTOR":
      return "text-muted px-2 py-1 rounded-full text-xs font-mono uppercase";
    default:
      return "text-muted/50 px-2 py-1 rounded-full text-xs font-mono uppercase";
  }
}

function getRankBorderClass(rank: number): string {
  if (rank === 1) return "border-l-4 border-l-accent";
  if (rank === 2) return "border-l-4 border-l-muted";
  if (rank === 3) return "border-l-4 border-l-border";
  return "";
}

function getInitialRankIcon(rank: number): string {
  if (rank === 1) return "⚡";
  return "";
}

function SkeletonLoader() {
  return (
    <div className="space-y-4 px-6 py-24 lg:px-8">
      <div className="animate-pulse space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-16 rounded-none border border-border bg-surface/50"
          />
        ))}
      </div>
    </div>
  );
}

export default function LeaderboardPage() {
  const searchParams = useSearchParams();
  const urlCode = searchParams.get("code");
  const [resolvedCode, setResolvedCode] = useState<string | null>(urlCode);

  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    const storedCode =
      typeof window !== "undefined"
        ? window.localStorage.getItem(QUESTXS_APP.dashboardCodeStorageKey)
        : null;

    if (!urlCode && storedCode) {
      setResolvedCode(storedCode);
    } else if (urlCode) {
      setResolvedCode(urlCode);
    }
  }, [urlCode]);

  useEffect(() => {
    async function fetchLeaderboard() {
      try {
        const response = await fetch(
          resolvedCode
            ? `/api/leaderboard?code=${encodeURIComponent(resolvedCode)}`
            : `/api/leaderboard`,
        );
        if (response.ok) {
          const data = (await response.json()) as LeaderboardEntry[];
          setLeaderboard(data);

          if (resolvedCode) {
            const userEntry = data.find(
              (u) => u.referral_code === resolvedCode,
            );
            if (userEntry) {
              setCurrentUserRank(userEntry.rank);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchLeaderboard();
  }, [resolvedCode]);

  if (loading) {
    return <SkeletonLoader />;
  }

  // Filter to show only top 100, plus current user if outside top 100
  let displayLeaderboard = leaderboard.slice(0, API_LIMITS.leaderboard);
  const currentUserData = leaderboard.find(
    (u) => u.referral_code === resolvedCode,
  );
  if (currentUserData && currentUserData.rank > API_LIMITS.leaderboard) {
    // Add current user to the display
    displayLeaderboard = [...displayLeaderboard, currentUserData];
  }

  return (
    <div className="px-6 py-24 lg:px-8">
      {/* Header Section */}
      <div className="mb-12 max-w-2xl">
        <p className="font-display text-xs uppercase tracking-widest text-accent">
          SEASON 1
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold">
          Quest Leaderboard
        </h1>
        <p className="mt-6 text-sm text-muted leading-relaxed">
          Points will matter. Early contributors will be the first to benefit
          from what&apos;s coming.
        </p>
      </div>

      {/* Live Stat Strip */}
      <div className="mb-8 flex items-center gap-2">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
        </span>
        <p className="font-mono text-sm text-muted">
          {leaderboard.length} traders competing
        </p>
      </div>

      {/* Season Banner */}
      <div className="mb-12 border-y border-border bg-surface px-6 py-4 text-center">
        <p className="font-display text-xs uppercase tracking-widest text-muted">
          Season 1 · Building on Base · Quest Points Accumulating · Stay Tuned
        </p>
      </div>

      {/* Leaderboard Table */}
      <Card className="overflow-hidden p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-border bg-surface/50">
              <tr>
                <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-widest text-muted">
                  Rank
                </th>
                <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-widest text-muted">
                  Trader
                </th>
                <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-widest text-muted">
                  Quest Points
                </th>
                <th className="px-6 py-4 text-left font-display text-xs uppercase tracking-widest text-muted">
                  Tier
                </th>
              </tr>
            </thead>
            <tbody>
              {displayLeaderboard.map((user, index) => {
                const isCurrentUser = user.referral_code === resolvedCode;
                const isOutsideTop100 = user.rank > 100;

                return (
                  <tr
                    key={`${user.referral_code}-${index}`}
                    className={`border-b border-border ${isCurrentUser ? "bg-accent/5" : index % 2 === 0 ? "bg-transparent" : "bg-surface/30"} ${getRankBorderClass(user.rank)} transition hover:bg-accent/10`}
                  >
                    <td className="px-6 py-4 font-mono">
                      <div className="flex items-center gap-2">
                        <span
                          className={`${
                            user.rank <= 3
                              ? "font-bold text-accent text-lg"
                              : user.rank <= 10
                                ? "text-accent"
                                : "text-muted"
                          }`}
                        >
                          {getInitialRankIcon(user.rank)}#{user.rank}
                        </span>
                        {isCurrentUser && (
                          <span className="rounded-full bg-accent px-2 py-1 text-xs font-semibold text-bg">
                            YOU
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm">{user.display}</td>
                    <td className="px-6 py-4 font-mono font-semibold text-accent">
                      {user.total_points} QP
                    </td>
                    <td className="px-6 py-4">
                      <span className={getTierBadgeClass(user.tier)}>
                        {user.tier === "LEGEND" ? "⚡ " : ""}
                        {user.tier}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
