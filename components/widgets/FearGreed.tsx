"use client";

import useSWR from "swr";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import type { FearGreed as FearGreedType } from "@/types/crypto";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function FearGreed() {
  const { data, error, isLoading } = useSWR<FearGreedType>("/api/fng", fetcher, {
    refreshInterval: 3600000,
  });

  const tone =
    (data?.value ?? 50) > 60
      ? "text-accent"
      : (data?.value ?? 50) < 40
        ? "text-danger"
        : "text-yellow-400";

  return (
    <Card>
      <p className="text-sm text-muted">Fear & Greed</p>
      {error ? (
        <p className="mt-4 text-sm text-muted">Unable to load sentiment</p>
      ) : isLoading ? (
        <Skeleton className="mt-4 h-12" />
      ) : (
        <div className="mt-4 flex items-end justify-between">
          <p className={`font-display text-4xl font-semibold ${tone}`}>
            {data?.value}
          </p>
          <p className="pb-1 text-sm text-muted">{data?.classification}</p>
        </div>
      )}
    </Card>
  );
}
