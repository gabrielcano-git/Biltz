import { describe, it, expect } from "vitest";
import { resolveRoute, getFallbackChain } from "../src/orchestrator/router.js";
import type { BiltzConfig } from "../src/config/schema.js";

const config: BiltzConfig = {
  version: 1,
  spec: "openspec",
  agents: ["gemini", "claude"],
  routing: {
    easy: { agent: "gemini", model: "flash" },
    medium: { agent: "claude", model: "sonnet", fallbacks: [{ agent: "gemini", model: "pro" }] },
    hard: { agent: "claude", model: "opus", fallbacks: [{ agent: "gemini", model: "pro" }, { agent: "claude", model: "sonnet" }] },
  },
  options: {
    max_parallel: 1,
    agent_timeout_seconds: 1800,
    log_dir: ".biltz/logs",
    on_failure: "stop",
    poll_interval_ms: 5000,
  },
};

describe("resolveRoute", () => {
  it("routes easy to gemini", () => {
    expect(resolveRoute(config, "E")).toEqual(config.routing.easy);
  });

  it("routes medium to claude", () => {
    expect(resolveRoute(config, "M")).toEqual(config.routing.medium);
  });

  it("routes hard to claude", () => {
    expect(resolveRoute(config, "H")).toEqual(config.routing.hard);
  });
});

describe("getFallbackChain", () => {
  it("returns single entry without fallbacks", () => {
    const chain = getFallbackChain(config.routing.easy);
    expect(chain).toEqual([{ agent: "gemini", model: "flash" }]);
  });

  it("returns primary + fallbacks", () => {
    const chain = getFallbackChain(config.routing.hard);
    expect(chain).toEqual([
      { agent: "claude", model: "opus" },
      { agent: "gemini", model: "pro" },
      { agent: "claude", model: "sonnet" },
    ]);
  });
});
