import { resolve } from "node:path";
import { loadConfig, ConfigError } from "../config/loader.js";
import { getSpecAdapter } from "../specs/registry.js";
import { createLogger } from "../utils/logger.js";

export interface StatusOptions {
  config?: string;
}

export async function statusCommand(cwd: string, options: StatusOptions): Promise<number> {
  const logger = createLogger();
  const configPath = resolve(cwd, options.config || "biltz.yml");

  let config;
  try {
    config = await loadConfig(configPath);
  } catch (err) {
    if (err instanceof ConfigError) {
      logger.error(err.message);
    } else {
      logger.error(`Config error: ${(err as Error).message}`);
    }
    return 2;
  }

  const specAdapter = getSpecAdapter(config.spec);
  if (!specAdapter) {
    logger.error(`Unknown spec: ${config.spec}`);
    return 2;
  }

  const files = await specAdapter.discoverFiles(cwd);
  if (files.length === 0) {
    logger.warn("No tasks.md files found.");
    return 0;
  }

  let total = 0;
  let done = 0;
  let doing = 0;
  let failed = 0;
  let pending = 0;

  for (const f of files) {
    const tasks = await specAdapter.parseFile(f);
    if (tasks.length === 0) continue;
    logger.info(f);
    for (const t of tasks) {
      total++;
      const icon =
        t.status === "done" ? "[x]" : t.status === "doing" ? "[DOING]" : t.status === "failed" ? "[FAILED]" : "[ ]";
      if (t.status === "done") done++;
      if (t.status === "doing") doing++;
      if (t.status === "failed") failed++;
      if (t.status === "pending") pending++;
      logger.info(`  ${icon} ${t.id} ${t.description} [${t.difficulty}]`);
    }
  }

  logger.info("");
  logger.info(`Summary: ${done} done, ${doing} doing, ${failed} failed, ${pending} pending (total ${total})`);
  return 0;
}
