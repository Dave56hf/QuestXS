import { NextResponse } from "next/server";
import { coingeckoFetch } from "@/lib/coingecko";

type GlobalResponse = {
  data: {
    total_market_cap: { usd: number };
    total_volume: { usd: number };
    market_cap_change_percentage_24h_usd: number;
    market_cap_percentage: { btc: number };
    active_cryptocurrencies: number;
  };
};

export async function GET() {
  try {
    const payload = await coingeckoFetch<GlobalResponse>("/global", 60);
    const data = payload.data;

    return NextResponse.json({
      marketCap: data.total_market_cap.usd,
      volume24h: data.total_volume.usd,
      marketCapChange: data.market_cap_change_percentage_24h_usd,
      btcDominance: data.market_cap_percentage.btc,
      activeCryptos: data.active_cryptocurrencies,
    });
  } catch (error) {
    console.error("Market API error:", error);
    return NextResponse.json(
      { error: "Unable to load market data" },
      { status: 502 },
    );
  }
}
