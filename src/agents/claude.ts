import type { AgentAdapter } from "./types.js";
import { which } from "../utils/which.js";

export class ClaudeAdapter implements AgentAdapter {
  name = "claude";

  async isInstalled(): Promise<boolean> {
    return (await which("claude")) !== null;
  }

  availableModels(): string[] {
    return ["claude-sonnet-4-20250514", "claude-opus-4-20250514"];
  }

  buildCommand(input: { prompt: string; model: string }): { cmd: string; args: string[] } {
    return {
      cmd: "claude",
      args: ["-p", input.prompt, "--model", input.model, "--dangerously-skip-permissions"],
    };
  }
}
