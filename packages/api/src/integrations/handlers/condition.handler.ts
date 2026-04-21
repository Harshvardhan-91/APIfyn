import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

export class IfConditionHandler implements IntegrationHandler {
  blockId = "if-condition";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const field = config.field as string;
    const operator = config.operator as string;
    const value = config.value as string;

    if (!field || !operator) {
      return { success: true, output: { matched: true, ...ctx.previousOutput } };
    }

    const actual = String(ctx.previousOutput[field] ?? "");
    let matched = false;

    switch (operator) {
      case "equals":
        matched = actual === value;
        break;
      case "not_equals":
        matched = actual !== value;
        break;
      case "contains":
        matched = actual.includes(value);
        break;
      case "not_contains":
        matched = !actual.includes(value);
        break;
      case "starts_with":
        matched = actual.startsWith(value);
        break;
      case "ends_with":
        matched = actual.endsWith(value);
        break;
      default:
        matched = true;
    }

    return { success: true, output: { matched, ...ctx.previousOutput } };
  }
}

export class FilterHandler implements IntegrationHandler {
  blockId = "filter";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const field = config.field as string;
    const operator = config.operator as string;
    const value = config.value as string;

    if (!field) {
      return { success: true, output: ctx.previousOutput };
    }

    const actual = String(ctx.previousOutput[field] ?? "");
    let pass = true;

    if (operator === "equals") pass = actual === value;
    else if (operator === "contains") pass = actual.includes(value ?? "");

    if (!pass) {
      return {
        success: true,
        output: { filtered: true, skipped: true },
      };
    }

    return { success: true, output: { filtered: false, ...ctx.previousOutput } };
  }
}

export class SwitchHandler implements IntegrationHandler {
  blockId = "switch";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    // TODO: Implement multi-branch switch logic
    return { success: true, output: ctx.previousOutput };
  }
}

IntegrationRegistry.register(new IfConditionHandler());
IntegrationRegistry.register(new FilterHandler());
IntegrationRegistry.register(new SwitchHandler());
