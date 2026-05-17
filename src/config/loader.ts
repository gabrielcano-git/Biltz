import { readFile } from "node:fs/promises";
import { parse } from "yaml";
import { Config, type BiltzConfig } from "./schema.js";
import { getAgentAdapter } from "../agents/registry.js";
import { which } from "../utils/which.js";

export class ConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigError";
  }
}

export async function loadConfig(path: string): Promise<BiltzConfig> {
  let raw: string;
  try {
    raw = await readFile(path, "utf-8");
  } catch (err) {
    throw new ConfigError(`Failed to read config at ${path}: ${(err as Error).message}`);
  }

  let parsed: unknown;
  try {
    parsed = parse(raw);
  } catch (err) {
    throw new ConfigError(`Invalid YAML in ${path}: ${(err as Error).message}`);
  }

  const result = Config.safeParse(parsed);
  if (!result.success) {
    const issues = result.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new ConfigError(`Config validation failed: ${issues}`);
  }

  const config = result.data;

  // Cross-validation: routing agents must be in agents list
  for (const level of ["easy", "medium", "hard"] as const) {
    const route = config.routing[level];
    if (!config.agents.includes(route.agent)) {
      throw new ConfigError(`Routing.${level}.agent "${route.agent}" is not in agents list`);
    }
    if (route.fallbacks) {
      for (const fb of route.fallbacks) {
        if (!config.agents.includes(fb.agent)) {
          throw new ConfigError(`Fallback agent "${fb.agent}" in routing.${level} is not in agents list`);
        }
      }
    }
  }

  return config;
}

export async function validateAgentsInPath(config: BiltzConfig): Promise<string[]> {
  const missing: string[] = [];
  for (const name of config.agents) {
    const adapter = getAgentAdapter(name);
    if (!adapter) {
      missing.push(name);
      continue;
    }
    const installed = await adapter.isInstalled();
    if (!installed) missing.push(name);
  }
  return missing;
}
