import type { BiltzConfig } from "../config/schema.js";

export function shouldStopOnFailure(config: BiltzConfig): boolean {
  return config.options.on_failure === "stop";
}
