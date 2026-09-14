import { currentPlanDay, weeksOf, displayDay, weekRangeLabel } from "@/lib/study-plan";

describe("currentPlanDay", () => {
  it("is day 1 on the start date itself", () => {
    const now = new Date(2026, 8, 13, 10, 0, 0);
    expect(currentPlanDay(now.toISOString(), now)).toBe(1);
  });

  it("is day 30 after 29 full days", () => {
    const start = new Date(2026, 8, 1, 9, 0, 0);
    const now = new Date(start.getTime() + 29 * 24 * 60 * 60 * 1000);
    expect(currentPlanDay(start.toISOString(), now)).toBe(30);
  });

  it("clamps to day 30 after 100 days", () => {
    const start = new Date(2026, 5, 1, 9, 0, 0);
    const now = new Date(start.getTime() + 100 * 24 * 60 * 60 * 1000);
    expect(currentPlanDay(start.toISOString(), now)).toBe(30);
  });

  it("is day 1 when there is no start date", () => {
    expect(currentPlanDay(null)).toBe(1);
  });

  it("is day 1 for an unparsable start date", () => {
    expect(currentPlanDay("not-a-date")).toBe(1);
  });
});

describe("weeksOf", () => {
  it("chunks 30 days into 5 weeks of 7 (last week short)", () => {
    const days = Array.from({ length: 30 }, (_, i) => i + 1);
    const weeks = weeksOf(days);
    expect(weeks).toHaveLength(5);
    expect(weeks[0]).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(weeks[4]).toEqual([29, 30]);
  });

  it("respects a custom chunk size", () => {
    expect(weeksOf([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });

  it("returns an empty array for an empty input", () => {
    expect(weeksOf([])).toEqual([]);
  });
});

describe("displayDay", () => {
  it("stays on the current day when neither section is done", () => {
    expect(displayDay(5, new Set(), new Set())).toBe(5);
  });

  it("stays on the current day when only one section is done", () => {
    expect(displayDay(5, new Set([5]), new Set())).toBe(5);
    expect(displayDay(5, new Set(), new Set([5]))).toBe(5);
  });

  it("advances to the next day once both sections are done", () => {
    expect(displayDay(5, new Set([5]), new Set([5]))).toBe(6);
  });

  it("clamps at day 30 when both sections of day 30 are done", () => {
    expect(displayDay(30, new Set([30]), new Set([30]))).toBe(30);
  });

  it("ignores completion recorded for other days", () => {
    expect(displayDay(5, new Set([4]), new Set([4]))).toBe(5);
  });
});

describe("weekRangeLabel", () => {
  it("formats a Monday-Sunday range within the same month", () => {
    expect(weekRangeLabel(new Date(2026, 8, 13))).toBe("Sep 7-13");
  });

  it("formats a range spanning a month boundary", () => {
    expect(weekRangeLabel(new Date(2026, 8, 1))).toBe("Aug 31-Sep 6");
  });
});
