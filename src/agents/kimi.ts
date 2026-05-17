import type { AgentAdapter } from "./types.js";
import { which } from "../utils/which.js";

export class KimiAdapter implements AgentAdapter {
  name = "kimi";

  async isInstalled(): Promise<boolean> {
    return (await which("kimi")) !== null;
  }

  availableModels(): string[] {
    return ["kimi-latest", "kimi-k2"];
  }

  buildCommand(input: { prompt: string; model: string }): { cmd: string; args: string[] } {
    return {
      cmd: "kimi",
      args: ["-p", input.prompt, "--model", input.model, "--yolo", "--max-ralph-iterations", "-1"],
    };
  }
}
