import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

export class DiscordSendHandler implements IntegrationHandler {
  blockId = "discord-send";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const webhookUrl = config.webhookUrl as string | undefined;
    if (!webhookUrl) {
      return {
        success: false,
        output: {},
        error: "Discord webhook URL is required",
      };
    }

    const messageTemplate = (config.message as string) || `Workflow event from ${ctx.workflowId}`;
    const message = fillTemplate(messageTemplate, ctx);
    const username = config.botName as string | undefined;
    const avatarUrl = config.avatarUrl as string | undefined;

    const body: Record<string, unknown> = { content: message };
    if (username) body.username = username;
    if (avatarUrl) body.avatar_url = avatarUrl;

    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const text = await res.text();
        return {
          success: false,
          output: {},
          error: `Discord API returned ${res.status}: ${text.slice(0, 200)}`,
        };
      }

      logger.info("Discord message sent");
      return { success: true, output: { message } };
    } catch (err) {
      return {
        success: false,
        output: {},
        error: err instanceof Error ? err.message : "Discord send failed",
      };
    }
  }
}

IntegrationRegistry.register(new DiscordSendHandler());
