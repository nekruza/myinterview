/**
 * 30-day study plan — pure date/progress math.
 *
 * Ported from fina `app/(tabs)/index.tsx` / `components/StudyPlanCard.tsx`
 * (day-number computation), `app/study-plan.tsx` (week chunking), and
 * `components/StreakCard.tsx` `getWeekRange` (Monday–Sunday week label).
 * Kept pure so both the home dashboard and `/app/study-plan` can share it
 * without re-deriving the same date math.
 */

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * 1-indexed day within the 30-day plan, clamped to [1, 30]. A missing start
 * date (plan not started yet) is day 1.
 */
export function currentPlanDay(startDate: string | null, now: Date = new Date()): number {
  if (!startDate) return 1;
  const start = new Date(startDate).getTime();
  if (Number.isNaN(start)) return 1;
  const diffDays = Math.floor((now.getTime() - start) / DAY_MS);
  return Math.min(Math.max(diffDays + 1, 1), 30);
}

/** Chunks a flat list of days into weeks of `size` (default 7). The last chunk may be shorter. */
export function weeksOf<T>(days: T[], size = 7): T[][] {
  const weeks: T[][] = [];
  for (let i = 0; i < days.length; i += size) {
    weeks.push(days.slice(i, i + size));
  }
  return weeks;
}

/**
 * The day to *display* on the study-plan card: once both the speak and vocab
 * sections are done for `currentDay`, the card advances to show the next
 * day's lesson (still clamped to day 30).
 */
export function displayDay(currentDay: number, speakDone: Set<number>, vocabDone: Set<number>): number {
  const bothDone = speakDone.has(currentDay) && vocabDone.has(currentDay);
  return bothDone ? Math.min(currentDay + 1, 30) : currentDay;
}

/** Ported verbatim from fina `components/StreakCard.tsx` getWeekRange. */
export function weekRangeLabel(now: Date = new Date()): string {
  const dayOfWeek = now.getDay(); // 0 = Sunday
  const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(now);
  monday.setDate(now.getDate() + diff);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const mondayMonth = monday.toLocaleDateString("en-US", { month: "short" });
  const sundayMonth = sunday.toLocaleDateString("en-US", { month: "short" });

  if (mondayMonth === sundayMonth) {
    return `${mondayMonth} ${monday.getDate()}-${sunday.getDate()}`;
  }
  return `${mondayMonth} ${monday.getDate()}-${sundayMonth} ${sunday.getDate()}`;
}
