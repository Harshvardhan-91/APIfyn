import crypto from "node:crypto";
import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

const logger = createLogger();

export class RazorpayTriggerHandler implements IntegrationHandler {
  blockId = "razorpay-trigger";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const payload = ctx.triggerPayload;
    const eventType = String(payload.event ?? "");
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

    const entity =
      (
        (payload.payload as Record<string, unknown>)?.payment as Record<
          string,
          unknown
        >
      )?.entity as Record<string, unknown> | undefined;

    const amount = entity?.amount ? Number(entity.amount) / 100 : 0;
    const currency = String(entity?.currency ?? "INR");

    return {
      success: true,
      output: {
        event_type: eventType,
        payment_id: String(entity?.id ?? payload.id ?? ""),
        amount,
        amount_raw: entity?.amount ?? 0,
        currency,
        status: String(entity?.status ?? ""),
        method: String(entity?.method ?? ""),
        customer_email: String(entity?.email ?? ""),
        customer_contact: String(entity?.contact ?? ""),
        customer_name: String(
          (entity?.notes as Record<string, unknown>)?.name ?? "",
        ),
        description: String(entity?.description ?? ""),
        order_id: String(entity?.order_id ?? ""),
        ...payload,
      },
    };
  }
}

export function verifyRazorpaySignature(
  body: string,
  signature: string | undefined,
): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) return true;
  if (!signature) return false;

  try {
    const expected = crypto
      .createHmac("sha256", secret)
      .update(body)
      .digest("hex");
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expected),
    );
  } catch {
    logger.warn("Razorpay signature verification failed");
    return false;
  }
}

IntegrationRegistry.register(new RazorpayTriggerHandler());
