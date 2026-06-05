import { fillTemplate } from "../../integrations/template";
import type { BlockContext } from "../../integrations/base";

function makeCtx(
  triggerPayload: Record<string, unknown> = {},
  previousOutput: Record<string, unknown> = {},
): BlockContext {
  return {
    workflowId: "wf-1",
    executionId: "exec-1",
    userId: "user-1",
    triggerPayload,
    previousOutput,
  };
}

describe("fillTemplate", () => {
  it("returns empty string for empty/falsy template", () => {
    expect(fillTemplate("", makeCtx())).toBe("");
    expect(fillTemplate(null as any, makeCtx())).toBe("");
    expect(fillTemplate(undefined as any, makeCtx())).toBe("");
  });

  it("returns template as-is when no placeholders", () => {
    expect(fillTemplate("Hello World", makeCtx())).toBe("Hello World");
  });

  it("replaces variables from previousOutput", () => {
    const ctx = makeCtx({}, { name: "Alice", channel: "#general" });
    expect(fillTemplate("Hello {{name}} in {{channel}}", ctx)).toBe(
      "Hello Alice in #general",
    );
  });

  it("replaces payload.* variables from triggerPayload", () => {
    const ctx = makeCtx(
      { repository: { full_name: "user/repo" } },
      {},
    );
    expect(
      fillTemplate("Repo: {{payload.repository.full_name}}", ctx),
    ).toBe("Repo: user/repo");
  });

  it("resolves deeply nested payload paths", () => {
    const ctx = makeCtx(
      { a: { b: { c: { d: "deep-value" } } } },
      {},
    );
    expect(fillTemplate("{{payload.a.b.c.d}}", ctx)).toBe("deep-value");
  });

  it("falls back to triggerPayload for unresolved keys", () => {
    const ctx = makeCtx({ commit: { message: "fix bug" } }, {});
    expect(fillTemplate("{{commit.message}}", ctx)).toBe("fix bug");
  });

  it("returns empty string for missing keys", () => {
    const ctx = makeCtx({}, {});
    expect(fillTemplate("Value: {{missing_key}}", ctx)).toBe("Value: ");
  });

  it("handles mixed previousOutput and payload references", () => {
    const ctx = makeCtx(
      { event: "push" },
      { message: "Deployed" },
    );
    expect(fillTemplate("{{message}} on {{event}}", ctx)).toBe(
      "Deployed on push",
    );
  });

  it("handles whitespace in placeholder keys", () => {
    const ctx = makeCtx({}, { name: "Bob" });
    expect(fillTemplate("{{ name }}", ctx)).toBe("Bob");
  });

  it("handles numeric values by converting to string", () => {
    const ctx = makeCtx({}, { count: 42 });
    expect(fillTemplate("Count: {{count}}", ctx)).toBe("Count: 42");
  });

  it("handles null values in payload path gracefully", () => {
    const ctx = makeCtx({ user: null }, {});
    expect(fillTemplate("{{payload.user.name}}", ctx)).toBe("");
  });

  it("handles multiple occurrences of same placeholder", () => {
    const ctx = makeCtx({}, { word: "test" });
    expect(fillTemplate("{{word}} and {{word}}", ctx)).toBe("test and test");
  });
});
