import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";

function evaluateCondition(
  actual: string,
  operator: string,
  value: string,
): boolean {
  switch (operator) {
    case "equals":
      return actual === value;
    case "not_equals":
      return actual !== value;
    case "contains":
      return actual.includes(value);
    case "not_contains":
      return !actual.includes(value);
    case "starts_with":
      return actual.startsWith(value);
    case "ends_with":
      return actual.endsWith(value);
    case "greater_than":
      return Number(actual) > Number(value);
    case "less_than":
      return Number(actual) < Number(value);
    case "is_empty":
      return actual === "";
    case "is_not_empty":
      return actual !== "";
    default:
      return true;
  }
}

function resolveField(
  data: Record<string, unknown>,
  field: string,
): string {
  const parts = field.split(".");
  let current: unknown = data;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return "";
    current = (current as Record<string, unknown>)[part];
  }
  return String(current ?? "");
}

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
      return {
        success: true,
        output: { matched: true, ...ctx.previousOutput },
      };
    }

    const actual =
      resolveField(ctx.previousOutput, field) ||
      resolveField(ctx.triggerPayload, field);
    const matched = evaluateCondition(actual, operator, value);

    if (!matched) {
      return {
        success: true,
        output: {
          skipped: true,
          reason: `Condition not met: "${field}" ${operator} "${value}" (actual: "${actual}")`,
        },
      };
    }

    return {
      success: true,
      output: { matched: true, ...ctx.previousOutput },
    };
  }
}

export class FilterHandler implements IntegrationHandler {
  blockId = "filter";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const field = config.field as string;
    const operator = (config.operator as string) || "equals";
    const value = (config.value as string) || "";

    if (!field) {
      return { success: true, output: ctx.previousOutput };
    }

    const actual =
      resolveField(ctx.previousOutput, field) ||
      resolveField(ctx.triggerPayload, field);
    const pass = evaluateCondition(actual, operator, value);

    if (!pass) {
      return {
        success: true,
        output: {
          skipped: true,
          reason: `Filter: "${field}" ${operator} "${value}" did not match (actual: "${actual}")`,
        },
      };
    }

    return {
      success: true,
      output: { filtered: false, ...ctx.previousOutput },
    };
  }
}

export class SwitchHandler implements IntegrationHandler {
  blockId = "switch";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const field = config.field as string;

    if (!field) {
      return { success: true, output: ctx.previousOutput };
    }

    const actual =
      resolveField(ctx.previousOutput, field) ||
      resolveField(ctx.triggerPayload, field);

    const cases = (config.cases ?? []) as Array<{
      value: string;
      label: string;
    }>;

    const matchedCase = cases.find((c) => c.value === actual);

    return {
      success: true,
      output: {
        switchField: field,
        switchValue: actual,
        matchedCase: matchedCase?.label ?? "default",
        ...ctx.previousOutput,
      },
    };
  }
}

IntegrationRegistry.register(new IfConditionHandler());
IntegrationRegistry.register(new FilterHandler());
IntegrationRegistry.register(new SwitchHandler());
