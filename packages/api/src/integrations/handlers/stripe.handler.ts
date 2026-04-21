import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class StripeTriggerHandler implements IntegrationHandler {
  blockId = "stripe-trigger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    return {
      success: true,
      output: { event: ctx.triggerPayload },
    };
  }
}

IntegrationRegistry.register(new StripeTriggerHandler());
