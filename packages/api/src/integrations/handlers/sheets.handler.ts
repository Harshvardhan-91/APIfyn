import { prisma } from "../../db";
import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

async function refreshGoogleToken(
  refreshToken: string,
): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_API_CLIENT_ID ?? "",
      client_secret: process.env.GOOGLE_API_CLIENT_SECRET ?? "",
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string };
  return data.access_token ?? null;
}

function extractSpreadsheetId(urlOrId: string): string {
  const match = urlOrId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match?.[1] ?? urlOrId;
}

export class SheetsAddHandler implements IntegrationHandler {
  blockId = "sheets-add";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const spreadsheetUrl = config.spreadsheetUrl as string;
    if (!spreadsheetUrl) {
      return {
        success: false,
        output: {},
        error: "Spreadsheet URL or ID is required",
      };
    }

    const integration = await prisma.integration.findFirst({
      where: { userId: ctx.userId, type: "GOOGLE_SHEETS" },
    });

    if (!integration?.refreshToken) {
      return {
        success: false,
        output: {},
        error: "Google Sheets not connected. Please connect Google in the Integrations page.",
      };
    }

    const accessToken = await refreshGoogleToken(integration.refreshToken);
    if (!accessToken) {
      return {
        success: false,
        output: {},
        error: "Failed to refresh Google access token. Please reconnect Google.",
      };
    }

    const spreadsheetId = extractSpreadsheetId(spreadsheetUrl);
    const sheetName = fillTemplate(
      (config.sheetName as string) || "Sheet1",
      ctx,
    );
    const valuesRaw = fillTemplate((config.values as string) || "", ctx);

    const values = valuesRaw
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean);

    if (values.length === 0) {
      return {
        success: false,
        output: {},
        error: "No values provided to append",
      };
    }

    const range = `${sheetName}!A1`;
    const writeMode = (config.writeMode as string) || "append";

    const url =
      writeMode === "update"
        ? `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`
        : `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;

    const sheetsRes = await fetch(url, {
      method: writeMode === "update" ? "PUT" : "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        values: [values],
      }),
    });

    const data = (await sheetsRes.json()) as {
      updates?: { updatedRows?: number };
      error?: { message?: string };
    };

    if (!sheetsRes.ok) {
      return {
        success: false,
        output: {},
        error: `Google Sheets API error: ${data.error?.message ?? sheetsRes.statusText}`,
      };
    }

    logger.info(
      `Appended row to sheet ${spreadsheetId}/${sheetName}: ${values.join(", ")}`,
    );

    return {
      success: true,
      output: {
        spreadsheetId,
        sheetName,
        valuesWritten: values,
        updatedRows: data.updates?.updatedRows ?? 1,
      },
    };
  }
}

IntegrationRegistry.register(new SheetsAddHandler());
