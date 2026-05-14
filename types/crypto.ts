export interface Coin {
  id: string;
  name: string;
  symbol: string;
  image: string;
  current_price: number;
  price_change_percentage_24h: number;
  market_cap: number;
  total_volume: number;
  sparkline_in_7d?: { price: number[] };
}

export interface MarketData {
  marketCap: number;
  volume24h: number;
  marketCapChange: number;
  btcDominance: number;
  activeCryptos: number;
}

export interface TrendingCoin {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  price: string;
  change24h: number;
  marketCap: string;
  signal: "Hot" | "Warm" | "Watch";
}

export interface FearGreed {
  value: number;
  classification: string;
}
