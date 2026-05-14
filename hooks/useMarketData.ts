"use client";

import useSWR from "swr";
import type { MarketData } from "@/types/crypto";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMarketData() {
  return useSWR<MarketData>("/api/market", fetcher, {
    refreshInterval: 60000,
  });
}
