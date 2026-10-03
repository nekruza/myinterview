/**
 * Pure helpers that turn the raw session list into dashboard figures.
 *
 * These run in the browser, so "today" and "this week" follow the user's own
 * timezone rather than the server's.
 */

export interface DashboardSession {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
}

type SessionDates = Pick<DashboardSession, "status" | "completed_at" | "started_at">;

export function getGreeting(): string {
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export function calcStreak(sessions: SessionDates[]): number {
  if (!sessions.length) return 0;
  const dates = sessions
    .filter((s) => s.status === "completed")
    .map((s) => new Date(s.completed_at ?? s.started_at).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  if (!dates.length) return 0;
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const d of dates) {
    const date = new Date(d);
    const diff = (current.getTime() - date.getTime()) / 86_400_000;
    if (diff <= 1) { streak++; current = date; } else break;
  }
  return streak;
}

/** Returns Mon–Sun of the current week each with a short label + whether practiced */
export function getWeekActivity(
  sessions: SessionDates[]
): { label: string; active: boolean; isToday: boolean }[] {
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromMonday = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const active = sessions.some((s) => {
      if (s.status !== "completed") return false;
      const d = new Date(s.completed_at ?? s.started_at);
      return d >= dayStart && d < dayEnd;
    });
    return { label: DAY_LABELS[dayStart.getDay()], active, isToday: dayStart.getTime() === today.getTime() };
  });
}

/** Returns avg confidence score per day for Mon–Sun of the current week (null = no sessions that day) */
export function getScoreHistory(
  sessions: (SessionDates & Pick<DashboardSession, "score">)[]
): (number | null)[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromMonday = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const scored = sessions.filter((s) => {
      if (s.status !== "completed" || s.score === null) return false;
      const d = new Date(s.completed_at ?? s.started_at);
      return d >= dayStart && d < dayEnd;
    });
    if (!scored.length) return null;
    return scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length;
  });
}
