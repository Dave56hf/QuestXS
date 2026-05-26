"use client";

import Image from "next/image";
import Card from "@/components/ui/Card";
import Skeleton from "@/components/ui/Skeleton";
import { useTrending } from "@/hooks/useTrending";
import { formatPercent } from "@/lib/format";

const signalClasses = {
  Hot: "bg-red-500/10 text-red-400 border border-red-500/20",
  Warm: "bg-orange-500/10 text-orange-400 border border-orange-500/20",
  Watch: "bg-gray-500/10 text-gray-400 border border-gray-500/20",
};

export default function TrendingTable() {
  const { data, error, isLoading } = useTrending();

  return (
    <Card>
      <h3 className="mb-4 font-display text-lg font-semibold">Trending Coins</h3>
      {error ? (
        <p className="py-10 text-center text-sm text-muted">
          Unable to load trending coins
        </p>
      ) : isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-11" />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="pb-3 font-medium">#</th>
                <th className="pb-3 font-medium">Coin</th>
                <th className="pb-3 font-medium">Price</th>
                <th className="pb-3 font-medium">24h%</th>
                <th className="pb-3 font-medium">Market Cap</th>
                <th className="pb-3 font-medium">Signal</th>
              </tr>
            </thead>
            <tbody>
              {data?.map((coin, index) => (
                <tr key={coin.id} className="border-t border-border">
                  <td className="py-3 text-muted">{index + 1}</td>
                  <td className="py-3">
                    <div className="flex items-center gap-2">
                      <Image
                        src={coin.thumb}
                        alt={`${coin.name} logo`}
                        width={22}
                        height={22}
                        className="rounded-full"
                      />
                      <div>
                        <p className="font-medium">{coin.name}</p>
                        <p className="text-xs uppercase text-muted">{coin.symbol}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3">{coin.price}</td>
                  <td
                    className={`py-3 ${
                      coin.change24h >= 0 ? "text-accent" : "text-danger"
                    }`}
                  >
                    {formatPercent(coin.change24h)}
                  </td>
                  <td className="py-3 text-muted">{coin.marketCap}</td>
                  <td className="py-3">
                    <span className={`rounded-full px-2 py-1 text-xs ${signalClasses[coin.signal]}`}>
                      {coin.signal}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-sm font-medium text-accent">
            View all trending coins →
          </p>
        </div>
      )}
    </Card>
  );
}
