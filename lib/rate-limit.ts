// Fixed-window, in-memory rate limiter.
//
// SCOPE: per server instance. On Vercel, Fluid Compute reuses instances so this
// meaningfully slows online guessing, but it is NOT a distributed limiter —
// concurrent instances each keep their own counter, and a cold start resets it.
// Adequate for gating a single-password admin login; move to Redis/Postgres if
// this ever needs to guard something higher-value.

interface Window {
  count: number;
  /** Unix ms when this window resets. */
  resetAt: number;
}

const windows = new Map<string, Window>();

/** Drop expired windows so the Map can't grow without bound. */
function sweep(now: number): void {
  if (windows.size < 1000) return;
  for (const [key, win] of windows) {
    if (win.resetAt <= now) windows.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  /** Seconds until the window resets — send as Retry-After when blocked. */
  retryAfterSeconds: number;
}

export function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const existing = windows.get(key);

  if (!existing || existing.resetAt <= now) {
    windows.set(key, { count: 1, resetAt: now + windowSeconds * 1000 });
    return { ok: true, remaining: limit - 1, retryAfterSeconds: 0 };
  }

  existing.count += 1;
  const retryAfterSeconds = Math.max(
    1,
    Math.ceil((existing.resetAt - now) / 1000)
  );

  if (existing.count > limit) {
    return { ok: false, remaining: 0, retryAfterSeconds };
  }

  return {
    ok: true,
    remaining: limit - existing.count,
    retryAfterSeconds,
  };
}

/** Clear a key's window, e.g. after a successful login. */
export function resetRateLimit(key: string): void {
  windows.delete(key);
}

/** Best-effort client IP from proxy headers. Falls back to a shared bucket. */
export function clientIp(req: {
  headers: { get(name: string): string | null };
}): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}

/** Test-only: drop all state between cases. */
export function __resetAllRateLimits(): void {
  windows.clear();
}
