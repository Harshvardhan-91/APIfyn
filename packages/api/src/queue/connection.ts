import IORedis from "ioredis";
import { createLogger } from "../utils/logger";

const logger = createLogger();

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    const url = process.env.REDIS_URL || "redis://localhost:6379";
    connection = new IORedis(url, { maxRetriesPerRequest: null });
    connection.on("connect", () => logger.info("Redis connected"));
    connection.on("error", (err) => logger.error("Redis error:", err));
  }
  return connection;
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
