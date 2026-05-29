import { EXTERNAL_ENDPOINTS } from "@/lib/config";

export async function coingeckoFetch<T>(
  path: string,
  revalidate: number,
): Promise<T> {
  const response = await fetch(`${EXTERNAL_ENDPOINTS.coingeckoBaseUrl}${path}`, {
    next: { revalidate },
    headers: { accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed: ${response.status}`);
  }

  return response.json() as Promise<T>;
}
