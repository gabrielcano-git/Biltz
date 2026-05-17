import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { input, select, confirm, checkbox } from "@inquirer/prompts";
import type { BiltzConfig } from "../config/schema.js";
import { writeConfig, writeConfigExample } from "../config/writer.js";
import { listAgents, getAgentAdapter } from "../agents/registry.js";
import { which } from "../utils/which.js";
import type { Logger } from "../utils/logger.js";

export interface InitOptions {
  force?: boolean;
  spec?: string;
  nonInteractive?: boolean;
  agents?: string[];
  easyAgent?: string;
  easyModel?: string;
  mediumAgent?: string;
  mediumModel?: string;
  hardAgent?: string;
  hardModel?: string;
}

export async function initCommand(cwd: string, options: InitOptions, logger: Logger): Promise<number> {
  const configPath = resolve(cwd, "biltz.yml");

  if (existsSync(configPath) && !options.force && !options.nonInteractive) {
    const overwrite = await confirm({ message: "biltz.yml already exists. Overwrite?", default: false });
    if (!overwrite) {
      logger.info("Cancelled.");
      return 0;
    }
  }

  let agents: string[] = options.agents || [];
  let easyAgent = options.easyAgent;
  let easyModel = options.easyModel;
  let mediumAgent = options.mediumAgent;
  let mediumModel = options.mediumModel;
  let hardAgent = options.hardAgent;
  let hardModel = options.hardModel;

  if (options.nonInteractive) {
    if (agents.length === 0 || !easyAgent || !easyModel || !mediumAgent || !mediumModel || !hardAgent || !hardModel) {
      logger.error("Non-interactive mode requires all flags: --agents, --easy-agent, --easy-model, --medium-agent, --medium-model, --hard-agent, --hard-model");
      return 2;
    }
  } else {
    const allAgents = listAgents();
    const installed = [];
    for (const a of allAgents) {
      const adapter = getAgentAdapter(a);
      if (adapter && (await adapter.isInstalled())) installed.push(a);
    }

    if (installed.length === 0) {
      logger.error("No agent CLIs found in PATH. Install at least one agent first.");
      return 2;
    }

    agents = await checkbox({
      message: "Select agents to enable",
      choices: installed.map((a) => ({ name: a, value: a, checked: true })),
      validate: (vals) => vals.length > 0 || "Select at least one agent",
    });

    async function askRoute(level: string): Promise<{ agent: string; model: string }> {
      const agent = await select({
        message: `Agent for ${level}`,
        choices: agents.map((a) => ({ name: a, value: a })),
      });
      const adapter = getAgentAdapter(agent)!;
      const models = adapter.availableModels();
      let model: string;
      if (models.length > 0) {
        model = await select({
          message: `Model for ${level}`,
          choices: [...models.map((m) => ({ name: m, value: m })), { name: "Other", value: "__other__" }],
        });
        if (model === "__other__") {
          model = await input({ message: `Custom model for ${level}` });
        }
      } else {
        model = await input({ message: `Model for ${level}` });
      }
      return { agent, model };
    }

    const easy = await askRoute("easy");
    easyAgent = easy.agent;
    easyModel = easy.model;

    const medium = await askRoute("medium");
    mediumAgent = medium.agent;
    mediumModel = medium.model;

    const hard = await askRoute("hard");
    hardAgent = hard.agent;
    hardModel = hard.model;
  }

  const config: BiltzConfig = {
    version: 1,
    spec: (options.spec as "openspec") || "openspec",
    agents,
    routing: {
      easy: { agent: easyAgent!, model: easyModel! },
      medium: { agent: mediumAgent!, model: mediumModel! },
      hard: { agent: hardAgent!, model: hardModel! },
    },
    options: {
      max_parallel: 1,
      agent_timeout_seconds: 1800,
      log_dir: ".biltz/logs",
      on_failure: "stop",
      poll_interval_ms: 5000,
    },
  };

  await writeConfig(configPath, config);
  await writeConfigExample(configPath + ".example", config);

  logger.info(`Created ${configPath} and ${configPath}.example`);
  return 0;
}
