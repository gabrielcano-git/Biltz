export function buildTaskPrompt(task: {
  id: string;
  description: string;
  difficulty: string;
  file: string;
}): string {
  return [
    `Task ID: ${task.id}`,
    `File: ${task.file}`,
    `Difficulty: ${task.difficulty}`,
    `Description: ${task.description}`,
    "",
    "Instructions:",
    "1. Implement the task described above.",
    "2. When finished, update the task status to [x] in the tasks.md file.",
    "3. Do not modify anything unrelated to this task.",
  ].join("\n");
}
