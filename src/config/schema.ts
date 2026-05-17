import { z } from "zod";

export const RouteEntry = z.object({
  agent: z.string(),
  model: z.string(),
  fallbacks: z
    .array(z.object({ agent: z.string(), model: z.string() }))
    .optional(),
});

export const Config = z.object({
  version: z.literal(1),
  spec: z.enum(["openspec"]),
  agents: z.array(z.string()).min(1),
  routing: z.object({
    easy: RouteEntry,
    medium: RouteEntry,
    hard: RouteEntry,
  }),
  options: z
    .object({
      max_parallel: z.number().int().min(1).default(1),
      agent_timeout_seconds: z.number().int().positive().default(1800),
      log_dir: z.string().default(".biltz/logs"),
      on_failure: z.enum(["stop", "skip"]).default("stop"),
      poll_interval_ms: z.number().int().positive().default(5000),
    })
    .default({}),
});

export type BiltzConfig = z.infer<typeof Config>;
export type BiltzRoute = z.infer<typeof RouteEntry>;
