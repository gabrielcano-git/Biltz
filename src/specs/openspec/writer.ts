import { readFile } from "node:fs/promises";
import { writeAtomic } from "../../utils/fs.js";
import { parseTasks } from "./parser.js";
import type { Task, Status } from "../types.js";

export async function rewriteStatus(task: Task, newStatus: Status): Promise<void> {
  const content = await readFile(task.file, "utf-8");
  const lines = content.split("\n");

  let lineIndex = task.lineNumber - 1;
  let targetLine = lines[lineIndex];

  // Verify raw matches; if not, reparse and relocate by id
  if (!targetLine || targetLine !== task.raw) {
    const refreshed = parseTasks(content, task.file);
    const found = refreshed.find((t) => t.id === task.id);
    if (!found) {
      throw new Error(`Task ${task.id} not found in ${task.file}`);
    }
    lineIndex = found.lineNumber - 1;
    targetLine = lines[lineIndex];
  }

  const newRaw = replaceStatusInLine(targetLine, newStatus);
  lines[lineIndex] = newRaw;

  await writeAtomic(task.file, lines.join("\n"));
}

function replaceStatusInLine(line: string, status: Status): string {
  const statusStr = statusToBracket(status);
  // Replace the first bracket group after "- ["
  return line.replace(/^(\s*-\s)\[(?:[ xX]|DOING|FAILED)\]/, `$1[${statusStr}]`);
}

function statusToBracket(s: Status): string {
  switch (s) {
    case "done":
      return "x";
    case "doing":
      return "DOING";
    case "failed":
      return "FAILED";
    case "pending":
    default:
      return " ";
  }
}
