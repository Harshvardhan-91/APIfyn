import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class StripeTriggerHandler implements IntegrationHandler {
  blockId = "stripe-trigger";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const payload = ctx.triggerPayload;

    const eventType = String(payload.type ?? payload.event_type ?? "");
    const allowedTypes = (config.eventTypes ?? []) as string[];

    if (allowedTypes.length > 0 && !allowedTypes.includes(eventType)) {
      return {
        success: true,
        output: {
          skipped: true,
          reason: `Event "${eventType}" not in allowed types`,
        },
      };
    }

    const data = (payload.data as Record<string, unknown>)?.object as
      | Record<string, unknown>
      | undefined;

    return {
      success: true,
      output: {
        event_type: eventType,
        amount: data?.amount ?? data?.amount_total ?? "",
        currency: data?.currency ?? "",
        customer_email:
          data?.customer_email ??
          (data?.customer_details as Record<string, unknown>)?.email ??
          "",
        customer_name:
          data?.customer_name ??
          (data?.customer_details as Record<string, unknown>)?.name ??
          "",
        payment_id: data?.id ?? payload.id ?? "",
        status: data?.status ?? "",
        ...payload,
      },
    };
  }
}

IntegrationRegistry.register(new StripeTriggerHandler());
