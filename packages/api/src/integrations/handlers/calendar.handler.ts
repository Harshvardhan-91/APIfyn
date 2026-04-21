import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class CalendarTriggerHandler implements IntegrationHandler {
  blockId = "calendar-trigger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    // TODO: Implement Google Calendar webhook via push notifications
    return {
      success: true,
      output: { message: "Calendar trigger not yet implemented", ...ctx.triggerPayload },
    };
  }
}

IntegrationRegistry.register(new CalendarTriggerHandler());
