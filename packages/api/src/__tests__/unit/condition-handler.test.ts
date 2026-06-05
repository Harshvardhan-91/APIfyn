import {
  evaluateCondition,
  resolveField,
  IfConditionHandler,
  FilterHandler,
  SwitchHandler,
} from "../../integrations/handlers/condition.handler";
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

describe("evaluateCondition", () => {
  it("equals: matches identical strings", () => {
    expect(evaluateCondition("hello", "equals", "hello")).toBe(true);
    expect(evaluateCondition("hello", "equals", "world")).toBe(false);
  });

  it("not_equals: matches different strings", () => {
    expect(evaluateCondition("hello", "not_equals", "world")).toBe(true);
    expect(evaluateCondition("same", "not_equals", "same")).toBe(false);
  });

  it("contains: checks substring presence", () => {
    expect(evaluateCondition("hello world", "contains", "world")).toBe(true);
    expect(evaluateCondition("hello", "contains", "xyz")).toBe(false);
  });

  it("not_contains: checks substring absence", () => {
    expect(evaluateCondition("hello", "not_contains", "xyz")).toBe(true);
    expect(evaluateCondition("hello world", "not_contains", "world")).toBe(false);
  });

  it("starts_with: checks prefix", () => {
    expect(evaluateCondition("hello world", "starts_with", "hello")).toBe(true);
    expect(evaluateCondition("hello", "starts_with", "world")).toBe(false);
  });

  it("ends_with: checks suffix", () => {
    expect(evaluateCondition("hello world", "ends_with", "world")).toBe(true);
    expect(evaluateCondition("hello", "ends_with", "world")).toBe(false);
  });

  it("greater_than: compares numbers", () => {
    expect(evaluateCondition("10", "greater_than", "5")).toBe(true);
    expect(evaluateCondition("3", "greater_than", "5")).toBe(false);
    expect(evaluateCondition("5", "greater_than", "5")).toBe(false);
  });

  it("less_than: compares numbers", () => {
    expect(evaluateCondition("3", "less_than", "5")).toBe(true);
    expect(evaluateCondition("10", "less_than", "5")).toBe(false);
  });

  it("is_empty: checks empty string", () => {
    expect(evaluateCondition("", "is_empty", "")).toBe(true);
    expect(evaluateCondition("hello", "is_empty", "")).toBe(false);
  });

  it("is_not_empty: checks non-empty string", () => {
    expect(evaluateCondition("hello", "is_not_empty", "")).toBe(true);
    expect(evaluateCondition("", "is_not_empty", "")).toBe(false);
  });

  it("unknown operator defaults to true", () => {
    expect(evaluateCondition("anything", "unknown_op", "value")).toBe(true);
  });
});

describe("resolveField", () => {
  it("resolves top-level keys", () => {
    expect(resolveField({ name: "test" }, "name")).toBe("test");
  });

  it("resolves nested keys with dot notation", () => {
    const data = { user: { profile: { name: "Alice" } } };
    expect(resolveField(data, "user.profile.name")).toBe("Alice");
  });

  it("returns empty string for missing paths", () => {
    expect(resolveField({ a: 1 }, "b.c")).toBe("");
  });

  it("handles null intermediate values", () => {
    expect(resolveField({ a: null } as any, "a.b")).toBe("");
  });

  it("converts numbers to string", () => {
    expect(resolveField({ count: 42 }, "count")).toBe("42");
  });
});

describe("IfConditionHandler", () => {
  const handler = new IfConditionHandler();

  it("passes through when no field/operator configured", async () => {
    const ctx = makeCtx({}, { data: "test" });
    const result = await handler.execute({}, ctx);
    expect(result.success).toBe(true);
    expect(result.output.matched).toBe(true);
  });

  it("returns matched=true when condition is met", async () => {
    const ctx = makeCtx({}, { status: "active" });
    const result = await handler.execute(
      { field: "status", operator: "equals", value: "active" },
      ctx,
    );
    expect(result.success).toBe(true);
    expect(result.output.matched).toBe(true);
  });

  it("returns skipped when condition is not met", async () => {
    const ctx = makeCtx({}, { status: "inactive" });
    const result = await handler.execute(
      { field: "status", operator: "equals", value: "active" },
      ctx,
    );
    expect(result.success).toBe(true);
    expect(result.output.skipped).toBe(true);
    expect(result.output.reason).toContain("Condition not met");
  });

  it("resolves field from triggerPayload when not in previousOutput", async () => {
    const ctx = makeCtx({ event: "push" }, {});
    const result = await handler.execute(
      { field: "event", operator: "equals", value: "push" },
      ctx,
    );
    expect(result.output.matched).toBe(true);
  });
});

describe("FilterHandler", () => {
  const handler = new FilterHandler();

  it("passes through when no field configured", async () => {
    const ctx = makeCtx({}, { data: "test" });
    const result = await handler.execute({}, ctx);
    expect(result.success).toBe(true);
    expect(result.output).toEqual(ctx.previousOutput);
  });

  it("skips when filter condition not met", async () => {
    const ctx = makeCtx({}, { count: "3" });
    const result = await handler.execute(
      { field: "count", operator: "greater_than", value: "10" },
      ctx,
    );
    expect(result.output.skipped).toBe(true);
  });
});

describe("SwitchHandler", () => {
  const handler = new SwitchHandler();

  it("matches the correct case", async () => {
    const ctx = makeCtx({}, { color: "red" });
    const result = await handler.execute(
      {
        field: "color",
        cases: [
          { value: "red", label: "Red Path" },
          { value: "blue", label: "Blue Path" },
        ],
      },
      ctx,
    );
    expect(result.output.matchedCase).toBe("Red Path");
    expect(result.output.switchValue).toBe("red");
  });

  it("returns 'default' when no case matches", async () => {
    const ctx = makeCtx({}, { color: "green" });
    const result = await handler.execute(
      {
        field: "color",
        cases: [
          { value: "red", label: "Red" },
          { value: "blue", label: "Blue" },
        ],
      },
      ctx,
    );
    expect(result.output.matchedCase).toBe("default");
  });
});
