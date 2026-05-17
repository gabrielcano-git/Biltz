export interface AgentAdapter {
  name: string;
  isInstalled(): Promise<boolean>;
  availableModels(): string[];
  buildCommand(input: { prompt: string; model: string }): { cmd: string; args: string[] };
}
