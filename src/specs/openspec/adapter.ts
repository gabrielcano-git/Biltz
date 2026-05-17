import { readFile } from "node:fs/promises";
import { glob } from "tinyglobby";
import type { SpecAdapter, Task } from "../types.js";
import { parseTasks } from "./parser.js";
import { rewriteStatus } from "./writer.js";

export class OpenSpecAdapter implements SpecAdapter {
  name = "openspec";
  private fileLocks = new Map<string, Promise<void>>();

  private async withFileLock<T>(file: string, fn: () => Promise<T>): Promise<T> {
    const current = this.fileLocks.get(file) || Promise.resolve();
    const next = current.then(fn).finally(() => {
      if (this.fileLocks.get(file) === next) {
        this.fileLocks.delete(file);
      }
    });
    this.fileLocks.set(file, next);
    return next;
  }

  async discoverFiles(cwd: string): Promise<string[]> {
    const files = await glob("**/tasks.md", { cwd, absolute: true });
    return files;
  }

  async parseFile(path: string): Promise<Task[]> {
    const content = await readFile(path, "utf-8");
    return parseTasks(content, path);
  }

  async markDoing(task: Task): Promise<void> {
    await this.withFileLock(task.file, () => rewriteStatus(task, "doing"));
  }

  async markDone(task: Task): Promise<void> {
    await this.withFileLock(task.file, () => rewriteStatus(task, "done"));
  }

  async markFailed(task: Task): Promise<void> {
    await this.withFileLock(task.file, () => rewriteStatus(task, "failed"));
  }

  async revertDoing(task: Task): Promise<void> {
    await this.withFileLock(task.file, () => rewriteStatus(task, "pending"));
  }

  async refreshAndEnsureDone(task: Task): Promise<boolean> {
    const content = await readFile(task.file, "utf-8");
    const refreshed = parseTasks(content, task.file);
    const found = refreshed.find((t) => t.id === task.id);
    if (!found) return false;
    return found.status === "done";
  }
}
