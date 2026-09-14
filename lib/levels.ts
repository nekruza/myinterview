/**
 * User proficiency levels.
 *
 * DB values ported from fina's `UserProfile['user_level']` union. Onboarding
 * question ids (beginner/some/convo/fluent) come from fina
 * `components/onboarding/OnboardingShared.tsx` (`LEVELS`/`LEVEL_LABEL`).
 * `levelGuidance` ports `getUserLevelGuidance` from fina
 * `services/geminiChatService.ts`.
 */

export type UserLevel =
  | "beginner"
  | "elementary"
  | "intermediate"
  | "upper_intermediate"
  | "advanced"
  | "proficient";

export const USER_LEVELS: { id: UserLevel; label: string }[] = [
  { id: "beginner", label: "Beginner" },
  { id: "elementary", label: "Elementary" },
  { id: "intermediate", label: "Intermediate" },
  { id: "upper_intermediate", label: "Upper Intermediate" },
  { id: "advanced", label: "Advanced" },
  { id: "proficient", label: "Proficient" },
];

const USER_LEVEL_IDS = new Set<string>(USER_LEVELS.map((l) => l.id));

export function isUserLevel(v: unknown): v is UserLevel {
  return typeof v === "string" && USER_LEVEL_IDS.has(v);
}

export function levelLabel(level?: string | null): string {
  return USER_LEVELS.find((l) => l.id === level)?.label ?? "Beginner";
}

/**
 * Maps the onboarding assessment's self-reported level id
 * (fina OnboardingShared.LEVELS: beginner/some/convo/fluent) to the DB
 * `UserLevel` value used everywhere else.
 */
export function onboardingLevelToUserLevel(id: string): UserLevel {
  switch (id) {
    case "beginner":
      return "beginner";
    case "some":
      return "elementary";
    case "convo":
      return "intermediate";
    case "fluent":
      return "advanced";
    default:
      return "beginner";
  }
}

/**
 * Ported from fina `services/geminiChatService.ts` getUserLevelGuidance.
 * Adapted to the DB `UserLevel` union instead of a free-text substring match.
 */
export function levelGuidance(level: UserLevel, languageLabel: string): string {
  if (level === "beginner" || level === "elementary") {
    return `LANGUAGE ADJUSTMENT for BEGINNER in ${languageLabel}:
- Use simple, common vocabulary
- Short sentences (5-10 words)
- Speak slowly and clearly
- Avoid idioms and complex grammar
- Use present tense mostly`;
  }

  if (level === "intermediate" || level === "upper_intermediate") {
    return `LANGUAGE ADJUSTMENT for INTERMEDIATE in ${languageLabel}:
- Use moderate vocabulary with some advanced words
- Mix of simple and compound sentences
- Can use some idioms
- Natural pacing
- Introduce past/future tenses`;
  }

  return `LANGUAGE ADJUSTMENT for ADVANCED in ${languageLabel}:
- Use rich, varied vocabulary
- Complex sentence structures welcome
- Use idioms and expressions naturally
- Natural native-like pacing
- All tenses and grammar structures`;
}
