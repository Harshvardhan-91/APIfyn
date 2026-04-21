import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class SheetsAddHandler implements IntegrationHandler {
  blockId = "sheets-add";

  async execute(
    _config: Record<string, unknown>,
    _ctx: BlockContext,
  ): Promise<BlockResult> {
    // TODO: Implement Google Sheets append via Sheets API v4
    return {
      success: true,
      output: { message: "Google Sheets integration not yet implemented" },
    };
  }
}

IntegrationRegistry.register(new SheetsAddHandler());
