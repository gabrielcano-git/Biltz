import type { AgentAdapter } from "./types.js";
import { GeminiAdapter } from "./gemini.js";
import { ClaudeAdapter } from "./claude.js";
import { KimiAdapter } from "./kimi.js";
import { CursorAdapter } from "./cursor.js";

const registry: Record<string, AgentAdapter> = {
  gemini: new GeminiAdapter(),
  claude: new ClaudeAdapter(),
  kimi: new KimiAdapter(),
  cursor: new CursorAdapter(),
};

export function getAgentAdapter(name: string): AgentAdapter | undefined {
  return registry[name];
}

export function listAgents(): string[] {
  return Object.keys(registry);
}
