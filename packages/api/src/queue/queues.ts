import { Queue } from "bullmq";
import { getRedisConnection } from "./connection";

export interface WorkflowJobData {
  workflowId: string;
  executionId: string;
  triggerBlockId: string;
  triggerPayload: Record<string, unknown>;
}

let workflowQueue: Queue<WorkflowJobData> | null = null;

export function getWorkflowQueue(): Queue<WorkflowJobData> {
  if (!workflowQueue) {
    workflowQueue = new Queue<WorkflowJobData>("workflow-execution", {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: "exponential", delay: 2000 },
        removeOnComplete: { count: 500 },
        removeOnFail: { count: 200 },
      },
    });
  }
  return workflowQueue;
}
