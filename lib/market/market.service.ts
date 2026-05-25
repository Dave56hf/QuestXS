import { coingeckoFetch } from "../coingecko";

export async function getTrendingCoins() {
  const data = await coingeckoFetch<{
    coins: any[];
  }>("/search/trending", 300);

  return data.coins;
}

export async function getTopMovers() {
  return coingeckoFetch<any[]>(
    "/coins/markets?vs_currency=usd&order=volume_desc&per_page=10&page=1&sparkline=true&price_change_percentage=24h",
    300
  );
}

export async function getGlobalMarket() {
  return coingeckoFetch<any>(
    "/global",
    300
  );
}