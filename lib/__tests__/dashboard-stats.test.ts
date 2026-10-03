import {
  calcStreak,
  getGreeting,
  getScoreHistory,
  getWeekActivity,
} from "../dashboard-stats";

// Wednesday 14 Jan 2026, 12:00 local time. Pinning the clock keeps the weekly
// helpers deterministic; noon avoids any DST edge at midnight.
const NOW = new Date(2026, 0, 14, 12, 0, 0);

const at = (y: number, m: number, d: number, h = 10) =>
  new Date(y, m, d, h).toISOString();

const done = (completed_at: string, score: number | null = null) => ({
  status: "completed",
  started_at: completed_at,
  completed_at,
  score,
});

beforeEach(() => {
  jest.useFakeTimers().setSystemTime(NOW);
});

afterEach(() => {
  jest.useRealTimers();
});

describe("getGreeting", () => {
  it.each([
    [4, "Good evening"],
    [5, "Good morning"],
    [11, "Good morning"],
    [12, "Good afternoon"],
    [16, "Good afternoon"],
    [17, "Good evening"],
  ])("at %i:00 UTC says %s", (hour, expected) => {
    jest.setSystemTime(new Date(Date.UTC(2026, 0, 14, hour)));

    expect(getGreeting()).toBe(expected);
  });
});

describe("calcStreak", () => {
  it("is 0 with no sessions", () => {
    expect(calcStreak([])).toBe(0);
  });

  it("ignores sessions that never completed", () => {
    expect(
      calcStreak([{ status: "in_progress", started_at: at(2026, 0, 14), completed_at: null }])
    ).toBe(0);
  });

  it("counts consecutive days ending today", () => {
    const sessions = [done(at(2026, 0, 14)), done(at(2026, 0, 13)), done(at(2026, 0, 12))];

    expect(calcStreak(sessions)).toBe(3);
  });

  it("keeps the streak alive when the last session was yesterday", () => {
    expect(calcStreak([done(at(2026, 0, 13)), done(at(2026, 0, 12))])).toBe(2);
  });

  it("breaks on a missed day", () => {
    expect(calcStreak([done(at(2026, 0, 14)), done(at(2026, 0, 11))])).toBe(1);
  });

  it("counts several sessions on one day once", () => {
    expect(calcStreak([done(at(2026, 0, 14, 9)), done(at(2026, 0, 14, 15))])).toBe(1);
  });

  it("is 0 when the most recent session is older than yesterday", () => {
    expect(calcStreak([done(at(2026, 0, 11))])).toBe(0);
  });

  it("falls back to started_at when completed_at is missing", () => {
    expect(
      calcStreak([{ status: "completed", started_at: at(2026, 0, 14), completed_at: null }])
    ).toBe(1);
  });
});

describe("getWeekActivity", () => {
  it("returns seven days starting on Monday", () => {
    const week = getWeekActivity([]);

    expect(week.map((d) => d.label)).toEqual(["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"]);
  });

  it("flags only today", () => {
    const week = getWeekActivity([]);

    expect(week.filter((d) => d.isToday).map((d) => d.label)).toEqual(["We"]);
  });

  it("marks days with a completed session as active", () => {
    const week = getWeekActivity([done(at(2026, 0, 12)), done(at(2026, 0, 14))]);

    expect(week.filter((d) => d.active).map((d) => d.label)).toEqual(["Mo", "We"]);
  });

  it("ignores sessions from outside the current week", () => {
    const week = getWeekActivity([done(at(2026, 0, 9)), done(at(2026, 0, 19))]);

    expect(week.some((d) => d.active)).toBe(false);
  });

  it("ignores sessions that did not complete", () => {
    const week = getWeekActivity([
      { status: "in_progress", started_at: at(2026, 0, 14), completed_at: null },
    ]);

    expect(week.some((d) => d.active)).toBe(false);
  });
});

describe("getScoreHistory", () => {
  it("is null for every day with no scored session", () => {
    expect(getScoreHistory([])).toEqual(Array(7).fill(null));
  });

  it("averages the scores for a day", () => {
    const history = getScoreHistory([
      done(at(2026, 0, 14, 9), 60),
      done(at(2026, 0, 14, 15), 80),
    ]);

    expect(history[2]).toBe(70);
  });

  it("places scores on the right weekday", () => {
    const history = getScoreHistory([done(at(2026, 0, 12), 90)]);

    expect(history).toEqual([90, null, null, null, null, null, null]);
  });

  it("skips unscored and incomplete sessions", () => {
    const history = getScoreHistory([
      done(at(2026, 0, 14), null),
      { status: "in_progress", started_at: at(2026, 0, 14), completed_at: null, score: 99 },
    ]);

    expect(history[2]).toBeNull();
  });
});
