import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import { saveLessonProgress, loadLessonProgress, markLessonCompleted, getCompletedLessonIds } from "@/lib/db/lessons";

describe("saveLessonProgress", () => {
  it("upserts progress keyed by user_id,lesson_id with lesson_id as text", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: null } } });
    await saveLessonProgress(mock as never, "u1", {
      lessonId: 42,
      currentWordIndex: 3,
      completedWords: ["a", "b"],
      timeSpent: 60,
      accuracy: 90,
      isCompleted: false,
    });
    const payload = writePayload(mock, "lesson_progress", "upsert");
    expect(payload).toMatchObject({
      user_id: "u1",
      lesson_id: "42",
      completed_words: ["a", "b"],
      current_word_index: 3,
      time_spent: 60,
      accuracy: 90,
      is_completed: false,
    });
    expect(typeof payload.last_accessed).toBe("string");
    const builder = mock.builderFor("lesson_progress");
    expect(builder.upsert).toHaveBeenCalledWith(expect.anything(), { onConflict: "user_id,lesson_id" });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: { message: "boom" } } } });
    await expect(
      saveLessonProgress(mock as never, "u1", { lessonId: "x", currentWordIndex: 0 })
    ).rejects.toMatchObject({ message: "boom" });
  });
});

describe("loadLessonProgress", () => {
  const ROW = {
    id: "p1",
    user_id: "u1",
    lesson_id: "42",
    completed_words: ["a"],
    current_word_index: 1,
    time_spent: 10,
    accuracy: 50,
    last_accessed: "2026-09-13T00:00:00.000Z",
    is_completed: false,
    created_at: "2026-09-01T00:00:00.000Z",
    updated_at: "2026-09-13T00:00:00.000Z",
  };

  it("maps the row to camelCase", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: ROW, error: null } } });
    const progress = await loadLessonProgress(mock as never, "u1", 42);
    expect(progress).toEqual({
      id: "p1",
      user_id: "u1",
      lessonId: "42",
      completedWords: ["a"],
      currentWordIndex: 1,
      timeSpent: 10,
      accuracy: 50,
      lastAccessed: "2026-09-13T00:00:00.000Z",
      isCompleted: false,
      created_at: "2026-09-01T00:00:00.000Z",
      updated_at: "2026-09-13T00:00:00.000Z",
    });
    const builder = mock.builderFor("lesson_progress");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "u1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "lesson_id", "42");
  });

  it("returns null on PGRST116", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: { code: "PGRST116", message: "no rows" } } } });
    expect(await loadLessonProgress(mock as never, "u1", 1)).toBeNull();
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: { message: "boom" } } } });
    await expect(loadLessonProgress(mock as never, "u1", 1)).rejects.toMatchObject({ message: "boom" });
  });
});

describe("markLessonCompleted", () => {
  it("upserts is_completed true", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: null } } });
    await markLessonCompleted(mock as never, "u1", 7);
    const payload = writePayload(mock, "lesson_progress", "upsert");
    expect(payload).toMatchObject({ user_id: "u1", lesson_id: "7", is_completed: true });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: { message: "boom" } } } });
    await expect(markLessonCompleted(mock as never, "u1", 7)).rejects.toMatchObject({ message: "boom" });
  });
});

describe("getCompletedLessonIds", () => {
  it("returns a Set of string ids from a single query", async () => {
    const mock = createSupabaseMock({
      tables: { lesson_progress: { data: [{ lesson_id: "1" }, { lesson_id: "2" }], error: null } },
    });
    const ids = await getCompletedLessonIds(mock as never, "u1");
    expect(ids).toEqual(new Set(["1", "2"]));
    const builder = mock.builderFor("lesson_progress");
    expect(builder.select).toHaveBeenCalledWith("lesson_id");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "u1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "is_completed", true);
    expect(mock.callCountFor("lesson_progress")).toBe(1);
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { lesson_progress: { data: null, error: { message: "boom" } } } });
    await expect(getCompletedLessonIds(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});
