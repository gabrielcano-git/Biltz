import { lock, unlock } from "proper-lockfile";
import type { Logger } from "../utils/logger.js";

export async function acquireLock(dir: string, logger: Logger): Promise<() => Promise<void>> {
  try {
    const release = await lock(dir, {
      lockfilePath: `${dir}/.biltz/lock`,
      stale: 60000,
    });
    logger.debug("Lock acquired");
    return async () => {
      await release();
      logger.debug("Lock released");
    };
  } catch (err) {
    throw new Error(`Another biltz instance is running (${dir}/.biltz/lock)`);
  }
}
