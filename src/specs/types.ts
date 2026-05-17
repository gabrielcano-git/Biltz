export type Status = "pending" | "doing" | "done" | "failed";
export type Difficulty = "E" | "M" | "H";

export type Task = {
  file: string;
  id: string;
  description: string;
  difficulty: Difficulty;
  status: Status;
  deps: string[];
  lineNumber: number;
  raw: string;
};

export interface SpecAdapter {
  name: string;
  discoverFiles(cwd: string): Promise<string[]>;
  parseFile(path: string): Promise<Task[]>;
  markDoing(task: Task): Promise<void>;
  markDone(task: Task): Promise<void>;
  markFailed(task: Task): Promise<void>;
  revertDoing(task: Task): Promise<void>;
  refreshAndEnsureDone(task: Task): Promise<boolean>;
}
