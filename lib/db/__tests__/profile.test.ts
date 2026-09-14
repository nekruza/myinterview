import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import {
  getProfileRow,
  upsertProfile,
  updateProfile,
  parseCompletedDays,
  markStudyPlanDayComplete,
  ensureStudyPlanStartDate,
  updateStreak,
} from "@/lib/db/profile";

const ROW = {
  id: "u1",
  email: "u1@test.com",
  display_name: "U1",
  user_level: "beginner",
  current_streak: 0,
  words_learned: 0,
  accuracy: 0,
  last_conversation_date: null,
  weekly_activity: null,
  target_language: "spanish",
  learning_motivation: null,
  daily_goal_minutes: 10,
  study_plan_completed_days: "[1,2]",
  study_plan_start_date: "2026-09-01T00:00:00.000Z",
  native_language: "russian",
  tutor_id: "luna",
  ai_consent_at: null,
  stripe_customer_id: null,
  stripe_subscription_id: null,
  pro_status: null,
  pro_current_period_end: null,
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: null,
};

describe("getProfileRow", () => {
  it("returns the row for the user", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: ROW, error: null } } });
    const row = await getProfileRow(mock as never, "u1");
    expect(row).toEqual(ROW);
    expect(mock.builderFor("profiles").eq).toHaveBeenCalledWith("id", "u1");
  });

  it("returns null when the row does not exist (PGRST116)", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: { message: "no rows", code: "PGRST116" } } } });
    const row = await getProfileRow(mock as never, "missing");
    expect(row).toBeNull();
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: { message: "boom", code: "500" } } } });
    await expect(getProfileRow(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("upsertProfile", () => {
  it("upserts with onConflict id and ignoreDuplicates false", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: null } } });
    await upsertProfile(mock as never, { id: "u1", email: "u1@test.com" });
    const builder = mock.builderFor("profiles");
    expect(builder.upsert).toHaveBeenCalledWith(
      { id: "u1", email: "u1@test.com" },
      { onConflict: "id", ignoreDuplicates: false }
    );
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: { message: "boom" } } } });
    await expect(upsertProfile(mock as never, { id: "u1", email: null })).rejects.toMatchObject({ message: "boom" });
  });
});

describe("updateProfile", () => {
  it("updates the caller's row", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: null } } });
    await updateProfile(mock as never, "u1", { display_name: "New" });
    const builder = mock.builderFor("profiles");
    expect(writePayload(mock, "profiles", "update")).toEqual({ display_name: "New" });
    expect(builder.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: { message: "boom" } } } });
    await expect(updateProfile(mock as never, "u1", {})).rejects.toMatchObject({ message: "boom" });
  });
});

describe("parseCompletedDays", () => {
  it("parses a JSON array", () => expect(parseCompletedDays("[1,2,3]")).toEqual([1, 2, 3]));
  it("returns [] for null", () => expect(parseCompletedDays(null)).toEqual([]));
  it("returns [] for invalid JSON", () => expect(parseCompletedDays("nonsense")).toEqual([]));
  it("returns [] for a non-array", () => expect(parseCompletedDays('{"a":1}')).toEqual([]));
});

describe("markStudyPlanDayComplete", () => {
  it("merges the new day with existing days, sorted", async () => {
    const mock = createSupabaseMock({
      tables: { profiles: [{ data: ROW, error: null }, { data: null, error: null }] },
    });
    const days = await markStudyPlanDayComplete(mock as never, "u1", 5);
    expect(days).toEqual([1, 2, 5]);
    expect(writePayload(mock, "profiles", "update")).toEqual({ study_plan_completed_days: "[1,2,5]" });
  });

  it("starts from an empty list when the profile has none", async () => {
    const mock = createSupabaseMock({
      tables: { profiles: [{ data: { ...ROW, study_plan_completed_days: null }, error: null }, { data: null, error: null }] },
    });
    const days = await markStudyPlanDayComplete(mock as never, "u1", 3);
    expect(days).toEqual([3]);
  });
});

describe("ensureStudyPlanStartDate", () => {
  it("returns the existing start date without writing", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: ROW, error: null } } });
    const date = await ensureStudyPlanStartDate(mock as never, "u1");
    expect(date).toBe(ROW.study_plan_start_date);
    expect(mock.callCountFor("profiles")).toBe(1);
  });

  it("sets and returns a new start date when missing", async () => {
    const mock = createSupabaseMock({
      tables: { profiles: [{ data: { ...ROW, study_plan_start_date: null }, error: null }, { data: null, error: null }] },
    });
    const date = await ensureStudyPlanStartDate(mock as never, "u1");
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(writePayload(mock, "profiles", "update")).toEqual({ study_plan_start_date: date });
  });
});

describe("updateStreak", () => {
  it("writes current_streak, last_conversation_date, and JSON-encoded weekly_activity", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: null } } });
    await updateStreak(mock as never, "u1", {
      currentStreak: 5,
      lastConversationDate: "2026-09-13",
      weeklyActivity: [true, false, false, false, false, false, false],
    });

    const builder = mock.builderFor("profiles");
    expect(writePayload(mock, "profiles", "update")).toEqual({
      current_streak: 5,
      last_conversation_date: "2026-09-13",
      weekly_activity: "[true,false,false,false,false,false,false]",
    });
    expect(builder.eq).toHaveBeenCalledWith("id", "u1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { profiles: { data: null, error: { message: "boom" } } } });
    await expect(
      updateStreak(mock as never, "u1", { currentStreak: 1, lastConversationDate: "2026-09-13", weeklyActivity: [] as boolean[] })
    ).rejects.toMatchObject({ message: "boom" });
  });
});
