export interface BlockContext {
  workflowId: string;
  executionId: string;
  userId: string;
  triggerPayload: Record<string, unknown>;
  previousOutput: Record<string, unknown>;
}

export interface BlockResult {
  success: boolean;
  output: Record<string, unknown>;
  error?: string;
}

export interface IntegrationHandler {
  blockId: string;
  execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult>;
}
