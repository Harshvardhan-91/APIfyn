import IORedis from "ioredis";
import { createLogger } from "../utils/logger";

const logger = createLogger();

const connections: IORedis[] = [];

function buildRedisOptions(): ConstructorParameters<typeof IORedis>[1] {
  const url = process.env.REDIS_URL || "redis://localhost:6379";
  const useTls = url.startsWith("rediss://");
  return {
    maxRetriesPerRequest: null,
    ...(useTls && { tls: { rejectUnauthorized: false } }),
  };
}

function getRedisUrl(): string {
  return process.env.REDIS_URL || "redis://localhost:6379";
}

export function createRedisConnection(): IORedis {
  const conn = new IORedis(getRedisUrl(), buildRedisOptions());
  conn.on("connect", () => logger.info("Redis connected"));
  conn.on("error", (err) => logger.error("Redis error:", err));
  connections.push(conn);
  return conn;
}

export function getRedisConnection(): IORedis {
  return createRedisConnection();
}

export async function closeRedis(): Promise<void> {
  for (const conn of connections) {
    await conn.quit();
  }
  connections.length = 0;
}
