import { Worker } from "bullmq";
import { executeWorkflow } from "../services/workflow-executor";
import { createLogger } from "../utils/logger";
import { getRedisConnection } from "./connection";
import type { WorkflowJobData } from "./queues";

const logger = createLogger();

export function createWorkflowWorker(): Worker<WorkflowJobData> {
  logger.info("Creating BullMQ worker for queue: workflow-execution");

  const connection = getRedisConnection();

  const worker = new Worker<WorkflowJobData>(
    "workflow-execution",
    async (job) => {
      logger.info(
        `Processing job ${job.id} for workflow ${job.data.workflowId}`,
      );
      await executeWorkflow(job.data);
    },
    {
      connection,
      concurrency: 2,
    },
  );

  worker.on("ready", () => {
    logger.info("BullMQ worker is READY and listening for jobs");
  });

  worker.on("completed", (job) => {
    logger.info(`Job ${job.id} completed for workflow ${job.data.workflowId}`);
  });

  worker.on("failed", (job, err) => {
    logger.error(
      `Job ${job?.id} failed for workflow ${job?.data.workflowId}: ${err.message}`,
    );
  });

  worker.on("error", (err) => {
    logger.error(`BullMQ worker error: ${err.message}`);
  });

  return worker;
}
