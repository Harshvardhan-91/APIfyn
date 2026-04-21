import type { BlockContext } from "./base";

/**
 * Replace {{variable}} placeholders with values from trigger payload
 * and previous block output. Supports nested access via dot notation.
 */
export function fillTemplate(template: string, ctx: BlockContext): string {
  if (!template) return "";

  const prev = ctx.previousOutput;
  const payload = ctx.triggerPayload;

  return template.replace(/\{\{([^}]+)\}\}/g, (_match, key: string) => {
    const trimmed = key.trim();

    if (trimmed in prev) return String(prev[trimmed] ?? "");

    if (trimmed.startsWith("payload.")) {
      const path = trimmed.slice("payload.".length).split(".");
      let current: unknown = payload;
      for (const segment of path) {
        if (current == null || typeof current !== "object") return "";
        current = (current as Record<string, unknown>)[segment];
      }
      return String(current ?? "");
    }

    const deepLookup = resolveNestedKey(payload, trimmed);
    if (deepLookup !== undefined) return String(deepLookup);

    return "";
  });
}

function resolveNestedKey(
  obj: Record<string, unknown>,
  key: string,
): unknown {
  const parts = key.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}
