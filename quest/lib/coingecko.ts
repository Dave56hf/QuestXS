const COINGECKO_BASE = "https://api.coingecko.com/api/v3";

export async function coingeckoFetch<T>(
  path: string,
  revalidate: number,
): Promise<T> {
  const response = await fetch(`${COINGECKO_BASE}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
