type WindowEntry = { count: number; resetAt: number };

// Per-key sliding window counters. Keyed by "<route>:<ip>".
// On Vercel, each serverless function invocation has its own memory, so this
// acts as a per-instance limit — still effective against steady abuse since
// Vercel routes a given IP to the same function instance for a short window.
const windows = new Map<string, WindowEntry>();

export function rateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = windows.get(key);

  if (!entry || now >= entry.resetAt) {
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return true; // allowed
  }

  if (entry.count >= maxRequests) {
    return false; // blocked
  }

  entry.count += 1;
  return true; // allowed
}

// Seconds until the current window for this key resets (for Retry-After header).
export function retryAfter(key: string): number {
  const entry = windows.get(key);
  if (!entry) return 0;
  return Math.max(0, Math.ceil((entry.resetAt - Date.now()) / 1000));
}
