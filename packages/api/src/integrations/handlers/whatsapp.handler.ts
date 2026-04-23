import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

const MSG91_API = "https://control.msg91.com/api/v5";

export class WhatsAppSendHandler implements IntegrationHandler {
  blockId = "whatsapp-send";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey) {
      return {
        success: false,
        output: {},
        error: "MSG91_AUTH_KEY not configured in environment",
      };
    }

    const to = fillTemplate(String(config.to ?? ""), ctx);
    const templateId =
      String(config.templateId ?? "") || process.env.MSG91_TEMPLATE_ID || "";

    if (!to) {
      return {
        success: false,
        output: {},
        error: "Recipient phone number is required",
      };
    }

    if (!templateId) {
      return {
        success: false,
        output: {},
        error: "Template ID is required (set in block config or MSG91_TEMPLATE_ID env var)",
      };
    }

    const phone = to.replace(/[^0-9+]/g, "");
    const integratedNumber = process.env.MSG91_INTEGRATED_NUMBER || "";

    const variablesRaw = String(config.variables ?? "");
    const variableValues = variablesRaw
      ? fillTemplate(variablesRaw, ctx)
          .split(",")
          .map((v) => v.trim())
      : [];

    const bodyMap: Record<string, string> = {};
    for (let i = 0; i < variableValues.length; i++) {
      bodyMap[`var${i + 1}`] = variableValues[i] ?? "";
    }

    const payload = {
      integrated_number: integratedNumber,
      content_type: "template",
      payload: {
        to: phone,
        type: "template",
        template: {
          name: templateId,
          language: { code: String(config.language ?? "en"), policy: "deterministic" },
          components: variableValues.length > 0
            ? [
                {
                  type: "body",
                  parameters: variableValues.map((val) => ({
                    type: "text",
                    text: val,
                  })),
                },
              ]
            : [],
        },
        messaging_product: "whatsapp",
      },
    };

    try {
      const res = await fetch(`${MSG91_API}/whatsapp/whatsapp/template/msg`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          authkey: authKey,
        },
        body: JSON.stringify(payload),
      });

      const responseBody = await res.text();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(responseBody);
      } catch {
        parsed = { raw: responseBody };
      }

      if (!res.ok) {
        logger.error(`MSG91 WhatsApp send failed: ${res.status} — ${responseBody}`);
        return {
          success: false,
          output: { statusCode: res.status, response: parsed },
          error: `MSG91 API returned ${res.status}: ${parsed.message ?? responseBody}`,
        };
      }

      logger.info(`WhatsApp message sent to ${phone} via MSG91`);

      return {
        success: true,
        output: {
          sent: true,
          to: phone,
          templateId,
          variables: variableValues,
          response: parsed,
        },
      };
    } catch (err) {
      logger.error("WhatsApp send error:", err);
      return {
        success: false,
        output: {},
        error: err instanceof Error ? err.message : "WhatsApp send failed",
      };
    }
  }
}

IntegrationRegistry.register(new WhatsAppSendHandler());
