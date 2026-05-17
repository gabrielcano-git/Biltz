import type { BiltzConfig, BiltzRoute } from "../config/schema.js";
import type { Difficulty } from "../specs/types.js";

export function resolveRoute(config: BiltzConfig, difficulty: Difficulty): BiltzRoute {
  switch (difficulty) {
    case "E":
      return config.routing.easy;
    case "M":
      return config.routing.medium;
    case "H":
      return config.routing.hard;
  }
}

export function getFallbackChain(route: BiltzRoute): Array<{ agent: string; model: string }> {
  const chain = [{ agent: route.agent, model: route.model }];
  if (route.fallbacks) {
    for (const fb of route.fallbacks) chain.push(fb);
  }
  return chain;
}
