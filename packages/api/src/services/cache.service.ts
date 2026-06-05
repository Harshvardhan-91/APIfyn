import IORedis from "ioredis";
import { createLogger } from "../utils/logger";

const logger = createLogger();

let cacheClient: IORedis | null = null;

function getClient(): IORedis {
  if (cacheClient) return cacheClient;

  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const useTls = url.startsWith("rediss://");

  cacheClient = new IORedis(url, {
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: true,
    retryStrategy(times) {
      if (times > 5) return null;
      return Math.min(times * 200, 3000);
    },
    ...(useTls ? { tls: { rejectUnauthorized: false } } : {}),
  });

  cacheClient.on("connect", () => logger.info("Cache Redis connected"));
  cacheClient.on("error", (err) =>
    logger.error("Cache Redis error: %s", err.message),
  );

  cacheClient.connect().catch(() => {
    logger.warn("Cache Redis connection failed — caching disabled");
  });

  return cacheClient;
}

export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = getClient();
      const raw = await client.get(key);
      if (!raw) return null;
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    try {
      const client = getClient();
      await client.setex(key, ttlSeconds, JSON.stringify(value));
    } catch {
      // Cache write failure is non-fatal
    }
  },

  async del(key: string): Promise<void> {
    try {
      const client = getClient();
      await client.del(key);
    } catch {
      // Cache delete failure is non-fatal
    }
  },

  async delPattern(pattern: string): Promise<void> {
    try {
      const client = getClient();
      let cursor = "0";
      do {
        const [nextCursor, keys] = await client.scan(
          cursor,
          "MATCH",
          pattern,
          "COUNT",
          100,
        );
        cursor = nextCursor;
        if (keys.length > 0) {
          await client.del(...keys);
        }
      } while (cursor !== "0");
    } catch {
      // Pattern delete failure is non-fatal
    }
  },

  async invalidateUser(userId: string): Promise<void> {
    await Promise.all([
      this.del(`cache:user:${userId}`),
      this.del(`cache:plan-limits:${userId}`),
      this.del(`cache:dashboard:${userId}`),
      this.del(`cache:workflows:${userId}`),
      this.delPattern(`cache:integration:${userId}:*`),
    ]);
  },

  async disconnect(): Promise<void> {
    if (cacheClient) {
      await cacheClient.quit().catch(() => {});
      cacheClient = null;
    }
  },
};
