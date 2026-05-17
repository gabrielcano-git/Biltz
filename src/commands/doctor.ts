import { resolve } from "node:path";
import { loadConfig, validateAgentsInPath, ConfigError } from "../config/loader.js";
import { listAgents, getAgentAdapter } from "../agents/registry.js";
import { which } from "../utils/which.js";
import { createLogger } from "../utils/logger.js";
import { execFile } from "node:child_process";

export interface DoctorOptions {
  config?: string;
}

export async function doctorCommand(cwd: string, options: DoctorOptions): Promise<number> {
  const logger = createLogger();
  const configPath = resolve(cwd, options.config || "biltz.yml");

  let config;
  try {
    config = await loadConfig(configPath);
    logger.info("Config is valid.");
  } catch (err) {
    if (err instanceof ConfigError) {
      logger.error(err.message);
    } else {
      logger.error(`Config error: ${(err as Error).message}`);
    }
    return 2;
  }

  const missingAgents = await validateAgentsInPath(config);
  if (missingAgents.length > 0) {
    logger.error(`Missing agents in PATH: ${missingAgents.join(", ")}`);
  }

  logger.info("Agent availability:");
  for (const name of listAgents()) {
    const adapter = getAgentAdapter(name);
    if (!adapter) continue;
    const path = await which(adapter.name);
    if (path) {
      const version = await getVersion(adapter.name);
      logger.info(`  ${name}: ${path} (${version || "version unknown"})`);
    } else {
      logger.warn(`  ${name}: not found in PATH`);
    }
  }

  return missingAgents.length > 0 ? 2 : 0;
}

function getVersion(cmd: string): Promise<string | null> {
  return new Promise((resolve) => {
    execFile(cmd, ["--help"], { timeout: 5000 }, (err) => {
      // Many agents return non-zero on --help; we just care if they run
      resolve(err && err.code === "ENOENT" ? null : "OK");
    });
  });
}
