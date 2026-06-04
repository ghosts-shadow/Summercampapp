/**
 * Lightweight in-memory rate limiter (fixed window).
 *
 * This works out-of-the-box with zero infrastructure and is sufficient for a
 * single-instance deployment or low-traffic camp app. For a horizontally
 * scaled production deployment, swap the `hit()` implementation for a shared
 * store such as Upstash Redis (`@upstash/ratelimit`) — the call sites do not
 * need to change.
 */

type Bucket = { count: number; resetAt: number };

const store = new Map<string, Bucket>();

// Periodically evict expired buckets so the map does not grow unbounded.
// (No-op on serverless cold paths; harmless on long-lived instances.)
let lastSweep = 0;
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of store) {
    if (bucket.resetAt <= now) store.delete(key);
  }
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  /** Epoch ms when the window resets. */
  reset: number;
}

/**
 * Register a hit for `key`. Returns whether the request is within `limit`
 * over `windowMs`.
 */
export function rateLimit(
  key: string,
  limit = 10,
  windowMs = 60_000,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = store.get(key);
  if (!bucket || bucket.resetAt <= now) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit, remaining: limit - 1, reset: resetAt };
  }

  bucket.count += 1;
  const remaining = Math.max(0, limit - bucket.count);
  return {
    success: bucket.count <= limit,
    limit,
    remaining,
    reset: bucket.resetAt,
  };
}

/** Extract a best-effort client IP from request headers. */
export function ipFromHeaders(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return headers.get("x-real-ip") ?? "unknown";
}
