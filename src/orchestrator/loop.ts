import type { SpecAdapter, Task } from "../specs/types.js";
import type { AgentAdapter } from "../agents/types.js";
import type { BiltzConfig } from "../config/schema.js";
import type { Logger } from "../utils/logger.js";
import { selectEligible, detectDeadlock, detectCycle, taskKey } from "./scheduler.js";
import { resolveRoute, getFallbackChain } from "./router.js";
import { runAgent, type RunResult } from "./runner.js";
import { shouldStopOnFailure } from "./failure.js";
import { buildTaskPrompt } from "../agents/prompt.js";
import { existsSync, unlinkSync } from "node:fs";
import { join } from "node:path";

export interface LoopContext {
  cwd: string;
  config: BiltzConfig;
  specAdapter: SpecAdapter;
  agentAdapters: Record<string, AgentAdapter>;
  logger: Logger;
  dryRun?: boolean;
  once?: boolean;
}

export async function runLoop(ctx: LoopContext): Promise<number> {
  const { cwd, config, specAdapter, agentAdapters, logger, dryRun, once } = ctx;

  const files = await specAdapter.discoverFiles(cwd);
  if (files.length === 0) {
    logger.warn("No tasks.md files found");
    return 0;
  }

  let allTasks: Task[] = [];
  for (const f of files) {
    const tasks = await specAdapter.parseFile(f);
    allTasks.push(...tasks);
  }

  if (detectCycle(allTasks)) {
    logger.error("Dependency cycle detected");
    return 3;
  }

  if (allTasks.every((t) => t.status === "done")) {
    logger.info("All tasks are done. Nothing to do.");
    return 0;
  }

  let stopped = false;
  const stopFile = join(cwd, ".biltz", "stop");

  const handleSigint = () => {
    logger.info("SIGINT received, stopping gracefully after current task...");
    stopped = true;
  };
  process.on("SIGINT", handleSigint);

  try {
    while (!stopped) {
      if (existsSync(stopFile)) {
        logger.info("Stop flag detected, exiting gracefully.");
        unlinkSync(stopFile);
        break;
      }

      // Refresh tasks before each iteration
      allTasks = [];
      for (const f of files) {
        const tasks = await specAdapter.parseFile(f);
        allTasks.push(...tasks);
      }

      if (allTasks.every((t) => t.status === "done")) {
        logger.info("All tasks completed.");
        return 0;
      }

      if (detectDeadlock(allTasks)) {
        logger.error("Deadlock detected: pending tasks with unsatisfied deps and nothing in progress.");
        return 3;
      }

      const eligible = selectEligible(allTasks);
      if (eligible.length === 0) {
        const doing = allTasks.filter((t) => t.status === "doing");
        if (doing.length > 0) {
          logger.debug(`Waiting for ${doing.length} task(s) in progress...`);
          await sleep(config.options.poll_interval_ms);
          continue;
        }
        logger.error("No eligible tasks and none doing — unexpected state.");
        return 3;
      }

      const parallel = Math.min(eligible.length, config.options.max_parallel);
      const batch = eligible.slice(0, parallel);

      if (once && batch.length > 0) {
        // In --once mode, run only one task
        const result = await executeTask(batch[0], ctx);
        return result;
      }

      if (parallel === 1) {
        const result = await executeTask(batch[0], ctx);
        if (result !== 0) return result;
      } else {
        const results = await Promise.allSettled(
          batch.map((t) => executeTask(t, ctx))
        );
        for (const r of results) {
          if (r.status === "rejected" || (r.status === "fulfilled" && r.value !== 0)) {
            return r.status === "fulfilled" ? r.value : 1;
          }
        }
      }
    }

    return 0;
  } finally {
    process.off("SIGINT", handleSigint);
  }
}

async function executeTask(task: Task, ctx: LoopContext): Promise<number> {
  const { config, specAdapter, agentAdapters, logger, dryRun } = ctx;

  logger.info({ task: taskKey(task) }, `Starting task ${task.id}: ${task.description}`);

  if (dryRun) {
    logger.info({ task: taskKey(task) }, "Dry-run, skipping execution");
    return 0;
  }

  await specAdapter.markDoing(task);

  const route = resolveRoute(config, task.difficulty);
  const chain = getFallbackChain(route);

  let lastResult: RunResult | undefined;

  for (const entry of chain) {
    const adapter = agentAdapters[entry.agent];
    if (!adapter) {
      logger.warn({ agent: entry.agent }, "Agent adapter not found, skipping fallback");
      continue;
    }

    const prompt = buildTaskPrompt(task);
    const { cmd, args } = adapter.buildCommand({ prompt, model: entry.model });

    logger.debug({ agent: entry.agent, model: entry.model, cmd, args }, "Spawning agent");

    lastResult = await runAgent(cmd, args, {
      timeoutSeconds: config.options.agent_timeout_seconds,
      logger,
    });

    if (lastResult.timedOut) {
      logger.warn({ task: taskKey(task) }, "Agent timed out");
      continue;
    }

    if (lastResult.exitCode === 0) {
      // Verify the agent marked it done; if not, mark it ourselves
      const isDone = await specAdapter.refreshAndEnsureDone(task);
      if (!isDone) {
        logger.warn({ task: taskKey(task) }, "Agent exited 0 but task not marked done; marking automatically");
        await specAdapter.markDone(task);
      }
      logger.info({ task: taskKey(task) }, `Task ${task.id} completed`);
      return 0;
    }

    logger.warn(
      { task: taskKey(task), exitCode: lastResult.exitCode, agent: entry.agent },
      `Agent failed, trying fallback...`
    );
  }

  // All fallbacks exhausted
  logger.error({ task: taskKey(task) }, `Task ${task.id} failed after all fallbacks`);
  await specAdapter.markFailed(task);

  if (shouldStopOnFailure(config)) {
    return 1;
  }

  return 0;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
