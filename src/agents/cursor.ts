import type { AgentAdapter } from "./types.js";
import { which } from "../utils/which.js";

export class CursorAdapter implements AgentAdapter {
  name = "cursor";

  async isInstalled(): Promise<boolean> {
    return (await which("cursor-agent")) !== null;
  }

  availableModels(): string[] {
    return [];
  }

  buildCommand(input: { prompt: string; model: string }): { cmd: string; args: string[] } {
    return {
      cmd: "cursor-agent",
      args: ["-p", input.prompt, "--model", input.model],
    };
  }
}
