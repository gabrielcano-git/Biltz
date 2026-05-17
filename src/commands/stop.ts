import { writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { ensureDir } from "../utils/fs.js";
import { createLogger } from "../utils/logger.js";

export async function stopCommand(cwd: string): Promise<number> {
  const logger = createLogger();
  const flagPath = `${cwd}/.biltz/stop`;

  if (existsSync(flagPath)) {
    logger.info("Stop flag already exists.");
    return 0;
  }

  await ensureDir(`${cwd}/.biltz`);
  await writeFile(flagPath, "", "utf-8");
  logger.info("Stop flag written. The running biltz instance will exit gracefully after the current task.");
  return 0;
}
