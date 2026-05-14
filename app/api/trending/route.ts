import { NextResponse } from "next/server";
import { coingeckoFetch } from "@/lib/coingecko";
import type { TrendingCoin } from "@/types/crypto";

type TrendingResponse = {
  coins: Array<{
    item: {
      id: string;
      name: string;
      symbol: string;
      thumb: string;
      data?: {
        price?: string;
        price_change_percentage_24h?: { usd?: number };
        market_cap?: string;
      };
    };
  }>;
};

function signalForRank(rank: number): TrendingCoin["signal"] {
  if (rank <= 2) return "Hot";
  if (rank <= 4) return "Warm";
  return "Watch";
}

export async function GET() {
  try {
    const payload = await coingeckoFetch<TrendingResponse>(
      "/search/trending",
      300,
    );

    const coins = payload.coins.slice(0, 6).map(({ item }, index) => ({
      id: item.id,
      name: item.name,
      symbol: item.symbol,
      thumb: item.thumb,
      price: item.data?.price ?? "$0.00",
      change24h: item.data?.price_change_percentage_24h?.usd ?? 0,
      marketCap: item.data?.market_cap ?? "Unknown",
      signal: signalForRank(index + 1),
    }));

    return NextResponse.json(coins);
  } catch (error) {
    console.error("Trending API error:", error);
    return NextResponse.json(
      { error: "Unable to load trending coins" },
      { status: 502 },
    );
  }
}
