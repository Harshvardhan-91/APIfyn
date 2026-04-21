import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

const logger = createLogger();

export class FormatterHandler implements IntegrationHandler {
  blockId = "formatter";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    // TODO: Implement data transformation / mapping
    return { success: true, output: ctx.previousOutput };
  }
}

export class CodeHandler implements IntegrationHandler {
  blockId = "code";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    // TODO: Implement safe sandboxed code execution
    return { success: true, output: ctx.previousOutput };
  }
}

export class LoggerHandler implements IntegrationHandler {
  blockId = "logger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    logger.info(`[LogBlock] workflow=${ctx.workflowId}`, ctx.previousOutput);
    return { success: true, output: ctx.previousOutput };
  }
}

IntegrationRegistry.register(new FormatterHandler());
IntegrationRegistry.register(new CodeHandler());
IntegrationRegistry.register(new LoggerHandler());
