"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import { MacDots } from "@/components/widgets/MacDots";

function tierForRank(rank: number) {
  if (rank <= 10) return { label: "LEGEND", style: "accent" };
  if (rank <= 50) return { label: "ELITE", style: "accentSoft" };
  if (rank <= 100) return { label: "TOP 100", style: "border" };
  if (rank <= 500) return { label: "EARLY CONTRIBUTOR", style: "mutedBorder" };
  return { label: "CONTRIBUTOR", style: "mutedBorder" };
}

function pulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
    </span>
  );
}

type UserStats = {
  display: string;
  total_points: number;
  rank: number;
  referral_code: string;
  completed_tasks: string[];
  referral_count: number;
  tier: string;
};

type TaskRow = {
  taskType: string;
  name: string;
  points: number;
  done: boolean;
  actionLabel?: string;
  verify?: boolean;
  externalUrl?: string;
};

export default function DashboardClient({ code }: { code: string }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserStats | null>(null);
  const [copied, setCopied] = useState(false);
  const [completing, setCompleting] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/user/${encodeURIComponent(code)}`);
        if (!res.ok) {
          throw new Error("Invalid referral code");
        }
        const data = (await res.json()) as UserStats;
        if (mounted) setUser(data);
      } catch (e) {
        if (mounted)
          setError(e instanceof Error ? e.message : "Unable to load user");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [code]);

  const referralUrl = useMemo(() => {
    const c = user?.referral_code ?? code;
    return `quest-xs.vercel.app/waitlist?ref=${encodeURIComponent(c)}`;
  }, [user, code]);

  const tasks: TaskRow[] = useMemo(() => {
    const completed = new Set(user?.completed_tasks ?? []);
    return [
      {
        taskType: "waitlist",
        name: "Join Waitlist",
        points: 100,
        done: true,
      },
      {
        taskType: "follow_x",
        name: "Follow @QuestXS on X",
        points: 75,
        done: completed.has("follow_x"),
        verify: true,
        actionLabel: "Verify",
        externalUrl: "https://x.com/QuestXS",
      },
      {
        taskType: "retweet",
        name: "Retweet pinned post",
        points: 100,
        done: completed.has("retweet"),
        verify: true,
        actionLabel: "Verify",
        externalUrl: "https://x.com/QuestXS/status/0",
      },
      {
        taskType: "discord",
        name: "Join Discord",
        points: 75,
        done: completed.has("discord"),
        verify: true,
        actionLabel: "Verify",
        externalUrl: "https://discord.gg/",
      },
      {
        taskType: "wallet",
        name: "Connect Wallet",
        points: 300,
        done: completed.has("wallet"),
        verify: false,
        actionLabel: "Connect",
      },
      {
        taskType: "referral_5",
        name: "Refer 5 friends",
        points: 500,
        done: completed.has("referral_5"),
      },
      {
        taskType: "referral_10",
        name: "Refer 10 friends",
        points: 1500,
        done: completed.has("referral_10"),
      },
    ];
  }, [user]);

  async function verifyTask(taskType: string) {
    if (!user) return;
    setCompleting(taskType);
    try {
      // TODO: Replace with API verification when X/Discord OAuth is implemented.
      const ok = window.confirm(
        "Confirm completion? Points will be added to your account.",
      );
      if (!ok) return;

      const res = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: user.referral_code, taskType }),
      });

      if (!res.ok) {
        throw new Error("Unable to complete task");
      }

      const data = (await res.json()) as {
        newTotal: number;
        pointsAwarded: number;
        rank: number;
      };

      // Re-fetch to keep completed_tasks accurate.
      const res2 = await fetch(`/api/user/${encodeURIComponent(code)}`);
      if (res2.ok) {
        const data2 = (await res2.json()) as UserStats;
        setUser(data2);
      } else {
        setUser((prev) =>
          prev
            ? { ...prev, total_points: data.newTotal, rank: data.rank }
            : prev,
        );
      }
    } catch (e) {
      console.error(e);
      // honor system: fail silently
    } finally {
      setCompleting(null);
    }
  }

  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // noop
    }
  }

  if (loading) {
    return (
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-6">
            <Skeleton className="h-3 w-40" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (error || !user) {
    return (
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <MacDots />
            <h2 className="font-display text-lg font-semibold">
              Unable to load your dashboard
            </h2>
            <p className="mt-2 text-sm text-muted">{error ?? "Invalid code"}</p>
            <div className="mt-4">
              <Button href="/waitlist" variant="outline" className="w-full">
                Join the waitlist
              </Button>
            </div>
          </Card>
        </div>
      </section>
    );
  }

  const rankTier = tierForRank(user.rank);
  const tierBadgeClass =
    rankTier.style === "accent"
      ? "border border-accent/30 bg-accent/20 text-black"
      : rankTier.style === "accentSoft"
        ? "border border-accent/20 bg-accent/10 text-accent"
        : rankTier.style === "border"
          ? "border border-border bg-transparent text-muted"
          : "border border-border bg-transparent text-muted";

  return (
    <section id="overview" className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="p-6">
            <MacDots />
            <div className="text-xs font-medium uppercase tracking-[0.32em] text-muted">
              Your Quest Points
            </div>
            <div className="mt-4 font-mono text-4xl font-semibold text-accent">
              {user.total_points} QP
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Badge>Rank #{user.rank}</Badge>
              <span
                className={`inline-flex items-center rounded-none border px-3 py-1 text-xs font-medium ${tierBadgeClass}`}
              >
                {rankTier.label}
              </span>
            </div>
            <div className="mt-6 border-t border-border/50 pt-4">
              <p className="text-sm italic leading-relaxed text-muted">
                Quest Points are accumulating. Early contributors will be the
                first to benefit from what&apos;s coming. Points will matter.
                That&apos;s all we&apos;ll say for now.
              </p>
            </div>
          </Card>

          <div id="referrals">
            <Card className="p-6">
              <MacDots />
              <div className="text-xs font-medium uppercase tracking-[0.32em] text-muted">
                Your Referral Link
              </div>
              <div className="mt-4 font-mono text-2xl font-semibold text-accent">
                {user.referral_code}
              </div>
              <div className="mt-2 font-mono text-xs text-muted">
                quest-xs.vercel.app/waitlist?ref={user.referral_code}
              </div>

              <div className="mt-4">
                <Button className="w-full" onClick={copyReferral}>
                  {copied ? "Copied! ✓" : "Copy Referral Link"}
                </Button>
              </div>

              <div className="mt-4 text-sm text-muted">
                {user.referral_count} traders joined via your link
              </div>
              <div className="mt-2 text-xs text-muted">
                Earn 250 QP for every trader you bring in. Bonus points at 5 and
                10 referrals.
              </div>
            </Card>
          </div>

          <Card className="p-6">
            <MacDots />
            <div className="text-xs font-medium uppercase tracking-[0.32em] text-muted">
              Points Breakdown
            </div>
            <div className="mt-4 space-y-2">
              {tasks.map((t) => (
                <div
                  key={t.taskType}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="text-muted">{t.name}</div>
                  <div className="flex items-center gap-3">
                    {t.done ? (
                      <span className="text-accent">✓</span>
                    ) : (
                      <span className="text-muted">+{t.points} QP</span>
                    )}
                    <span className="font-mono text-sm">
                      {t.done ? `${t.points} QP` : `+${t.points} QP`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border/50 pt-4 flex items-center justify-between">
              <div className="text-sm text-muted">Total</div>
              <div className="font-mono text-lg font-semibold text-accent">
                {user.total_points} QP
              </div>
            </div>
          </Card>
        </div>

        <div id="tasks">
          <Card className="mt-6 p-6">
            <MacDots />
            <div className="flex flex-col gap-1 md:flex-row md:items-end md:justify-between">
              <div>
                <h2 className="font-display text-xl font-semibold">
                  Complete Tasks. Earn QP.
                </h2>
                <p className="mt-1 text-sm text-muted">
                  Each task is one-time only.
                </p>
              </div>
            </div>

            <div className="mt-5 space-y-3">
              {tasks.map((t) => {
                const isAuto =
                  t.taskType === "referral_5" || t.taskType === "referral_10";
                const showVerify = t.verify && !t.done;
                const showCompleted = t.done;

                return (
                  <div
                    key={t.taskType}
                    className="flex flex-col gap-3 rounded-none md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`h-5 w-5 rounded-none border ${t.done ? "border-accent" : "border-border"} flex items-center justify-center text-accent text-xs`}
                      >
                        {showCompleted ? "✓" : ""}
                      </span>
                      <div>
                        <div className="text-sm">{t.name}</div>
                        {t.taskType === "waitlist" ? null : null}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="inline-flex items-center rounded-none border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent font-mono">
                        +{t.points} QP
                      </span>

                      {t.taskType === "waitlist" && (
                        <span className="text-sm text-accent">Completed</span>
                      )}

                      {isAuto && !t.done && (
                        <span className="text-sm text-muted">Auto-tracked</span>
                      )}
                      {isAuto && t.done && (
                        <span className="text-sm text-accent">Completed</span>
                      )}

                      {showVerify && (
                        <div className="flex items-center gap-2">
                          <a
                            href={t.externalUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-accent underline underline-offset-4"
                          >
                            {t.name.includes("Follow")
                              ? "Follow on X →"
                              : t.name.includes("Retweet")
                                ? "Retweet →"
                                : "Join Discord →"}
                          </a>
                          <Button
                            size="sm"
                            className="h-8 px-3"
                            variant="outline"
                            disabled={completing === t.taskType}
                            onClick={() => verifyTask(t.taskType)}
                          >
                            {completing === t.taskType
                              ? "Verifying..."
                              : "Verify"}
                          </Button>
                        </div>
                      )}

                      {t.taskType === "wallet" && (
                        <Button
                          size="sm"
                          className="h-8 px-3"
                          variant="outline"
                          onClick={() => {
                            // TODO: integrate wagmi/viem and call /api/tasks/complete on successful connect
                            window.alert(
                              "Wallet connect integration coming next.",
                            );
                          }}
                        >
                          Connect Wallet
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 rounded-none border-t border-accent/20 bg-accent/5 px-4 py-5 text-center text-sm italic text-muted">
              Quest Points will matter. Season 1 is live. Stay tuned.
            </div>
          </Card>
        </div>
      </div>
    </section>
  );
}
