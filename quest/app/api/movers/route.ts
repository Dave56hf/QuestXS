import { NextResponse } from "next/server";
import { coingeckoFetch } from "@/lib/coingecko";
import type { Coin } from "@/types/crypto";

export async function GET() {
  try {
    const coins = await coingeckoFetch<Coin[]>(
      "/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=100&sparkline=true&price_change_percentage=24h",
      60,
    );

    const byChange = [...coins].sort(
      (a, b) =>
        (b.price_change_percentage_24h ?? -Infinity) -
        (a.price_change_percentage_24h ?? -Infinity),
    );
    const byVolume = [...coins].sort(
      (a, b) => (b.total_volume ?? 0) - (a.total_volume ?? 0),
    );

    return NextResponse.json({
      gainers: byChange.slice(0, 5),
      losers: byChange.slice(-5).reverse(),
      trending: byVolume.slice(0, 5),
    });
  } catch (error) {
    console.error("Movers API error:", error);
    return NextResponse.json(
      { error: "Unable to load movers" },
      { status: 502 },
    );
  }
}
