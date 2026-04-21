import { createLogger } from "../../utils/logger";
import type { BlockContext, BlockResult, IntegrationHandler } from "../base";
import { IntegrationRegistry } from "../registry";
import { fillTemplate } from "../template";

const logger = createLogger();

export class FormatterHandler implements IntegrationHandler {
  blockId = "formatter";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const operation = (config.operation as string) || "template";
    const template = (config.template as string) || "";
    const fieldName = (config.outputField as string) || "formatted";

    try {
      let result: string;

      switch (operation) {
        case "template":
          result = fillTemplate(template, ctx);
          break;

        case "json_stringify":
          result = JSON.stringify(ctx.previousOutput, null, 2);
          break;

        case "uppercase": {
          const field = (config.field as string) || "";
          const val = String(ctx.previousOutput[field] ?? "");
          result = val.toUpperCase();
          break;
        }

        case "lowercase": {
          const field = (config.field as string) || "";
          const val = String(ctx.previousOutput[field] ?? "");
          result = val.toLowerCase();
          break;
        }

        case "trim": {
          const field = (config.field as string) || "";
          const val = String(ctx.previousOutput[field] ?? "");
          result = val.trim();
          break;
        }

        case "extract_json": {
          const jsonField = (config.field as string) || "";
          const jsonPath = (config.jsonPath as string) || "";
          let data = ctx.previousOutput[jsonField];
          if (typeof data === "string") {
            try {
              data = JSON.parse(data);
            } catch {
              return {
                success: false,
                output: {},
                error: `Field "${jsonField}" is not valid JSON`,
              };
            }
          }
          const parts = jsonPath.split(".");
          let current: unknown = data;
          for (const part of parts) {
            if (current == null || typeof current !== "object") {
              current = undefined;
              break;
            }
            current = (current as Record<string, unknown>)[part];
          }
          result = String(current ?? "");
          break;
        }

        default:
          result = fillTemplate(template, ctx);
      }

      return {
        success: true,
        output: { ...ctx.previousOutput, [fieldName]: result },
      };
    } catch (err) {
      return {
        success: false,
        output: {},
        error: err instanceof Error ? err.message : "Formatter failed",
      };
    }
  }
}

export class CodeHandler implements IntegrationHandler {
  blockId = "code";

  async execute(
    config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    const code = (config.code as string) || "";

    if (!code.trim()) {
      return { success: true, output: ctx.previousOutput };
    }

    try {
      const fn = new Function(
        "input",
        "trigger",
        `"use strict";
        const output = {};
        ${code}
        return output;`,
      );

      const result = fn(ctx.previousOutput, ctx.triggerPayload);

      if (result && typeof result === "object") {
        return {
          success: true,
          output: { ...ctx.previousOutput, ...result },
        };
      }

      return { success: true, output: ctx.previousOutput };
    } catch (err) {
      return {
        success: false,
        output: {},
        error: `Code execution error: ${err instanceof Error ? err.message : "Unknown error"}`,
      };
    }
  }
}

export class LoggerHandler implements IntegrationHandler {
  blockId = "logger";

  async execute(
    _config: Record<string, unknown>,
    ctx: BlockContext,
  ): Promise<BlockResult> {
    logger.info(`[LogBlock] workflow=${ctx.workflowId}`, ctx.previousOutput);
    return { success: true, output: ctx.previousOutput };
  }
}

IntegrationRegistry.register(new FormatterHandler());
IntegrationRegistry.register(new CodeHandler());
IntegrationRegistry.register(new LoggerHandler());
