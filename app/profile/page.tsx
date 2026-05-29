"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, Copy } from "lucide-react";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import { MacDots } from "@/components/dashboard/MacDots";
import {
  getReferralLink,
  QUESTXS_APP,
  QUEST_TASKS,
  REFERRAL_MILESTONES,
  TIERS,
  TOTAL_TASK_POINTS,
} from "@/lib/config";

interface UserData {
  display: string;
  total_points: number;
  rank: number;
  referral_code: string;
  completed_tasks: string[];
  referral_count: number;
  referrals: {
    display: string;
    points_awarded: number;
  }[];
  tier: string;
}

function getTierBadgeClass(tier: string): string {
  switch (tier) {
    case "LEGEND":
      return "bg-accent/20 text-accent border border-accent/30";
    case "ELITE":
      return "bg-accent/10 text-accent/80";
    case "TOP 100":
      return "border border-border text-muted";
    case "EARLY CONTRIBUTOR":
      return "text-muted";
    default:
      return "text-muted/50";
  }
}

function SkeletonLoader() {
  return (
    <div className="space-y-6 px-6 py-24 lg:px-8">
      <div className="max-w-2xl space-y-4">
        <div className="h-4 w-24 animate-pulse rounded-none bg-surface/50" />
        <div className="h-10 w-72 animate-pulse rounded-none bg-surface/50" />
        <div className="h-5 w-96 max-w-full animate-pulse rounded-none bg-surface/50" />
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((item) => (
          <div
            key={item}
            className="h-28 animate-pulse rounded-none border border-border bg-surface/50"
          />
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="h-96 animate-pulse rounded-none border border-border bg-surface/50" />
        <div className="h-96 animate-pulse rounded-none border border-border bg-surface/50" />
      </div>
      <div className="h-40 animate-pulse rounded-none border border-border bg-surface/50" />
    </div>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<"code" | "link" | null>(null);

  useEffect(() => {
    async function bootstrapAndLoad() {
      try {
        // Prefer URL code; if missing, try localStorage (legacy bootstrap).
        let resolvedCode = code;
        if (!resolvedCode) {
          const storedCode =
            typeof window !== "undefined"
              ? window.localStorage.getItem(QUESTXS_APP.dashboardCodeStorageKey)
              : null;
          if (storedCode) resolvedCode = storedCode;
        }

        // Load identity from cookie-backed session.
        const sessionRes = await fetch("/api/session", {
          method: "GET",
          credentials: "same-origin",
        });
        if (!sessionRes.ok) {
          throw new Error("Failed to load session");
        }
        const sessionData = (await sessionRes.json()) as {
          user: UserData | null;
        };

        if (sessionData.user) {
          const u = sessionData.user;
          setUser({ ...u, referrals: u.referrals ?? [] });
          return;
        }

        // If no mapping exists yet, bootstrap using URL/localStorage referral code.
        if (!resolvedCode) {
          router.push("/waitlist");
          return;
        }

        window.localStorage.setItem(
          QUESTXS_APP.dashboardCodeStorageKey,
          resolvedCode,
        );

        const bootRes = await fetch("/api/identity/bootstrap", {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ referralCode: resolvedCode }),
        });

        if (!bootRes.ok) {
          router.push("/waitlist");
          return;
        }

        const sessionRes2 = await fetch("/api/session", {
          method: "GET",
          credentials: "same-origin",
        });
        if (!sessionRes2.ok) {
          router.push("/waitlist");
          return;
        }

        const sessionData2 = (await sessionRes2.json()) as {
          user: UserData | null;
        };

        if (!sessionData2.user) {
          router.push("/waitlist");
          return;
        }

        const u = sessionData2.user;
        setUser({ ...u, referrals: u.referrals ?? [] });
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    setError("");
    bootstrapAndLoad();
  }, [code, router]);

  const completedTasks = useMemo(
    () => new Set(user?.completed_tasks || []),
    [user?.completed_tasks],
  );
  const taskPointsEarned = QUEST_TASKS.reduce(
    (total, task) => total + (completedTasks.has(task.type) ? task.points : 0),
    0,
  );
  const completedTaskCount = QUEST_TASKS.filter((task) =>
    completedTasks.has(task.type),
  ).length;
  const progressPercent = Math.min(
    100,
    Math.round((taskPointsEarned / TOTAL_TASK_POINTS) * 100),
  );
  const remainingTasks = QUEST_TASKS.length - completedTaskCount;
  const dashboardHref = user
    ? `/dashboard?code=${encodeURIComponent(user.referral_code)}`
    : "/dashboard";

  function copyValue(type: "code" | "link") {
    if (!user) return;

    const value =
      type === "code"
        ? user.referral_code
        : getReferralLink(user.referral_code, window.location.origin);

    void navigator.clipboard
      .writeText(value)
      .then(() => {
        setCopied(type);
        setTimeout(() => setCopied(null), 2000);
      })
      .catch((err) => {
        console.error("Clipboard write failed:", err);
      });
  }

  if (loading) {
    return <SkeletonLoader />;
  }

  if (error || !user) {
    return (
      <div className="flex items-center justify-center px-6 py-24">
        <Card className="max-w-md text-center">
          <p className="text-danger">{error || "User not found"}</p>
          <Button
            variant="primary"
            className="mt-4 w-full"
            onClick={() => router.push("/waitlist")}
          >
            Back to Waitlist
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-6 py-24 lg:px-8">
      <div className="mb-12 max-w-2xl">
        <p className="font-display text-xs uppercase tracking-widest text-accent">
          Profile
        </p>
        <h1 className="mt-4 font-display text-4xl font-bold">
          {user.display}
        </h1>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span
            className={`rounded-full px-3 py-1 font-mono text-xs uppercase ${getTierBadgeClass(
              user.tier,
            )}`}
          >
            {user.tier === "LEGEND" ? "⚡ " : ""}
            {user.tier}
          </span>
          <span className="rounded-full border border-accent bg-accent/10 px-3 py-1 font-mono text-xs text-accent">
            Rank #{user.rank}
          </span>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        {[
          ["Quest Points", `${user.total_points} QP`],
          ["Global Rank", `#${user.rank}`],
          ["Referrals", user.referral_count.toString()],
          ["Tasks Done", `${completedTaskCount}/${QUEST_TASKS.length}`],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-none border border-border bg-surface p-5"
          >
            <p className="font-display text-xs uppercase tracking-widest text-muted">
              {label}
            </p>
            <p className="mt-4 font-mono text-2xl font-bold text-accent">
              {value}
            </p>
          </div>
        ))}
      </div>

      <Card className="mb-6 p-6">
        <MacDots />
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-display uppercase tracking-widest text-muted">
              Task Progress
            </p>
            <h2 className="mt-3 font-display text-xl font-semibold">
              {taskPointsEarned} of {TOTAL_TASK_POINTS} QP earned
            </h2>
          </div>
          <p className="font-mono text-sm text-accent">{progressPercent}%</p>
        </div>
        <div className="mt-6 h-3 rounded-none border border-border bg-bg">
          <div
            className="h-full rounded-none bg-accent"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card className="p-6">
          <MacDots />
          <p className="text-xs font-display uppercase tracking-widest text-muted">
            Referrals
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="border border-border bg-bg p-4">
              <p className="text-xs text-muted">Referral Code</p>
              <p className="mt-3 break-all font-mono text-xl font-bold text-accent">
                {user.referral_code}
              </p>
              <Button
                variant="outline"
                className="mt-4 w-full"
                onClick={() => copyValue("code")}
              >
                {copied === "code" ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Code
                  </>
                )}
              </Button>
            </div>
            <div className="border border-border bg-bg p-4">
              <p className="text-xs text-muted">Referral Link</p>
              <p className="mt-3 break-all font-mono text-xs text-muted">
                {getReferralLink(user.referral_code)}
              </p>
              <Button
                variant="primary"
                className="mt-4 w-full"
                onClick={() => copyValue("link")}
              >
                {copied === "link" ? (
                  <>
                    <Check className="h-4 w-4" /> Copied
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy Link
                  </>
                )}
              </Button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {REFERRAL_MILESTONES.map((milestone) => {
              const reached = user.referral_count >= milestone.referrals;
              return (
                <div
                  key={milestone.referrals}
                  className={`border p-4 ${
                    reached
                      ? "border-accent bg-accent/10"
                      : "border-border bg-surface/30"
                  }`}
                >
                  <p className="font-mono text-sm text-headline">
                    {milestone.referrals} referrals
                  </p>
                  <p className="mt-2 text-xs text-muted">
                    {reached ? "Milestone unlocked" : "Milestone pending"}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="font-display text-sm uppercase tracking-widest text-muted">
              Referred Traders
            </p>
            {user.referrals.length ? (
              <div className="mt-4 space-y-3">
                {user.referrals.map((referral) => (
                  <div
                    key={referral.display}
                    className="flex justify-between gap-4 border border-border/50 bg-surface/30 p-3 text-xs"
                  >
                    <span className="font-mono text-muted">
                      {referral.display}
                    </span>
                    <span className="font-mono text-accent">
                      +{referral.points_awarded} QP
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="mt-4 border border-border/50 bg-surface/30 p-4 text-sm text-muted">
                No referred traders yet.
              </p>
            )}
          </div>
        </Card>

        <Card className="p-6">
          <MacDots />
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-display uppercase tracking-widest text-muted">
                Task Activity
              </p>
              <h2 className="mt-3 font-display text-xl font-semibold">
                {completedTaskCount} of {QUEST_TASKS.length} complete
              </h2>
            </div>
            {remainingTasks > 0 && (
              <Button href={dashboardHref} variant="outline" size="sm">
                Open Dashboard
              </Button>
            )}
          </div>

          <div className="mt-6 space-y-3">
            {QUEST_TASKS.map((task) => {
              const isCompleted = completedTasks.has(task.type);
              return (
                <div
                  key={task.type}
                  className={`flex items-center justify-between gap-4 border p-4 ${
                    isCompleted
                      ? "border-accent bg-accent/10"
                      : "border-border/50 bg-surface/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-6 w-6 items-center justify-center rounded-none border border-border">
                      {isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-accent" />
                      )}
                    </div>
                    <div>
                      <p className="font-display text-sm font-semibold">
                        {task.name}
                      </p>
                      <p className="mt-1 font-mono text-xs text-muted">
                        +{task.points} QP
                      </p>
                    </div>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 font-mono text-xs ${
                      isCompleted
                        ? "bg-accent text-bg"
                        : "border border-border text-muted"
                    }`}
                  >
                    {isCompleted ? "Done" : "Pending"}
                  </span>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <MacDots />
        <p className="text-xs font-display uppercase tracking-widest text-muted">
          Tier Progression
        </p>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {TIERS.map((tier) => {
            const isCurrent = tier.name === user.tier;
            return (
              <div
                key={tier.name}
                className={`border p-4 text-center ${
                  isCurrent
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border bg-surface/30 text-muted"
                }`}
              >
                <p className="font-display text-xs uppercase tracking-widest">
                  {tier.name}
                </p>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          Referral milestones add{" "}
          {REFERRAL_MILESTONES.map(
            (milestone) =>
              `${milestone.points} QP at ${milestone.referrals} referrals`,
          ).join(" and ")}
          .
        </p>
      </Card>
    </div>
  );
}
