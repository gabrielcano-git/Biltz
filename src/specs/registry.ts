import type { SpecAdapter } from "./types.js";
import { OpenSpecAdapter } from "./openspec/adapter.js";

const registry: Record<string, SpecAdapter> = {
  openspec: new OpenSpecAdapter(),
};

export function getSpecAdapter(name: string): SpecAdapter | undefined {
  return registry[name];
}

export function listSpecs(): string[] {
  return Object.keys(registry);
}
