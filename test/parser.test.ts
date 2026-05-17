import { describe, it, expect } from "vitest";
import { parseTasks } from "../src/specs/openspec/parser.js";

function parse(content: string) {
  return parseTasks(content, "tasks.md");
}

describe("parseTasks", () => {
  it("returns empty for no tasks", () => {
    expect(parse("# Hello\n\nNo tasks.")).toEqual([]);
  });

  it("parses simple pending tasks", () => {
    const tasks = parse("- [ ] 1 First [E]\n- [ ] 2 Second [M]");
    expect(tasks).toHaveLength(2);
    expect(tasks[0]).toMatchObject({
      id: "1",
      description: "First",
      difficulty: "E",
      status: "pending",
      deps: [],
      lineNumber: 1,
    });
    expect(tasks[1]).toMatchObject({
      id: "2",
      description: "Second",
      difficulty: "M",
      status: "pending",
      deps: [],
      lineNumber: 2,
    });
  });

  it("parses done status", () => {
    const tasks = parse("- [x] 1 Done [E]\n- [X] 2 Also done [M]");
    expect(tasks[0].status).toBe("done");
    expect(tasks[1].status).toBe("done");
  });

  it("parses DOING and FAILED", () => {
    const tasks = parse("- [DOING] 1 Active [H]\n- [FAILED] 2 Bad [E]");
    expect(tasks[0].status).toBe("doing");
    expect(tasks[1].status).toBe("failed");
  });

  it("parses deps", () => {
    const tasks = parse("- [ ] 1 A [E] (deps: 2, 3.1)\n- [ ] 2 B [M] (deps: 1)");
    expect(tasks[0].deps).toEqual(["2", "3.1"]);
    expect(tasks[1].deps).toEqual(["1"]);
  });

  it("ignores non-task lines", () => {
    const tasks = parse("# Title\n- [ ] 1 Task [E]\nSome prose\n- [x] 2 Done [M]");
    expect(tasks).toHaveLength(2);
    expect(tasks[0].lineNumber).toBe(2);
    expect(tasks[1].lineNumber).toBe(4);
  });

  it("handles indentation", () => {
    const tasks = parse("  - [ ] 1.1 Indented [M] (deps: 1)");
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe("1.1");
  });
});
