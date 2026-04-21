import IORedis, { type RedisOptions } from "ioredis";
import { createLogger } from "../utils/logger";

const logger = createLogger();

const connections: IORedis[] = [];

function buildRedisOptions(): RedisOptions {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const useTls = url.startsWith("rediss://");
  const opts: RedisOptions = { maxRetriesPerRequest: null };
  if (useTls) {
    opts.tls = { rejectUnauthorized: false };
  }
  return opts;
}

export function getRedisConnection(): IORedis {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const conn = new IORedis(url, buildRedisOptions());
  conn.on("connect", () => logger.info("Redis connected"));
  conn.on("error", (err) => logger.error("Redis error:", err));
  connections.push(conn);
  return conn;
}

export async function closeRedis(): Promise<void> {
  for (const conn of connections) {
    await conn.quit();
  }
  connections.length = 0;
}
