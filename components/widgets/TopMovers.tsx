"use client";

import Image from "next/image";
import { useState } from "react";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useMovers } from "@/hooks/useMovers";
import { formatPercent, formatPrice } from "@/lib/format";

type Tab = "gainers" | "losers" | "trending";

const tabs: Array<{ key: Tab; label: string }> = [
  { key: "gainers", label: "Gainers" },
  { key: "losers", label: "Losers" },
  { key: "trending", label: "Trending" },
];

export default function TopMovers() {
  const [tab, setTab] = useState<Tab>("gainers");
  const { data, error, isLoading } = useMovers();
  const coins = data?.[tab] ?? [];

  return (
    <Card>
      <div className="mb-4 flex items-center gap-2 border-b border-border">
        {tabs.map((item) => (
          <button
            key={item.key}
            onClick={() => setTab(item.key)}
            className={`px-3 py-2 text-sm transition ${
              tab === item.key
                ? "border-b-2 border-accent bg-accent/10 text-accent"
                : "text-muted hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error ? (
        <p className="py-10 text-center text-sm text-muted">Unable to load movers</p>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="h-12" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {coins.map((coin, index) => {
            const positive = coin.price_change_percentage_24h >= 0;
            return (
              <div
                key={coin.id}
                className="grid grid-cols-[24px_1fr_auto_auto] items-center gap-3 text-sm"
              >
                <span className="text-muted">{index + 1}</span>
                <div className="flex min-w-0 items-center gap-3">
                  <Image
                    src={coin.image}
                    alt={`${coin.name} logo`}
                    width={24}
                    height={24}
                    className="rounded-full"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium">{coin.name}</p>
                    <p className="uppercase text-muted">{coin.symbol}</p>
                  </div>
                </div>
                <span>{formatPrice(coin.current_price)}</span>
                <span
                  className={`rounded-full px-2 py-1 text-xs ${
                    positive ? "bg-accent/10 text-accent" : "bg-danger/10 text-danger"
                  }`}
                >
                  {formatPercent(coin.price_change_percentage_24h)}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}
