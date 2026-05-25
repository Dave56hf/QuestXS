import { getTrendingCoins } from "@/lib/market/market.service";

export default async function TrendingPreview() {
  const coins = await getTrendingCoins();

  return (
    <div className="rounded-2xl border border-border bg-black/30 p-6">
      <h2 className="mb-4 text-lg font-semibold">Trending Now</h2>

      <div className="space-y-3">
        {coins.slice(0, 5).map((c) => (
          <div key={c.item.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={c.item.small} className="h-8 w-8 rounded-full" />
              <span>{c.item.name}</span>
            </div>

            <span className="text-accent">#{c.item.market_cap_rank}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
