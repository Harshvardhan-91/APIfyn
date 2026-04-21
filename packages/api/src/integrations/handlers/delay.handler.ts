import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

const logger = createLogger();

const UNIT_MS: Record<string, number> = {
  seconds: 1_000,
  minutes: 60_000,
  hours: 3_600_000,
};

export class DelayHandler implements IntegrationHandler {
  blockId = "delay";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const duration = Number(config.duration) || 1;
    const unit = (config.unit as string) || "seconds";
    const ms = duration * (UNIT_MS[unit] ?? 1_000);

    const capped = Math.min(ms, 5 * 60_000);
    logger.info(`Delay block: waiting ${capped}ms`);

    await new Promise((resolve) => setTimeout(resolve, capped));

    return {
      success: true,
      output: { delayed_ms: capped, ...ctx.previousOutput },
    };
  }
}

IntegrationRegistry.register(new DelayHandler());
