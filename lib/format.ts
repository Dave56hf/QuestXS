export function formatCurrency(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}t`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}b`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}m`;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatPercent(n: number) {
  if (!Number.isFinite(n)) return "0.00%";
  return `${n > 0 ? "+" : ""}${n.toFixed(2)}%`;
}

export function formatPrice(n: number) {
  if (!Number.isFinite(n)) return "$0.00";
  const digits = n < 0.01 ? 6 : n < 1 ? 4 : 2;
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })}`;
}
