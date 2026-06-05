import {
  topologicalSort,
  type DefinitionBlock,
  type DefinitionConnection,
} from "../../services/workflow-executor";

function block(id: string, type = "action"): DefinitionBlock {
  return { id, type };
}

function conn(from: string, to: string): DefinitionConnection {
  return { id: `${from}->${to}`, from, to };
}

describe("topologicalSort", () => {
  it("returns empty array for empty input", () => {
    expect(topologicalSort([], [])).toEqual([]);
  });

  it("returns single block unchanged", () => {
    const blocks = [block("a")];
    const result = topologicalSort(blocks, []);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe("a");
  });

  it("sorts a linear chain A -> B -> C", () => {
    const blocks = [block("c"), block("a"), block("b")];
    const connections = [conn("a", "b"), conn("b", "c")];

    const result = topologicalSort(blocks, connections);
    const ids = result.map((b) => b.id);

    expect(ids.indexOf("a")).toBeLessThan(ids.indexOf("b"));
    expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("c"));
  });

  it("sorts a diamond DAG: A -> B, A -> C, B -> D, C -> D", () => {
    const blocks = [block("d"), block("b"), block("c"), block("a")];
    const connections = [
      conn("a", "b"),
      conn("a", "c"),
      conn("b", "d"),
      conn("c", "d"),
    ];

    const result = topologicalSort(blocks, connections);
    const ids = result.map((b) => b.id);

    expect(ids.indexOf("a")).toBeLessThan(ids.indexOf("b"));
    expect(ids.indexOf("a")).toBeLessThan(ids.indexOf("c"));
    expect(ids.indexOf("b")).toBeLessThan(ids.indexOf("d"));
    expect(ids.indexOf("c")).toBeLessThan(ids.indexOf("d"));
  });

  it("handles disconnected components", () => {
    const blocks = [block("a"), block("b"), block("x"), block("y")];
    const connections = [conn("a", "b"), conn("x", "y")];

    const result = topologicalSort(blocks, connections);
    const ids = result.map((b) => b.id);

    expect(ids.indexOf("a")).toBeLessThan(ids.indexOf("b"));
    expect(ids.indexOf("x")).toBeLessThan(ids.indexOf("y"));
    expect(result).toHaveLength(4);
  });

  it("handles blocks with no connections (all independent)", () => {
    const blocks = [block("a"), block("b"), block("c")];
    const result = topologicalSort(blocks, []);
    expect(result).toHaveLength(3);
  });

  it("handles a cycle gracefully by appending unvisited nodes", () => {
    const blocks = [block("a"), block("b"), block("c")];
    const connections = [conn("a", "b"), conn("b", "c"), conn("c", "a")];

    const result = topologicalSort(blocks, connections);
    expect(result).toHaveLength(3);
    const ids = result.map((b) => b.id);
    expect(ids).toContain("a");
    expect(ids).toContain("b");
    expect(ids).toContain("c");
  });

  it("preserves block metadata through sorting", () => {
    const blocks: DefinitionBlock[] = [
      { id: "trigger", type: "github-trigger", config: { repo: "test" } },
      { id: "action", type: "slack-send", config: { channel: "#general" } },
    ];
    const connections = [conn("trigger", "action")];

    const result = topologicalSort(blocks, connections);
    expect(result[0].type).toBe("github-trigger");
    expect(result[0].config).toEqual({ repo: "test" });
    expect(result[1].type).toBe("slack-send");
  });

  it("handles large linear chain correctly", () => {
    const n = 100;
    const blocks = Array.from({ length: n }, (_, i) => block(`n${i}`));
    const connections = Array.from({ length: n - 1 }, (_, i) =>
      conn(`n${i}`, `n${i + 1}`),
    );

    const result = topologicalSort(blocks, connections);
    expect(result).toHaveLength(n);
    for (let i = 0; i < n - 1; i++) {
      const idx1 = result.findIndex((b) => b.id === `n${i}`);
      const idx2 = result.findIndex((b) => b.id === `n${i + 1}`);
      expect(idx1).toBeLessThan(idx2);
    }
  });
});
