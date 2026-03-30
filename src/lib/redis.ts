import { Redis } from "ioredis";
import { env } from "@/lib/env";

let redisInstance: Redis | null = null;

function getRedisUrl() {
  return env.REDIS_URL || "redis://localhost:6379";
}

export function getRedis(): Redis {
  if (!redisInstance) {
    redisInstance = new Redis(getRedisUrl(), {
      maxRetriesPerRequest: 3,
      retryStrategy(times: number) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
    });

    redisInstance.on("error", (err) => {
      console.error("Redis connection error:", err);
    });

    redisInstance.on("connect", () => {
      console.log("Connected to Redis");
    });
  }
  return redisInstance;
}

export const redis = new Proxy({} as Redis, {
  get(_target, prop) {
    return getRedis()[prop as keyof Redis];
  },
});

export async function closeRedis(): Promise<void> {
  if (redisInstance) {
    await redisInstance.quit();
    redisInstance = null;
  }
}
