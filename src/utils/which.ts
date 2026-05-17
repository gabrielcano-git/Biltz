import { execFile } from "node:child_process";

export async function which(cmd: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile("which", [cmd], (err, stdout) => {
      if (err) {
        resolve(null);
        return;
      }
      resolve(stdout.trim() || null);
    });
  });
}
