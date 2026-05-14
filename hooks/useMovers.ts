"use client";

import useSWR from "swr";
import type { Coin } from "@/types/crypto";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useMovers() {
  return useSWR<{ gainers: Coin[]; losers: Coin[]; trending: Coin[] }>(
    "/api/movers",
    fetcher,
    { refreshInterval: 60000 },
  );
}
