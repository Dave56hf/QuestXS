"use client";

import useSWR from "swr";
import type { TrendingCoin } from "@/types/crypto";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useTrending() {
  return useSWR<TrendingCoin[]>("/api/trending", fetcher, {
    refreshInterval: 300000,
  });
}
