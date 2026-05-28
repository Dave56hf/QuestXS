"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, Copy, ExternalLink, Check } from "lucide-react";
import Card from "@/components/ui/Card";
import { MacDots } from "@/components/dashboard/MacDots";
import Button from "@/components/ui/Button";
import WalletConnectButton from "@/components/dashboard/WalletConnectButton";

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

interface TaskInfo {
  type: string;
  name: string;
  points: number;
  action: "external" | "verify" | "wallet" | "auto";
  url?: string;
  twitterHandle?: string;
}

interface TaskCompletionResponse {
  alreadyCompleted?: boolean;
  newTotal: number;
  pointsAwarded: number;
  rank: number;
  error?: string;
}

const TASKS: TaskInfo[] = [
  {
    type: "join_waitlist",
    name: "Join Waitlist",
    points: 100,
    action: "auto",
  },
  {
    type: "follow_x",
    name: "Follow @Questcac",
    points: 75,
    action: "external",
    url: "https://x.com/Questcac",
  },
  {
    type: "retweet",
    name: "Retweet Pinned Post",
    points: 100,
    action: "external",
    url: "https://twitter.com/QuestXS",
  },
  {
    type: "discord",
    name: "Join Discord",
    points: 75,
    action: "external",
    url: "https://discord.gg/quest",
  },
  {
    type: "wallet",
    name: "Connect Wallet",
    points: 300,
    action: "wallet",
  },
  {
    type: "refer_5",
    name: "Refer 5 Friends",
    points: 500,
    action: "auto",
  },
  {
    type: "refer_10",
    name: "Refer 10 Friends",
    points: 1500,
    action: "auto",
  },
];

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
    <div className="space-y-4 px-6 py-24 lg:px-8">
      <div className="grid gap-6 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-none border border-border bg-surface/50 p-6 h-64"
          />
        ))}
      </div>
      <div className="animate-pulse rounded-none border border-border bg-surface/50 p-6 h-96" />
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");

  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());
  const [externalTaskOpened, setExternalTaskOpened] = useState<Set<string>>(
    new Set(),
  );
  const [verifyingTasks, setVerifyingTasks] = useState<Set<string>>(new Set());
  const [taskError, setTaskError] = useState("");

  useEffect(() => {
    async function bootstrapAndLoad() {
      try {
        // Prefer URL code; if missing, try localStorage (legacy bootstrap).
        let resolvedCode = code;
        if (!resolvedCode) {
          const storedCode =
            typeof window !== "undefined"
              ? window.localStorage.getItem("questxs_dashboard_code")
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
          setCompletedTasks(new Set(u.completed_tasks || []));
          return;
        }

        // If no mapping exists yet, bootstrap using URL/localStorage referral code.
        if (!resolvedCode) {
          router.push("/waitlist");
          return;
        }

        window.localStorage.setItem("questxs_dashboard_code", resolvedCode);

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
        setCompletedTasks(new Set(u.completed_tasks || []));
      } catch (err) {
        console.error("Failed to load dashboard:", err);
        setError("Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    }

    setLoading(true);
    setError("");
    bootstrapAndLoad();
  }, [code, router]);

  function applyTaskCompletion(taskType: string, data: TaskCompletionResponse) {
    setCompletedTasks((current) => {
      const next = new Set(current);
      next.add(taskType);
      return next;
    });
    setExternalTaskOpened((current) => {
      const next = new Set(current);
      next.delete(taskType);
      return next;
    });
    setUser((current) =>
      current
        ? {
            ...current,
            total_points: data.newTotal,
            rank: data.rank,
            completed_tasks: [
              ...new Set([...(current.completed_tasks || []), taskType]),
            ],
          }
        : current,
    );
  }

  async function handleTaskVerify(taskType: string) {
    if (!user) return;
    if (completedTasks.has(taskType) || verifyingTasks.has(taskType)) return;

    setTaskError("");
    setVerifyingTasks((current) => {
      const next = new Set(current);
      next.add(taskType);
      return next;
    });

    try {
      const response = await fetch("/api/tasks/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          referralCode: user.referral_code,
          taskType,
        }),
      });

      const data = (await response.json()) as TaskCompletionResponse;

      if (!response.ok) {
        setTaskError(data.error ?? "Unable to verify task. Please try again.");
        return;
      }

      applyTaskCompletion(taskType, data);
      if (data.newTotal !== undefined) {
        await refreshSession();
      }
    } catch (err) {
      console.error("Failed to verify task:", err);
      setTaskError("Unable to verify task. Please try again.");
    } finally {
      setVerifyingTasks((current) => {
        const next = new Set(current);
        next.delete(taskType);
        return next;
      });
    }
  }

  function handleExternalLink(taskType: string, url: string) {
    window.open(url, "_blank");
    setExternalTaskOpened((current) => {
      const next = new Set(current);
      next.add(taskType);
      return next;
    });
  }

  async function refreshSession() {
    try {
      const response = await fetch("/api/session", {
        method: "GET",
        credentials: "same-origin",
      });
      if (!response.ok) return;
      const sessionData = (await response.json()) as {
        user: UserData | null;
      };
      if (!sessionData.user) return;
      const u = sessionData.user;
      setUser({ ...u, referrals: u.referrals ?? [] });
      setCompletedTasks(new Set(u.completed_tasks || []));
    } catch (err) {
      console.error("Failed to refresh session:", err);
    }
  }

  function copyReferralLink() {
    if (!user) return;
    const url = `${window.location.origin}/waitlist?ref=${user.referral_code}`;

    void navigator.clipboard
      .writeText(url)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
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
    <div id="overview" className="px-6 py-24 lg:px-8">
      {/* 3 Column Grid */}
      <div className="mb-12 grid gap-6 md:grid-cols-3">
        {/* Left Card - Points */}
        <Card className="p-6">
          <MacDots />
          <p className="text-xs font-display uppercase tracking-widest text-muted">
            Your Quest Points
          </p>
          <div className="mt-6 flex items-baseline gap-2">
            <div className="font-mono text-4xl font-bold text-accent">
              {user.total_points}
            </div>
            <span className="font-mono text-lg text-muted">QP</span>
          </div>

          <div className="mt-6 inline-block rounded-full border border-accent bg-accent/10 px-4 py-2">
            <p className="font-mono text-sm text-accent">Rank #{user.rank}</p>
          </div>

          <div className="mt-6">
            <div
              className={`inline-block rounded-full px-3 py-1 ${getTierBadgeClass(user.tier)}`}
            >
              <p className="font-mono text-xs uppercase">
                {user.tier === "LEGEND" ? "⚡ " : ""}
                {user.tier}
              </p>
            </div>
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <p className="text-xs italic text-muted leading-relaxed">
              Quest Points are accumulating. Early contributors will be the
              first to benefit from what&apos;s coming. Points will matter.
              That&apos;s all we&apos;ll say for now.
            </p>
          </div>
        </Card>

        {/* Center Card - Referral Link */}
        <Card id="referrals" className="p-6">
          <MacDots />
          <p className="text-xs font-display uppercase tracking-widest text-muted">
            Your Referral Link
          </p>

          <div className="mt-6">
            <p className="font-mono text-2xl font-bold text-accent">
              {user.referral_code}
            </p>
          </div>

          <p className="mt-4 break-all font-mono text-xs text-muted">
            quest-xs.vercel.app/waitlist?ref={user.referral_code}
          </p>

          <Button
            variant="primary"
            className="mt-6 w-full"
            onClick={copyReferralLink}
          >
            {copied ? (
              <>
                <Check className="mr-2 inline h-4 w-4" /> Copied! ✓
              </>
            ) : (
              <>
                <Copy className="mr-2 inline h-4 w-4" /> Copy Referral Link
              </>
            )}
          </Button>

          <div className="mt-6 border-t border-border pt-6">
            <p className="font-mono text-sm text-muted">
              {user.referral_count} trader{user.referral_count !== 1 ? "s" : ""}{" "}
              joined via your link
            </p>
            <p className="mt-3 text-xs text-muted">
              Earn 250 QP for every trader you bring in. Bonus points at 5 and
              10 referrals.
            </p>
            {user.referrals.length > 0 && (
              <div className="mt-5 space-y-2 border-t border-border pt-5">
                {user.referrals.slice(0, 5).map((referral) => (
                  <div
                    key={referral.display}
                    className="flex justify-between gap-4 text-xs"
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
            )}
          </div>
        </Card>

        {/* Right Card - Points Breakdown */}
        <Card className="p-6">
          <MacDots />
          <p className="text-xs font-display uppercase tracking-widest text-muted">
            Points Breakdown
          </p>

          <div className="mt-6 space-y-3">
            {[
              { action: "Join Waitlist", points: 100 },
              { action: "Refer 1 person", points: 250 },
              { action: "Connect wallet", points: 300 },
              { action: "Follow @QuestXS", points: 75 },
              { action: "Retweet pinned post", points: 100 },
              { action: "Join Discord", points: 75 },
              { action: "Refer 5 bonus", points: 500 },
              { action: "Refer 10 bonus", points: 1500 },
            ].map((item) => (
              <div key={item.action} className="flex justify-between text-sm">
                <span className="text-muted">{item.action}</span>
                <span className="font-mono text-accent">+{item.points}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-border pt-6">
            <div className="flex justify-between">
              <span className="font-display font-semibold">Total</span>
              <span className="font-mono text-lg font-bold text-accent">
                {user.total_points} QP
              </span>
            </div>
          </div>
        </Card>
      </div>

      {/* Task Checklist Card */}
      <Card className="p-6">
        <MacDots />
        <h2 className="font-display text-xl font-semibold">
          Complete Tasks. Earn QP.
        </h2>
        <p className="mt-2 text-xs text-muted">Each task is one-time only.</p>
        {taskError && <p className="mt-4 text-xs text-danger">{taskError}</p>}

        <div className="mt-8 space-y-4">
          {TASKS.map((task) => {
            const isCompleted = completedTasks.has(task.type);
            const isExternalOpened = externalTaskOpened.has(task.type);
            const isVerifying = verifyingTasks.has(task.type);

            return (
              <div
                key={task.type}
                className="flex items-center justify-between rounded-lg border border-border/50 bg-surface/30 p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-6 w-6 items-center justify-center rounded border border-border">
                    {isCompleted && (
                      <CheckCircle2 className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="font-display text-sm font-semibold">
                      {task.name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="rounded-full border border-accent bg-accent/10 px-3 py-1">
                    <p className="font-mono text-xs text-accent">
                      +{task.points} QP
                    </p>
                  </div>

                  {isCompleted ? (
                    <span className="font-mono text-xs text-accent">
                      Completed
                    </span>
                  ) : task.action === "auto" ? (
                    <span className="font-mono text-xs text-muted">
                      Auto-tracked
                    </span>
                  ) : task.action === "wallet" ? (
                    <WalletConnectButton
                      isCompleted={isCompleted}
                      onConnect={async (address) => {
                        if (completedTasks.has(task.type)) return;

                        setTaskError("");
                        setVerifyingTasks((current) => {
                          const next = new Set(current);
                          next.add(task.type);
                          return next;
                        });

                        try {
                          const response = await fetch("/api/user/wallet", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              referralCode: user.referral_code,
                              walletAddress: address,
                            }),
                          });
                          const data =
                            (await response.json()) as TaskCompletionResponse;

                          if (!response.ok) {
                            setTaskError(
                              data.error ??
                                "Unable to verify wallet. Please try again.",
                            );
                            return;
                          }

                          applyTaskCompletion(task.type, data);
                          if (data.newTotal !== undefined) {
                            await refreshSession();
                          }
                        } catch (err) {
                          console.error("Failed to save wallet:", err);
                          setTaskError(
                            "Unable to verify wallet. Please try again.",
                          );
                        } finally {
                          setVerifyingTasks((current) => {
                            const next = new Set(current);
                            next.delete(task.type);
                            return next;
                          });
                        }
                      }}
                    />
                  ) : task.action === "external" ? (
                    <div className="flex gap-2">
                      <Button
                        variant="primary"
                        className="text-xs"
                        onClick={() =>
                          handleExternalLink(task.type, task.url || "")
                        }
                      >
                        <ExternalLink className="mr-1 inline h-3 w-3" />
                        {task.type === "follow_x"
                          ? "Follow on X →"
                          : task.type === "retweet"
                            ? "Retweet →"
                            : "Join Discord →"}
                      </Button>
                      {isExternalOpened && (
                        <Button
                          variant="outline"
                          className="text-xs"
                          disabled={isVerifying}
                          onClick={() => handleTaskVerify(task.type)}
                        >
                          {isVerifying ? "Verifying..." : "Verify"}
                        </Button>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-8 rounded-lg border border-accent/20 bg-accent/5 p-4 text-center">
          <p className="font-display text-sm italic text-muted">
            Quest Points will matter. Season 1 is live. Stay tuned.
          </p>
        </div>
      </Card>
    </div>
  );
}
