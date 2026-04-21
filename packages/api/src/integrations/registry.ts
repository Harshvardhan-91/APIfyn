import type { IntegrationHandler } from "./base";
import { createLogger } from "../utils/logger";

const logger = createLogger();

class IntegrationRegistryImpl {
  private handlers = new Map<string, IntegrationHandler>();

  register(handler: IntegrationHandler): void {
    this.handlers.set(handler.blockId, handler);
    logger.info(`Registered handler for block: ${handler.blockId}`);
  }

  get(blockId: string): IntegrationHandler | undefined {
    return this.handlers.get(blockId);
  }

  has(blockId: string): boolean {
    return this.handlers.has(blockId);
  }

  listBlockIds(): string[] {
    return Array.from(this.handlers.keys());
  }
}

export const IntegrationRegistry = new IntegrationRegistryImpl();
