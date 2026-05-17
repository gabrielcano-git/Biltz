import type { Task, Status, Difficulty } from "../types.js";

const TASK_RE =
  /^(\s*)-\s\[(?<status>[ xX]|DOING|FAILED)\]\s+(?<id>\d+(?:\.\d+)*)\s+(?<desc>.+?)\s+\[(?<diff>[EMH])\](?:\s+\(deps:\s*(?<deps>[\d.,\s]+)\))?\s*$/;

export function parseTasks(content: string, file: string): Task[] {
  const lines = content.split("\n");
  const tasks: Task[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = TASK_RE.exec(line);
    if (!match || !match.groups) continue;

    const status = parseStatus(match.groups.status);
    const diff = match.groups.diff as Difficulty;
    const deps = match.groups.deps
      ? match.groups.deps.split(",").map((d) => d.trim()).filter(Boolean)
      : [];

    tasks.push({
      file,
      id: match.groups.id,
      description: match.groups.desc.trim(),
      difficulty: diff,
      status,
      deps,
      lineNumber: i + 1,
      raw: line,
    });
  }

  return tasks;
}

function parseStatus(s: string): Status {
  if (s === "x" || s === "X") return "done";
  if (s === "DOING") return "doing";
  if (s === "FAILED") return "failed";
  return "pending";
}
