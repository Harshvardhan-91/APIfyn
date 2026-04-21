import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

export class WebhookTriggerHandler implements IntegrationHandler {
  blockId = "webhook-trigger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    return {
      success: true,
      output: { payload: ctx.triggerPayload },
    };
  }
}

export class WebhookSendHandler implements IntegrationHandler {
  blockId = "webhook-send";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const url = config.url as string | undefined;
    if (!url) {
      return { success: false, output: {}, error: "Webhook URL is required" };
    }

    const method = ((config.method as string) || "POST").toUpperCase();
    const customHeaders = config.headers as Record<string, string> | undefined;
    const bodyTemplate = (config.body as string) || "";

    const resolvedBody = bodyTemplate
      ? fillTemplate(bodyTemplate, ctx)
      : JSON.stringify(ctx.previousOutput);

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    try {
      const res = await fetch(url, {
        method,
        headers,
        body: method !== "GET" ? resolvedBody : undefined,
      });

      const responseBody = await res.text();

      logger.info(`Webhook sent to ${url} — ${res.status}`);

      return {
        success: res.ok,
        output: {
          statusCode: res.status,
          body: responseBody.slice(0, 2000),
        },
        error: res.ok ? undefined : `HTTP ${res.status}`,
      };
    } catch (err) {
      return {
        success: false,
        output: {},
        error: err instanceof Error ? err.message : "Webhook request failed",
      };
    }
  }
}

IntegrationRegistry.register(new WebhookTriggerHandler());
IntegrationRegistry.register(new WebhookSendHandler());
