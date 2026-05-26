"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Skeleton from "@/components/ui/Skeleton";
import Button from "@/components/ui/Button";

function pulseDot() {
  return (
    <span className="relative flex h-2 w-2">
      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-60" />
      <span className="relative inline-flex rounded-full h-2 w-2 bg-accent" />
    </span>
  );
}

type Row = {
  rank: number;
  display: string;
  referral_code: string;
  total_points: number;
  tier: string;
};

type ApiRes = {
  rows: Row[];
  page?: number;
  pageSize?: number;
  totalPages?: number;
  totalCount?: number;
};

function tierBadgeClass(rank: number) {
  if (rank <= 10) return "border border-accent/30 bg-accent/20 text-accent";
  if (rank <= 50) return "border border-accent/20 bg-accent/10 text-accent";
  if (rank <= 100) return "border border-border bg-transparent text-muted";
  if (rank <= 500) return "border border-border bg-transparent text-muted";
  return "border border-transparent bg-transparent text-muted/60";
}

export default function LeaderboardClient({ code }: { code?: string }) {
  const [loading, setLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Row[]>([]);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState<number | null>(null);
  const [totalCount, setTotalCount] = useState<number | null>(null);

  const searchParams = useSearchParams();
  const router = useRouter();

  const PAGE_SIZE = 100;

  // Sync initial page from URL search params
  useEffect(() => {
    const p = parseInt(searchParams?.get("page") ?? "1", 10);
    if (!isNaN(p) && p > 0) setPage(p);
  }, [searchParams]);

  // Fetch leaderboard whenever `page` changes
  useEffect(() => {
    let mounted = true;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/leaderboard?page=${page}&pageSize=${PAGE_SIZE}`,
        );
        const data = (await res.json()) as ApiRes;

        if (!res.ok)
          throw new Error(
            data && (data as any).error
              ? (data as any).error
              : "Unable to load leaderboard",
          );
        if (mounted) {
          setRows(data.rows ?? []);
          setTotalPages(
            data.totalPages ??
              (data.totalCount ? Math.ceil(data.totalCount / PAGE_SIZE) : null),
          );
          setTotalCount(data.totalCount ?? null);
        }
      } catch (e) {
        if (mounted)
          setError(
            e instanceof Error ? e.message : "Unable to load leaderboard",
          );
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [page]);

  const goToPage = (p: number) => {
    if (p < 1) return;
    if (totalPages && p > totalPages) return;
    setPage(p);
    try {
      router.replace(`?page=${p}`);
    } catch (e) {
      // ignore
    }
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  if (loading) {
    return (
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <Card className="p-6">
            <Skeleton className="h-6 w-64" />
            <div className="mt-6 space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
            </div>
          </Card>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-6 py-24 lg:px-8">
        <div className="mx-auto max-w-2xl">
          <Card className="p-6">
            <h2 className="font-display text-lg font-semibold">
              Unable to load leaderboard
            </h2>
            <p className="mt-2 text-sm text-muted">{error}</p>
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

  const highlightedCode = code;

  return (
    <section className="px-6 py-24 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex items-start justify-between gap-6">
          <div className="max-w-3xl">
            <div className="text-xs font-medium uppercase tracking-[0.32em] text-accent">
              <span className="">&#47;&#47; SEASON 1</span>
            </div>
            <h1 className="mt-3 font-display text-3xl font-bold">
              Quest Leaderboard
            </h1>
            <p className="mt-2 text-sm text-muted">
              Points will matter. Early contributors will be the first to
              benefit from what&apos;s coming.
            </p>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted">
            {pulseDot()}
            <span>{rows.length || 0} traders competing</span>
          </div>
        </div>

        <div className="mt-6 rounded-none border-t border-border bg-surface px-6 py-4 text-center">
          <div className="text-xs uppercase tracking-[0.24em] text-muted">
            Season 1 · Building on Base · Quest Points Accumulating · Stay Tuned
          </div>
        </div>

        <Card className="mt-6 p-0">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead className="border-b border-border/50">
                <tr className="text-xs uppercase tracking-[0.2em] text-muted">
                  <th className="px-4 py-3">Rank</th>
                  <th className="px-4 py-3">Trader</th>
                  <th className="px-4 py-3">Quest Points</th>
                  <th className="px-4 py-3">Tier</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const isYou =
                    highlightedCode && r.referral_code === highlightedCode;
                  const leftBorder =
                    r.rank === 1
                      ? "border-l-accent"
                      : r.rank === 2
                        ? "border-l-muted"
                        : r.rank === 3
                          ? "border-l-accent"
                          : "border-l-transparent";
                  const youBg = isYou ? "bg-accent/5" : "bg-transparent";
                  const rankTone =
                    r.rank <= 3
                      ? "text-accent"
                      : r.rank <= 10
                        ? "text-accent"
                        : "text-muted";

                  return (
                    <tr
                      key={r.referral_code}
                      className={`${youBg} border-b border-border/30`}
                    >
                      <td
                        className={`px-4 py-3 font-mono ${rankTone} ${leftBorder}`}
                      >
                        {r.rank === 1 ? "⚡ " : ""}
                        {r.rank}
                        {isYou ? (
                          <span className="ml-2 inline-flex">
                            {" "}
                            <Badge>YOU</Badge>
                          </span>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted">
                        {r.display}
                      </td>
                      <td className="px-4 py-3 font-mono text-accent">
                        {r.total_points}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-none border px-3 py-1 text-xs font-medium ${tierBadgeClass(r.rank)}`}
                        >
                          {r.tier}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="mt-4 flex items-center justify-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page - 1)}
            disabled={page <= 1}
          >
            Prev
          </Button>

          <div className="text-sm text-muted">
            Page {page}
            {totalPages ? ` of ${totalPages}` : ""} · {PAGE_SIZE} per page
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => goToPage(page + 1)}
            disabled={totalPages ? page >= totalPages : rows.length < PAGE_SIZE}
          >
            Next
          </Button>
        </div>

        <div className="mt-6 text-center text-sm text-muted">
          Your rank not here?{" "}
          <a className="text-accent underline" href="/waitlist">
            Join the waitlist and start earning QP
          </a>
        </div>
      </div>
    </section>
  );
}
