import { redis } from "@/lib/redis";
import { getEnv } from "@/lib/env";

const RATE_LIMIT_WINDOW_SECONDS = 60;
const MAX_REQUESTS_PER_WINDOW = 10;

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function getClientIp(request: Request): string {
  const env = getEnv();
  const trustedProxy = env.TRUSTED_PROXY_IP;

  const forwardedFor = request.headers.get("x-forwarded-for");

  if (trustedProxy && forwardedFor) {
    const ips = forwardedFor.split(",").map((ip) => ip.trim());
    if (ips[0] === trustedProxy) {
      return ips[ips.length - 1];
    }
  }

  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export async function checkRateLimit(
  identifier: string,
): Promise<RateLimitResult> {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_SECONDS * 1000;

  try {
    const multi = redis.multi();
    multi.zremrangebyscore(key, 0, windowStart);
    multi.zadd(key, now.toString(), `${now}-${crypto.randomUUID()}`);
    multi.zcard(key);
    multi.expire(key, RATE_LIMIT_WINDOW_SECONDS);

    const results = await multi.exec();

    if (!results) {
      return {
        success: false,
        remaining: 0,
        resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000,
      };
    }

    const requestCount = (results[2]?.[1] as number | undefined) ?? 0;
    const remaining = Math.max(0, MAX_REQUESTS_PER_WINDOW - requestCount);
    const resetAt = now + RATE_LIMIT_WINDOW_SECONDS * 1000;

    if (requestCount > MAX_REQUESTS_PER_WINDOW) {
      return { success: false, remaining: 0, resetAt };
    }

    return { success: true, remaining, resetAt };
  } catch {
    return {
      success: false,
      remaining: 0,
      resetAt: now + RATE_LIMIT_WINDOW_SECONDS * 1000,
    };
  }
}
