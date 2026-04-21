import { prisma } from "../../db";
import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

export class SlackSendHandler implements IntegrationHandler {
  blockId = "slack-send";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const channel = (config.channel ?? config.selectedChannel) as string | undefined;
    if (!channel) {
      return { success: false, output: {}, error: "Slack channel is required" };
    }

    const integration = await prisma.integration.findFirst({
      where: { userId: ctx.userId, type: "SLACK" },
    });

    if (!integration?.accessToken) {
      return {
        success: false,
        output: {},
        error: "Slack integration not connected",
      };
    }

    const messageTemplate = (config.messageTemplate ?? config.message ?? "") as string;
    const message = fillTemplate(messageTemplate, ctx) || `New event from workflow ${ctx.workflowId}`;

    const username = config.botName as string | undefined;
    const iconEmoji = config.iconEmoji as string | undefined;
    const threadTs = config.threadTs as string | undefined;

    const repo = ctx.triggerPayload.repository as Record<string, unknown> | undefined;

    const body: Record<string, unknown> = {
      channel,
      text: message,
      blocks: [
        { type: "section", text: { type: "mrkdwn", text: message } },
        ...(repo
          ? [
              {
                type: "context",
                elements: [
                  {
                    type: "mrkdwn",
                    text: `Repository: <${repo.html_url}|${repo.full_name}>`,
                  },
                ],
              },
            ]
          : []),
      ],
    };

    if (username) body.username = username;
    if (iconEmoji) body.icon_emoji = iconEmoji;
    if (threadTs) body.thread_ts = threadTs;

    const slackRes = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await slackRes.json()) as { ok: boolean; error?: string; ts?: string };

    if (!data.ok) {
      return {
        success: false,
        output: {},
        error: `Slack API error: ${data.error}`,
      };
    }

    logger.info(`Slack message sent to ${channel}`);
    return { success: true, output: { channel, message, ts: data.ts } };
  }
}

IntegrationRegistry.register(new SlackSendHandler());
