import { spawn } from "node:child_process";
import type { Logger } from "../utils/logger.js";

export interface RunResult {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  timedOut: boolean;
}

export async function runAgent(
  cmd: string,
  args: string[],
  options: {
    timeoutSeconds: number;
    logger: Logger;
    signal?: AbortSignal;
  }
): Promise<RunResult> {
  const { timeoutSeconds, logger, signal } = options;
  return new Promise((resolve) => {
    const child = spawn(cmd, args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      logger.warn({ cmd, timeout: timeoutSeconds }, "Agent timed out, killing...");
      child.kill("SIGTERM");
      setTimeout(() => child.kill("SIGKILL"), 5000);
    }, timeoutSeconds * 1000);

    child.stdout?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      stdout += text;
      logger.debug({ stream: "stdout" }, text.trimEnd());
    });

    child.stderr?.on("data", (chunk: Buffer) => {
      const text = chunk.toString("utf-8");
      stderr += text;
      logger.debug({ stream: "stderr" }, text.trimEnd());
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      resolve({ exitCode: null, stdout, stderr: stderr || err.message, timedOut });
    });

    child.on("close", (code) => {
      clearTimeout(timer);
      resolve({ exitCode: code, stdout, stderr, timedOut });
    });

    if (signal) {
      signal.addEventListener("abort", () => {
        clearTimeout(timer);
        child.kill("SIGTERM");
      });
    }
  });
}
