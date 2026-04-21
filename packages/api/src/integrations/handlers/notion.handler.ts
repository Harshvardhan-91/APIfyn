import { prisma } from "../../db";
import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

export class NotionCreateHandler implements IntegrationHandler {
  blockId = "notion-create";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const databaseId = fillTemplate((config.databaseId as string) || "", ctx);
    if (!databaseId) {
      return {
        success: false,
        output: {},
        error: "Notion Database ID is required",
      };
    }

    const integration = await prisma.integration.findFirst({
      where: { userId: ctx.userId, type: "NOTION" },
    });

    if (!integration?.accessToken) {
      return {
        success: false,
        output: {},
        error: "Notion not connected. Please connect Notion in the Integrations page.",
      };
    }

    const title = fillTemplate(
      (config.title as string) || "Untitled",
      ctx,
    );
    const content = fillTemplate((config.content as string) || "", ctx);
    const status = fillTemplate((config.status as string) || "", ctx);
    const tags = fillTemplate((config.tags as string) || "", ctx);

    const properties: Record<string, unknown> = {
      Name: {
        title: [{ text: { content: title } }],
      },
    };

    if (status) {
      properties.Status = { status: { name: status } };
    }

    if (tags) {
      const tagList = tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      properties.Tags = {
        multi_select: tagList.map((name) => ({ name })),
      };
    }

    const children = content
      ? content.split("\n").map((line) => ({
          object: "block" as const,
          type: "paragraph" as const,
          paragraph: {
            rich_text: [{ type: "text" as const, text: { content: line } }],
          },
        }))
      : [];

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${integration.accessToken}`,
        "Content-Type": "application/json",
        "Notion-Version": "2022-06-28",
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
        children,
      }),
    });

    const data = (await notionRes.json()) as {
      id?: string;
      url?: string;
      message?: string;
    };

    if (!notionRes.ok) {
      return {
        success: false,
        output: {},
        error: `Notion API error: ${data.message ?? notionRes.statusText}`,
      };
    }

    logger.info(`Notion page created: ${data.id}`);

    return {
      success: true,
      output: {
        pageId: data.id,
        pageUrl: data.url,
        title,
      },
    };
  }
}

IntegrationRegistry.register(new NotionCreateHandler());
