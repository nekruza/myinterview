import type { CustomRoleplayRecord, RoleplayScenario } from "@/lib/types/roleplay";

/**
 * Roleplay library filter chips (`/app/roleplay`).
 *
 * Mirrors fina's `RoleplayCategory` minus `'all'`'s absence from the mobile
 * screen's own filter chips list (mobile: `[all, custom, life, food, travel, work]`).
 */
export type RoleplayFilter = "all" | "custom" | "life" | "food" | "travel" | "work";

/** Maps a saved custom roleplay row to the shared `RoleplayScenario` shape used by cards. */
export function customToScenario(c: CustomRoleplayRecord): RoleplayScenario {
  return {
    id: c.id,
    title: c.title,
    description: "Custom roleplay scenario",
    difficulty: c.difficulty,
    emoji: "🎭",
    category: "custom",
    userRole: c.userRole,
    aiRole: c.aiRole,
    scenario: c.scenario,
  };
}

/**
 * Filters and orders the scenarios shown for a given filter chip.
 *
 * - `"all"` → custom scenarios first, then every predefined scenario (in
 *   their existing order — `general` is already first in `lib/data/roleplays.ts`).
 * - `"custom"` → only custom scenarios.
 * - any category (`"life" | "food" | "travel" | "work"`) → only predefined
 *   scenarios in that category; custom scenarios are excluded.
 */
export function filterScenarios(
  filter: RoleplayFilter,
  predefined: RoleplayScenario[],
  custom: RoleplayScenario[]
): RoleplayScenario[] {
  if (filter === "custom") return custom;
  if (filter === "all") return [...custom, ...predefined];
  return predefined.filter((scenario) => scenario.category === filter);
}
