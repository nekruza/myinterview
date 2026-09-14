/**
 * Daily conversation streak logic.
 *
 * Ported from fina `lib/supabaseStorage.ts` `updateConversationStreak` /
 * `getUserStreak`, split into pure functions so the persistence layer
 * (`lib/db/profile.ts`) can read + write around them without duplicating the
 * date math.
 */

export interface StreakState {
  currentStreak: number;
  lastConversationDate: string | null;
  weeklyActivity: boolean[];
}

const EMPTY_WEEK: boolean[] = [false, false, false, false, false, false, false];

const DATE_STRING_RE = /^\d{4}-\d{2}-\d{2}$/;

export function isValidDateString(s: unknown): s is string {
  return typeof s === "string" && DATE_STRING_RE.test(s);
}

/** Formats a Date as YYYY-MM-DD using the date's local time (no UTC shift). */
export function localDateString(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Parses the JSON-encoded weekly-activity column. Any invalid shape → all false. */
export function parseWeeklyActivity(raw: string | null | undefined): boolean[] {
  if (!raw) return [...EMPTY_WEEK];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 7 && parsed.every((v) => typeof v === "boolean")) {
      return parsed as boolean[];
    }
    return [...EMPTY_WEEK];
  } catch {
    return [...EMPTY_WEEK];
  }
}

function localMidnight(dateString: string): number {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day).getTime();
}

/**
 * Mobile `updateConversationStreak` algorithm:
 * - same day as last conversation → unchanged.
 * - consecutive day (diff === 1) → streak + 1.
 * - gap (diff > 1) → streak resets to 1 and the week clears.
 * - no prior conversation → streak starts at 1.
 * Today's day-of-week is always marked active when changed.
 */
export function computeStreakUpdate(
  prev: StreakState,
  today: string,
  dayOfWeek: number
): { state: StreakState; changed: boolean } {
  if (prev.lastConversationDate === today) {
    return { state: prev, changed: false };
  }

  let currentStreak = prev.currentStreak;
  let weeklyActivity = [...prev.weeklyActivity];

  if (prev.lastConversationDate) {
    const diffDays = Math.round(
      (localMidnight(today) - localMidnight(prev.lastConversationDate)) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak += 1;
    } else if (diffDays > 1) {
      currentStreak = 1;
      weeklyActivity = [...EMPTY_WEEK];
    }
    // diffDays <= 0 shouldn't occur (the equality check above catches diffDays === 0),
    // but if it did we leave the streak untouched and still mark today active below.
  } else {
    currentStreak = 1;
  }

  weeklyActivity[dayOfWeek] = true;

  return {
    state: { currentStreak, lastConversationDate: today, weeklyActivity },
    changed: true,
  };
}
