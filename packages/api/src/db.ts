import "./load-env";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "./utils/env";

function buildPooledUrl(): string {
  const baseUrl = getDatabaseUrl();
  const isProduction = process.env.NODE_ENV === "production";
  const connectionLimit = isProduction ? 10 : 5;
  const poolTimeout = isProduction ? 10 : 20;

  const separator = baseUrl.includes("?") ? "&" : "?";
  return `${baseUrl}${separator}connection_limit=${connectionLimit}&pool_timeout=${poolTimeout}`;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "production"
        ? ["warn", "error"]
        : ["query", "info", "warn", "error"],
    datasources: {
      db: {
        url: buildPooledUrl(),
      },
    },
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
