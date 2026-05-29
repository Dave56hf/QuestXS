import Image from "next/image";
import { getTrendingCoins } from "@/lib/market/market.service";
import { MARKET_LIMITS } from "@/lib/config";

export default async function TrendingPreview() {
  const coins = await getTrendingCoins();

  return (
    <div className="rounded-none border border-border bg-black/30 p-6">
      <h2 className="mb-4 text-lg font-semibold">Trending Now</h2>

      <div className="space-y-3">
        {coins.slice(0, MARKET_LIMITS.trendingPreview).map((c) => (
          <div key={c.item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src={c.item.small}
                alt={`${c.item.name} logo`}
                width={32}
                height={32}
                className="rounded-full"
              />
              <span>{c.item.name}</span>
            </div>

            <span className="text-accent">#{c.item.market_cap_rank}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
