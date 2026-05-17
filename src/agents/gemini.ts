import type { AgentAdapter } from "./types.js";
import { which } from "../utils/which.js";

export class GeminiAdapter implements AgentAdapter {
  name = "gemini";

  async isInstalled(): Promise<boolean> {
    return (await which("gemini")) !== null;
  }

  availableModels(): string[] {
    return ["gemini-1.5-pro-latest", "gemini-1.5-flash-latest"];
  }

  buildCommand(input: { prompt: string; model: string }): { cmd: string; args: string[] } {
    return {
      cmd: "gemini",
      args: ["-p", input.prompt, "--model", input.model, "--yolo"],
    };
  }
}
