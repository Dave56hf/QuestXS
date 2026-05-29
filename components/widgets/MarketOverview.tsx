"use client";

import { RefreshCw } from "lucide-react";
import useSWR from "swr";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useMarketData } from "@/hooks/useMarketData";
import { CACHE_REVALIDATE_SECONDS } from "@/lib/config";
import { formatCurrency, formatPercent } from "@/lib/format";
import type { FearGreed } from "@/types/crypto";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function Sparkline({ positive }: { positive: boolean }) {
  const points = positive
    ? "0,36 16,32 32,34 48,25 64,28 80,18 96,15 112,10 128,12 144,5"
    : "0,8 16,12 32,10 48,20 64,18 80,27 96,24 112,33 128,31 144,38";

  return (
    <svg viewBox="0 0 144 44" className="h-12 w-full" aria-hidden="true">
      <polyline
        points={points}
        fill="none"
        stroke={positive ? "#22c55e" : "#ef4444"}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="3"
      />
    </svg>
  );
}

export default function MarketOverview() {
  const { data, error, isLoading, mutate } = useMarketData();
  const {
    data: fng,
    error: fngError,
    isLoading: fngLoading,
    mutate: refetchFng,
  } = useSWR<FearGreed>("/api/fng", fetcher, {
    refreshInterval: CACHE_REVALIDATE_SECONDS.fearGreed * 1000,
  });

  if (error) {
    return (
      <Card className="min-h-[260px]">
        <p className="py-20 text-center text-sm text-muted">
          Unable to load market data
        </p>
      </Card>
    );
  }

  const bullish = (data?.marketCapChange ?? 0) > 0;
  const fearGreedTone =
    (fng?.value ?? 50) > 60
      ? "text-accent"
      : (fng?.value ?? 50) < 40
        ? "text-danger"
        : "text-yellow-400";

  return (
    <Card className="relative overflow-hidden">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-semibold">Market Overview</h3>
        <button
          aria-label="Refresh market data"
          className="rounded-lg border border-border p-2 text-muted transition hover:text-accent"
          onClick={() => {
            void mutate();
            void refetchFng();
          }}
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {isLoading ? (
          <>
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
            <Skeleton className="h-20" />
          </>
        ) : (
          <>
            <div>
              <p className="text-xs text-muted">Market Cap</p>
              <p className="mt-2 font-display text-xl font-semibold">
                {formatCurrency(data?.marketCap ?? 0)}
              </p>
              <span
                className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs ${
                  bullish ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                }`}
              >
                {formatPercent(data?.marketCapChange ?? 0)}
              </span>
            </div>
            <div>
              <p className="text-xs text-muted">24h Volume</p>
              <p className="mt-2 font-display text-xl font-semibold">
                {formatCurrency(data?.volume24h ?? 0)}
              </p>
              <p className="mt-2 text-xs text-muted">
                BTC {data?.btcDominance.toFixed(1)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-muted">Fear & Greed</p>
              {fngLoading ? (
                <Skeleton className="mt-3 h-10" />
              ) : fngError ? (
                <p className="mt-3 text-xs text-muted">Unavailable</p>
              ) : (
                <>
                  <p className={`mt-2 font-display text-xl font-semibold ${fearGreedTone}`}>
                    {fng?.value ?? 0}
                  </p>
                  <p className="text-xs text-muted">{fng?.classification}</p>
                </>
              )}
            </div>
          </>
        )}
      </div>

      <div className="mt-6 rounded-lg border border-border bg-bg p-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted">Market Trend</p>
          <p className={bullish ? "text-sm text-accent" : "text-sm text-danger"}>
            {bullish ? "Bullish" : "Bearish"}
          </p>
        </div>
        <Sparkline positive={bullish} />
      </div>
    </Card>
  );
}
