import type { BlockContext } from "../integrations/base";
import { IntegrationRegistry } from "../integrations/registry";
import type { WorkflowJobData } from "../queue/queues";
import { prisma } from "../db";
import {
  canExecuteWorkflow,
  getUserPlanLimits,
  incrementApiCalls,
} from "./plan.service";
import { createLogger } from "../utils/logger";

const logger = createLogger();

interface DefinitionBlock {
  id: string;
  type: string;
  config?: Record<string, unknown>;
  [key: string]: unknown;
}

interface DefinitionConnection {
  id: string;
  from: string;
  to: string;
}

interface WorkflowDefinition {
  blocks?: DefinitionBlock[];
  connections?: DefinitionConnection[];
}

function topologicalSort(
  blocks: DefinitionBlock[],
  connections: DefinitionConnection[],
): DefinitionBlock[] {
  const blockMap = new Map(blocks.map((b) => [b.id, b]));
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  for (const block of blocks) {
    inDegree.set(block.id, 0);
    adjacency.set(block.id, []);
  }

  for (const conn of connections) {
    adjacency.get(conn.from)?.push(conn.to);
    inDegree.set(conn.to, (inDegree.get(conn.to) ?? 0) + 1);
  }

  const queue: string[] = [];
  for (const [id, deg] of inDegree) {
    if (deg === 0) queue.push(id);
  }

  const sorted: DefinitionBlock[] = [];
  while (queue.length > 0) {
    const current = queue.shift()!;
    const block = blockMap.get(current);
    if (block) sorted.push(block);

    for (const neighbor of adjacency.get(current) ?? []) {
      const newDeg = (inDegree.get(neighbor) ?? 1) - 1;
      inDegree.set(neighbor, newDeg);
      if (newDeg === 0) queue.push(neighbor);
    }
  }

  if (sorted.length < blocks.length) {
    const visited = new Set(sorted.map((b) => b.id));
    for (const block of blocks) {
      if (!visited.has(block.id)) sorted.push(block);
    }
  }

  return sorted;
}

export async function executeWorkflow(data: WorkflowJobData): Promise<void> {
  const { workflowId, executionId, triggerPayload } = data;
  const startTime = Date.now();

  try {
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    // Enforce API call limit
    const limits = await getUserPlanLimits(workflow.userId);
    if (!canExecuteWorkflow(limits)) {
      logger.warn(
        `API call limit reached for user ${workflow.userId} (${limits.apiCallsUsed}/${limits.apiCallsLimit})`,
      );
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "FAILED",
          completedAt: new Date(),
          duration: Date.now() - startTime,
          errorMessage: `Monthly API call limit reached (${limits.apiCallsUsed}/${limits.apiCallsLimit}). Upgrade your plan for more.`,
        },
      });
      return;
    }

    await incrementApiCalls(workflow.userId);

    const definition = workflow.definition as WorkflowDefinition | null;
    if (!definition?.blocks?.length) {
      logger.warn(`Workflow ${workflowId} has no blocks`);
      await prisma.workflowExecution.update({
        where: { id: executionId },
        data: {
          status: "SUCCESS",
          completedAt: new Date(),
          duration: Date.now() - startTime,
          outputData: { message: "No blocks to execute" },
        },
      });
      return;
    }

    const orderedBlocks = topologicalSort(
      definition.blocks,
      definition.connections ?? [],
    );

    let previousOutput: Record<string, unknown> = {};

    for (const block of orderedBlocks) {
      const handler = IntegrationRegistry.get(block.type);

      if (!handler) {
        logger.warn(`No handler for block type "${block.type}", skipping`);
        continue;
      }

      const ctx: BlockContext = {
        workflowId,
        executionId,
        userId: workflow.userId,
        triggerPayload,
        previousOutput,
      };

      logger.info(
        `Executing block "${block.type}" (${block.id}) in workflow ${workflowId}`,
      );

      const result = await handler.execute(block.config ?? {}, ctx);

      if (!result.success) {
        throw new Error(
          result.error ?? `Block "${block.type}" failed`,
        );
      }

      if (result.output.skipped) {
        logger.info(`Block "${block.type}" skipped: ${result.output.reason ?? "filtered"}`);
        await prisma.workflowExecution.update({
          where: { id: executionId },
          data: {
            status: "SUCCESS",
            completedAt: new Date(),
            duration: Date.now() - startTime,
            outputData: { skipped: true, reason: result.output.reason } as any,
          },
        });
        return;
      }

      previousOutput = { ...previousOutput, ...result.output };
    }

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "SUCCESS",
        completedAt: new Date(),
        duration: Date.now() - startTime,
        outputData: previousOutput as any,
      },
    });

    await prisma.workflow.update({
      where: { id: workflowId },
      data: { totalRuns: { increment: 1 }, lastRunAt: new Date() },
    });

    logger.info(
      `Workflow ${workflowId} completed in ${Date.now() - startTime}ms`,
    );
  } catch (error) {
    logger.error(`Workflow ${workflowId} execution failed:`, error);

    await prisma.workflowExecution.update({
      where: { id: executionId },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        duration: Date.now() - startTime,
        errorMessage:
          error instanceof Error ? error.message : "Unknown error",
      },
    });

    throw error;
  }
}
