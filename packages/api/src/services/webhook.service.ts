import { prisma } from "../db";
import { getWorkflowQueue } from "../queue/queues";
import { createLogger } from "../utils/logger";

const logger = createLogger();

export interface WebhookPayload {
  repository?: {
    id: number;
    name: string;
    full_name: string;
    html_url: string;
  };
  pusher?: {
    name: string;
    email: string;
  };
  head_commit?: {
    id: string;
    message: string;
    author: { name: string; email: string };
    url: string;
    timestamp?: string;
  };
  commits?: Array<{
    id: string;
    message: string;
    author: { name: string; email: string };
    url: string;
  }>;
  ref?: string;
  before?: string;
  after?: string;
  compare?: string;
  action?: string;
  pull_request?: {
    title: string;
    body: string;
    user: { login: string; avatar_url: string };
    html_url: string;
    number: number;
  };
  [key: string]: unknown;
}

export class WebhookService {
  static async createGitHubWebhook(
    accessToken: string,
    repoFullName: string,
    workflowId: string,
  ): Promise<unknown> {
    const webhookUrl = `${process.env.BASE_URL}/api/webhooks/github/${workflowId}`;

    if (!process.env.BASE_URL) {
      throw new Error("BASE_URL environment variable is required");
    }

    logger.info(
      `Creating GitHub webhook for repo ${repoFullName} → ${webhookUrl}`,
    );

    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/hooks`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "web",
          active: true,
          events: ["push", "pull_request"],
          config: {
            url: webhookUrl,
            content_type: "json",
            insecure_ssl: "0",
          },
        }),
      },
    );

    if (!res.ok) {
      const error = (await res.json()) as { message?: string };
      throw new Error(
        `Failed to create webhook: ${error.message || "Unknown error"}`,
      );
    }

    const result = await res.json();
    logger.info(`GitHub webhook created for workflow ${workflowId}`);
    return result;
  }

  static async deleteGitHubWebhook(
    accessToken: string,
    repoFullName: string,
    webhookId: number,
  ): Promise<void> {
    const res = await fetch(
      `https://api.github.com/repos/${repoFullName}/hooks/${webhookId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!res.ok) {
      throw new Error("Failed to delete webhook");
    }
  }

  static async enqueueWorkflow(
    workflowId: string,
    triggerBlockId: string,
    payload: Record<string, unknown>,
  ): Promise<string> {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow || !workflow.isActive) {
      throw new Error(`Workflow ${workflowId} not found or inactive`);
    }

    const execution = await prisma.workflowExecution.create({
      data: {
        workflowId,
        userId: workflow.userId,
        status: "PENDING",
        inputData: payload as any,
      },
    });

    const queue = getWorkflowQueue();
    await queue.add(
      `workflow-${workflowId}`,
      {
        workflowId,
        executionId: execution.id,
        triggerBlockId,
        triggerPayload: payload,
      },
      { jobId: execution.id },
    );

    logger.info(
      `Enqueued workflow ${workflowId}, execution ${execution.id}`,
    );

    return execution.id;
  }
}
