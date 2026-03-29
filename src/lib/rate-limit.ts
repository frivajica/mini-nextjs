import { redis } from "@/lib/redis";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 10;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;

  const multi = redis.multi();
  multi.zremrangebyscore(key, 0, windowStart);
  multi.zadd(key, now.toString(), `${now}-${Math.random()}`);
  multi.zcard(key);
  multi.expire(key, RATE_LIMIT_WINDOW_SECONDS);

  const results = await multi.exec();

  if (!results) {
    return {
      success: true,
      remaining: MAX_REQUESTS_PER_WINDOW,
      resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000,
    };
  }

  const requestCount = results[2][1] as number;
  const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount);
  const resetAt = now + RATE_LIMIT_WINDOW_SECONDS * 1000;

  if (requestCount > MAX_REQUESTS_PER_WINDOW) {
    return { success: false, remaining: 0, resetAt };
  }

  return { success: true, remaining, resetAt };
}
