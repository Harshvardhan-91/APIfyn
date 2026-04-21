import "./load-env";
import { PrismaClient } from "@prisma/client";
import { getDatabaseUrl } from "./utils/env";

export const prisma = new PrismaClient({
  log: ["query", "info", "warn", "error"],
  datasources: {
    db: {
      url: getDatabaseUrl(),
    },
  },
});
