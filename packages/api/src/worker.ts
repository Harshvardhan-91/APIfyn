import "./load-env";
import "./integrations/handlers/register";
import { closeRedis } from "./queue/connection";
import { createWorkflowWorker } from "./queue/worker";
import { createLogger } from "./utils/logger";

const logger = createLogger();

logger.info("ENV check — SMTP_USER: %s, SMTP_HOST: %s",
  process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 4)}...` : "(not set)",
  process.env.SMTP_HOST ?? "(not set)",
);

const worker = createWorkflowWorker();

logger.info("Workflow worker started");

async function shutdown(signal: string) {
  logger.info(`Received ${signal}. Shutting down worker...`);
  await worker.close();
  await closeRedis();
  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
