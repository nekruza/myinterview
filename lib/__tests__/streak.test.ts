import { computeStreakUpdate, parseWeeklyActivity, localDateString, isValidDateString } from "@/lib/streak";

const week = (...idx: number[]) => Array.from({ length: 7 }, (_, i) => idx.includes(i));

describe("computeStreakUpdate", () => {
  it("starts a streak on first conversation", () => {
    const { state, changed } = computeStreakUpdate(
      { currentStreak: 0, lastConversationDate: null, weeklyActivity: week() },
      "2026-09-13",
      0
    );
    expect(changed).toBe(true);
    expect(state).toEqual({ currentStreak: 1, lastConversationDate: "2026-09-13", weeklyActivity: week(0) });
  });

  it("does nothing twice on the same day", () => {
    const prev = { currentStreak: 4, lastConversationDate: "2026-09-13", weeklyActivity: week(0) };
    expect(computeStreakUpdate(prev, "2026-09-13", 0)).toEqual({ state: prev, changed: false });
  });

  it("increments on consecutive days", () => {
    const { state } = computeStreakUpdate(
      { currentStreak: 4, lastConversationDate: "2026-09-12", weeklyActivity: week(6) },
      "2026-09-13",
      0
    );
    expect(state.currentStreak).toBe(5);
    expect(state.weeklyActivity).toEqual(week(0, 6));
  });

  it("resets after a missed day and clears the week", () => {
    const { state } = computeStreakUpdate(
      { currentStreak: 9, lastConversationDate: "2026-09-10", weeklyActivity: week(1, 2, 3) },
      "2026-09-13",
      0
    );
    expect(state.currentStreak).toBe(1);
    expect(state.weeklyActivity).toEqual(week(0));
  });

  it("handles month boundaries", () => {
    expect(
      computeStreakUpdate({ currentStreak: 2, lastConversationDate: "2026-08-31", weeklyActivity: week() }, "2026-09-01", 2).state
        .currentStreak
    ).toBe(3);
  });
});

describe("helpers", () => {
  it("parses weekly activity safely", () => {
    expect(parseWeeklyActivity("[true,false,false,false,false,false,true]")).toEqual(week(0, 6));
    expect(parseWeeklyActivity("nonsense")).toEqual(week());
    expect(parseWeeklyActivity(null)).toEqual(week());
    expect(parseWeeklyActivity("[true]")).toEqual(week());
  });

  it("formats local dates", () => expect(localDateString(new Date(2026, 0, 5))).toBe("2026-01-05"));

  it("validates date strings", () => {
    expect(isValidDateString("2026-09-13")).toBe(true);
    expect(isValidDateString("13/09/2026")).toBe(false);
  });
});
