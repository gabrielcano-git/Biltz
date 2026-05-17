import type { Task, Status } from "../specs/types.js";

export type TaskKey = string; // file::id

export function taskKey(task: Task): TaskKey {
  return `${task.file}::${task.id}`;
}

export function selectEligible(tasks: Task[]): Task[] {
  const byKey = new Map<TaskKey, Task>();
  for (const t of tasks) byKey.set(taskKey(t), t);

  const done = new Set<TaskKey>();
  for (const t of tasks) if (t.status === "done") done.add(taskKey(t));

  const eligible: Task[] = [];
  for (const t of tasks) {
    if (t.status !== "pending") continue;
    const satisfied = t.deps.every((d) => {
      const depKey = `${t.file}::${d}`;
      return done.has(depKey);
    });
    if (satisfied) eligible.push(t);
  }

  return eligible;
}

export function detectDeadlock(tasks: Task[]): boolean {
  const doing = tasks.some((t) => t.status === "doing");
  const eligible = selectEligible(tasks);
  const allDone = tasks.every((t) => t.status === "done");
  return !allDone && !doing && eligible.length === 0;
}

export function detectCycle(tasks: Task[]): boolean {
  const byFileId = new Map<string, Task>();
  for (const t of tasks) byFileId.set(`${t.file}::${t.id}`, t);

  const visited = new Set<string>();
  const recStack = new Set<string>();

  function dfs(key: string): boolean {
    visited.add(key);
    recStack.add(key);
    const task = byFileId.get(key);
    if (task) {
      for (const d of task.deps) {
        const depKey = `${task.file}::${d}`;
        if (!visited.has(depKey)) {
          if (dfs(depKey)) return true;
        } else if (recStack.has(depKey)) {
          return true;
        }
      }
    }
    recStack.delete(key);
    return false;
  }

  for (const key of byFileId.keys()) {
    if (!visited.has(key)) {
      if (dfs(key)) return true;
    }
  }
  return false;
}
