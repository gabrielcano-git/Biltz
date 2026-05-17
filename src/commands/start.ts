import { resolve } from "node:path";
import { loadConfig, validateAgentsInPath, ConfigError } from "../config/loader.js";
import { getSpecAdapter } from "../specs/registry.js";
import { getAgentAdapter } from "../agents/registry.js";
import { acquireLock } from "../orchestrator/lock.js";
import { runLoop } from "../orchestrator/loop.js";
import { createLogger } from "../utils/logger.js";
import { ensureDir } from "../utils/fs.js";
import type { AgentAdapter } from "../agents/types.js";

export interface StartOptions {
  config?: string;
  dryRun?: boolean;
  once?: boolean;
  maxParallel?: number;
  verbose?: boolean;
}

export async function startCommand(cwd: string, options: StartOptions): Promise<number> {
  const logger = createLogger(options.verbose);
  const configPath = resolve(cwd, options.config || "biltz.yml");

  let config;
  try {
    config = await loadConfig(configPath);
  } catch (err) {
    if (err instanceof ConfigError) {
      logger.error(err.message);
    } else {
      logger.error(`Failed to load config: ${(err as Error).message}`);
    }
    return 2;
  }

  if (options.maxParallel !== undefined) {
    config.options.max_parallel = options.maxParallel;
  }

  const missingAgents = await validateAgentsInPath(config);
  if (missingAgents.length > 0) {
    logger.error(`Agents not found in PATH: ${missingAgents.join(", ")}`);
    return 2;
  }

  const specAdapter = getSpecAdapter(config.spec);
  if (!specAdapter) {
    logger.error(`Unknown spec: ${config.spec}`);
    return 2;
  }

  const agentAdapters: Record<string, AgentAdapter> = {};
  for (const a of config.agents) {
    const adapter = getAgentAdapter(a);
    if (adapter) agentAdapters[a] = adapter;
  }

  await ensureDir(`${cwd}/.biltz/logs`);

  let release: (() => Promise<void>) | undefined;
  try {
    release = await acquireLock(cwd, logger);
  } catch (err) {
    logger.error((err as Error).message);
    return 2;
  }

  try {
    const exitCode = await runLoop({
      cwd,
      config,
      specAdapter,
      agentAdapters,
      logger,
      dryRun: options.dryRun,
      once: options.once,
    });
    return exitCode;
  } finally {
    if (release) await release();
  }
}
