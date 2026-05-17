import { describe, it, expect } from "vitest";
import { selectEligible, detectDeadlock, detectCycle, taskKey } from "../src/orchestrator/scheduler.js";
import type { Task } from "../src/specs/types.js";

function makeTask(overrides: Partial<Task>): Task {
  return {
    file: "tasks.md",
    id: "1",
    description: "Test",
    difficulty: "E",
    status: "pending",
    deps: [],
    lineNumber: 1,
    raw: "",
    ...overrides,
  };
}

describe("selectEligible", () => {
  it("selects pending tasks with no deps", () => {
    const tasks = [makeTask({ id: "1" })];
    expect(selectEligible(tasks)).toHaveLength(1);
  });

  it("selects pending tasks with satisfied deps", () => {
    const tasks = [
      makeTask({ id: "1", status: "done" }),
      makeTask({ id: "2", deps: ["1"] }),
    ];
    const eligible = selectEligible(tasks);
    expect(eligible).toHaveLength(1);
    expect(eligible[0].id).toBe("2");
  });

  it("ignores tasks with unsatisfied deps", () => {
    const tasks = [
      makeTask({ id: "1", status: "pending" }),
      makeTask({ id: "2", deps: ["1"] }),
    ];
    expect(selectEligible(tasks)).toHaveLength(1);
    expect(selectEligible(tasks)[0].id).toBe("1");
  });

  it("ignores done/doing/failed tasks", () => {
    const tasks = [
      makeTask({ id: "1", status: "done" }),
      makeTask({ id: "2", status: "doing" }),
      makeTask({ id: "3", status: "failed" }),
    ];
    expect(selectEligible(tasks)).toHaveLength(0);
  });
});

describe("detectDeadlock", () => {
  it("returns false when all done", () => {
    const tasks = [makeTask({ id: "1", status: "done" })];
    expect(detectDeadlock(tasks)).toBe(false);
  });

  it("returns false when there are eligible tasks", () => {
    const tasks = [
      makeTask({ id: "1", status: "done" }),
      makeTask({ id: "2", status: "pending", deps: ["1"] }),
    ];
    expect(detectDeadlock(tasks)).toBe(false);
  });

  it("returns false when something is doing", () => {
    const tasks = [
      makeTask({ id: "1", status: "doing" }),
      makeTask({ id: "2", status: "pending", deps: ["1"] }),
    ];
    expect(detectDeadlock(tasks)).toBe(false);
  });

  it("returns true when pending but no eligible and none doing", () => {
    const tasks = [
      makeTask({ id: "1", status: "pending", deps: ["2"] }),
      makeTask({ id: "2", status: "pending", deps: ["1"] }),
    ];
    expect(detectDeadlock(tasks)).toBe(true);
  });
});

describe("detectCycle", () => {
  it("returns false for no deps", () => {
    const tasks = [makeTask({ id: "1" }), makeTask({ id: "2" })];
    expect(detectCycle(tasks)).toBe(false);
  });

  it("returns false for acyclic deps", () => {
    const tasks = [
      makeTask({ id: "1" }),
      makeTask({ id: "2", deps: ["1"] }),
      makeTask({ id: "3", deps: ["2"] }),
    ];
    expect(detectCycle(tasks)).toBe(false);
  });

  it("returns true for self-cycle", () => {
    const tasks = [makeTask({ id: "1", deps: ["1"] })];
    expect(detectCycle(tasks)).toBe(true);
  });

  it("returns true for mutual cycle", () => {
    const tasks = [
      makeTask({ id: "1", deps: ["2"] }),
      makeTask({ id: "2", deps: ["1"] }),
    ];
    expect(detectCycle(tasks)).toBe(true);
  });
});
