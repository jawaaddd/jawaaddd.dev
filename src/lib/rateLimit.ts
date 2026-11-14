/**
 * A fixed-window rate limiter kept in memory. The site runs as a single
 * instance (one Railway volume), so memory is shared by every request; it
 * resets on deploy, which is fine for spam protection.
 */
export function rateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, { count: number; resetAt: number }>();

  return {
    /** Records an attempt for `key` and returns whether it's allowed. */
    attempt(key: string, now = Date.now()): boolean {
      // Drop expired windows now and then so the map can't grow without bound.
      if (hits.size > 1000) {
        for (const [k, entry] of hits) if (entry.resetAt <= now) hits.delete(k);
      }
      const entry = hits.get(key);
      if (!entry || entry.resetAt <= now) {
        hits.set(key, { count: 1, resetAt: now + windowMs });
        return true;
      }
      entry.count += 1;
      return entry.count <= limit;
    },
  };
}
