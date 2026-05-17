#!/usr/bin/env node
import { Command } from "commander";
import { initCommand } from "./commands/init.js";
import { startCommand } from "./commands/start.js";
import { doctorCommand } from "./commands/doctor.js";
import { statusCommand } from "./commands/status.js";
import { stopCommand } from "./commands/stop.js";
import { createLogger } from "./utils/logger.js";

const program = new Command();
program.name("biltz").description("Orquestra agentes de codificação executando tarefas OpenSpec").version("0.2.0");

program
  .command("init")
  .description("Initialize biltz.yml interactively")
  .option("-f, --force", "overwrite existing biltz.yml")
  .option("--spec <spec>", "spec type", "openspec")
  .option("--non-interactive", "run without prompts (requires all flags)")
  .option("--agents <agents>", "comma-separated agents", (val) => val.split(",").map((s) => s.trim()))
  .option("--easy-agent <agent>", "agent for easy tasks")
  .option("--easy-model <model>", "model for easy tasks")
  .option("--medium-agent <agent>", "agent for medium tasks")
  .option("--medium-model <model>", "model for medium tasks")
  .option("--hard-agent <agent>", "agent for hard tasks")
  .option("--hard-model <model>", "model for hard tasks")
  .action(async (opts) => {
    const exitCode = await initCommand(process.cwd(), {
      force: opts.force,
      spec: opts.spec,
      nonInteractive: opts.nonInteractive,
      agents: opts.agents,
      easyAgent: opts.easyAgent,
      easyModel: opts.easyModel,
      mediumAgent: opts.mediumAgent,
      mediumModel: opts.mediumModel,
      hardAgent: opts.hardAgent,
      hardModel: opts.hardModel,
    }, createLogger());
    process.exitCode = exitCode;
  });

program
  .command("start")
  .description("Start the orchestration loop")
  .option("-c, --config <path>", "path to biltz.yml")
  .option("--dry-run", "do not execute tasks, just log")
  .option("--once", "run a single task then exit")
  .option("--max-parallel <n>", "max parallel tasks", parseInt)
  .option("-v, --verbose", "verbose logging")
  .action(async (opts) => {
    const exitCode = await startCommand(process.cwd(), {
      config: opts.config,
      dryRun: opts.dryRun,
      once: opts.once,
      maxParallel: opts.maxParallel,
      verbose: opts.verbose,
    });
    process.exitCode = exitCode;
  });

program
  .command("doctor")
  .description("Check configuration and agent availability")
  .option("-c, --config <path>", "path to biltz.yml")
  .action(async (opts) => {
    const exitCode = await doctorCommand(process.cwd(), { config: opts.config });
    process.exitCode = exitCode;
  });

program
  .command("status")
  .description("Show task tree and summary")
  .option("-c, --config <path>", "path to biltz.yml")
  .action(async (opts) => {
    const exitCode = await statusCommand(process.cwd(), { config: opts.config });
    process.exitCode = exitCode;
  });

program
  .command("stop")
  .description("Signal a running biltz instance to stop gracefully")
  .action(async () => {
    const exitCode = await stopCommand(process.cwd());
    process.exitCode = exitCode;
  });

program.parse();
