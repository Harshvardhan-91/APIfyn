import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class TypeformTriggerHandler implements IntegrationHandler {
  blockId = "typeform-trigger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    return {
      success: true,
      output: { response: ctx.triggerPayload },
    };
  }
}

IntegrationRegistry.register(new TypeformTriggerHandler());
