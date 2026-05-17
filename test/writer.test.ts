import { describe, it, expect } from "vitest";
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { rewriteStatus } from "../src/specs/openspec/writer.js";
import { parseTasks } from "../src/specs/openspec/parser.js";
import type { Task } from "../src/specs/types.js";

function createTempFile(content: string): string {
  const dir = mkdtempSync(join(tmpdir(), "biltz-test-"));
  const path = join(dir, "tasks.md");
  writeFileSync(path, content, "utf-8");
  return path;
}

function cleanup(path: string) {
  rmSync(path, { force: true });
  rmSync(path + ".tmp", { force: true });
}

function taskFrom(path: string, id: string): Task {
  const content = readFileSync(path, "utf-8");
  const tasks = parseTasks(content, path);
  const t = tasks.find((x) => x.id === id);
  if (!t) throw new Error(`Task ${id} not found`);
  return t;
}

describe("rewriteStatus", () => {
  it("marks pending as doing", async () => {
    const path = createTempFile("- [ ] 1 Task [E]\n");
    const t = taskFrom(path, "1");
    await rewriteStatus(t, "doing");
    const updated = readFileSync(path, "utf-8");
    expect(updated).toBe("- [DOING] 1 Task [E]\n");
    cleanup(path);
  });

  it("marks doing as done", async () => {
    const path = createTempFile("- [DOING] 1 Task [E]\n");
    const t = taskFrom(path, "1");
    await rewriteStatus(t, "done");
    const updated = readFileSync(path, "utf-8");
    expect(updated).toBe("- [x] 1 Task [E]\n");
    cleanup(path);
  });

  it("marks pending as failed", async () => {
    const path = createTempFile("- [ ] 1 Task [E]\n");
    const t = taskFrom(path, "1");
    await rewriteStatus(t, "failed");
    const updated = readFileSync(path, "utf-8");
    expect(updated).toBe("- [FAILED] 1 Task [E]\n");
    cleanup(path);
  });

  it("preserves non-task lines", async () => {
    const path = createTempFile("# Title\n- [ ] 1 Task [E]\nProse\n- [x] 2 Done [M]\n");
    const t = taskFrom(path, "1");
    await rewriteStatus(t, "doing");
    const updated = readFileSync(path, "utf-8");
    expect(updated).toBe("# Title\n- [DOING] 1 Task [E]\nProse\n- [x] 2 Done [M]\n");
    cleanup(path);
  });
});
