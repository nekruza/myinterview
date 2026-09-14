import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import {
  saveGeneratedLesson,
  listGeneratedLessons,
  getGeneratedLesson,
  deleteGeneratedLesson,
  findExistingLesson,
  countGeneratedLessons,
  sanitizeSearchQuery,
} from "@/lib/db/generatedLessons";
import type { Lesson } from "@/lib/types/vocabulary";

describe("sanitizeSearchQuery", () => {
  it("passes through an ordinary query", () => {
    expect(sanitizeSearchQuery("travel")).toBe("travel");
  });

  it("trims surrounding whitespace", () => {
    expect(sanitizeSearchQuery("  travel  ")).toBe("travel");
  });

  it("strips characters that are meaningful in a PostgREST filter string", () => {
    expect(sanitizeSearchQuery(`trav,el()%*"`)).toBe("travel");
  });

  it("caps the result at 50 characters", () => {
    expect(sanitizeSearchQuery("x".repeat(60))).toHaveLength(50);
  });

  it("returns an empty string for queries shorter than 2 characters after sanitizing", () => {
    expect(sanitizeSearchQuery("a")).toBe("");
  });

  it("returns an empty string when stripping collapses the query below 2 characters", () => {
    expect(sanitizeSearchQuery("a,")).toBe("");
  });

  it("returns an empty string for undefined or null", () => {
    expect(sanitizeSearchQuery(undefined)).toBe("");
    expect(sanitizeSearchQuery(null)).toBe("");
  });

  it("returns an empty string for an all-whitespace query", () => {
    expect(sanitizeSearchQuery("   ")).toBe("");
  });
});

const LESSON: Lesson = {
  id: "l1",
  title: "Greetings",
  description: "Basics",
  wordsCount: 5,
  duration: "10 min",
  difficulty: "Beginner",
  completed: false,
  emoji: "👋",
  vocabularyWords: [],
};

describe("saveGeneratedLesson", () => {
  it("inserts lesson_data/topic/difficulty and returns the new id", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: { id: "uuid-1" }, error: null } } });
    const id = await saveGeneratedLesson(mock as never, "u1", LESSON, "Travel", "easy");
    expect(id).toBe("uuid-1");
    expect(writePayload(mock, "generated_lessons", "insert")).toEqual({
      user_id: "u1",
      lesson_data: LESSON,
      topic: "Travel",
      difficulty: "easy",
    });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { message: "boom" } } } });
    await expect(saveGeneratedLesson(mock as never, "u1", LESSON, "Travel", "easy")).rejects.toMatchObject({
      message: "boom",
    });
  });
});

describe("listGeneratedLessons", () => {
  it("uses .or(user_id/is_global) and .range(0,49) by default, attaching flags", async () => {
    const mock = createSupabaseMock({
      tables: { generated_lessons: { data: [{ id: "row-1", lesson_data: LESSON }], error: null, count: 1 } },
    });
    const result = await listGeneratedLessons(mock as never, "u1");
    expect(result.totalCount).toBe(1);
    expect(result.lessons).toEqual([{ ...LESSON, supabaseId: "row-1", isUserGenerated: true }]);

    const builder = mock.builderFor("generated_lessons");
    expect(builder.or).toHaveBeenCalledWith("user_id.eq.u1,is_global.eq.true");
    expect(builder.range).toHaveBeenCalledWith(0, 49);
  });

  it("adds a second .or() ilike filter when a query is given", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: [], error: null, count: 0 } } });
    await listGeneratedLessons(mock as never, "u1", { query: "trav" });
    const builder = mock.builderFor("generated_lessons");
    expect(builder.or).toHaveBeenCalledTimes(2);
    expect(builder.or).toHaveBeenNthCalledWith(
      2,
      "topic.ilike.%trav%,lesson_data->>title.ilike.%trav%,lesson_data->>description.ilike.%trav%"
    );
  });

  it("sanitizes the search query before it reaches the .or() filter string", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: [], error: null, count: 0 } } });
    await listGeneratedLessons(mock as never, "u1", { query: `trav,el()*"%` });
    const builder = mock.builderFor("generated_lessons");
    expect(builder.or).toHaveBeenNthCalledWith(
      2,
      "topic.ilike.%travel%,lesson_data->>title.ilike.%travel%,lesson_data->>description.ilike.%travel%"
    );
  });

  it("skips the search filter when the sanitized query is shorter than 2 characters", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: [], error: null, count: 0 } } });
    await listGeneratedLessons(mock as never, "u1", { query: "a," });
    const builder = mock.builderFor("generated_lessons");
    expect(builder.or).toHaveBeenCalledTimes(1);
  });

  it("respects page/pageSize", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: [], error: null, count: 0 } } });
    await listGeneratedLessons(mock as never, "u1", { page: 2, pageSize: 10 });
    expect(mock.builderFor("generated_lessons").range).toHaveBeenCalledWith(10, 19);
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { message: "boom" } } } });
    await expect(listGeneratedLessons(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("getGeneratedLesson", () => {
  it("returns the lesson_data for a matching row", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: { lesson_data: LESSON }, error: null } } });
    const lesson = await getGeneratedLesson(mock as never, "u1", "row-1");
    expect(lesson).toEqual(LESSON);
    const builder = mock.builderFor("generated_lessons");
    expect(builder.eq).toHaveBeenCalledWith("id", "row-1");
    expect(builder.or).toHaveBeenCalledWith("user_id.eq.u1,is_global.eq.true");
  });

  it("returns null on PGRST116", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { code: "PGRST116", message: "no rows" } } } });
    expect(await getGeneratedLesson(mock as never, "u1", "missing")).toBeNull();
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { message: "boom" } } } });
    await expect(getGeneratedLesson(mock as never, "u1", "row-1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("deleteGeneratedLesson", () => {
  it("deletes by user_id and id", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: null } } });
    await deleteGeneratedLesson(mock as never, "u1", "row-1");
    const builder = mock.builderFor("generated_lessons");
    expect(builder.eq).toHaveBeenNthCalledWith(1, "user_id", "u1");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "id", "row-1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { message: "boom" } } } });
    await expect(deleteGeneratedLesson(mock as never, "u1", "row-1")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("findExistingLesson", () => {
  it("matches on lowercase topic and difficulty, attaching supabaseId", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: { id: "row-1", lesson_data: LESSON }, error: null } } });
    const lesson = await findExistingLesson(mock as never, "u1", "  Travel  ", "easy");
    expect(lesson).toEqual({ ...LESSON, supabaseId: "row-1" });
    const builder = mock.builderFor("generated_lessons");
    expect(builder.eq).toHaveBeenNthCalledWith(2, "topic", "travel");
    expect(builder.eq).toHaveBeenNthCalledWith(3, "difficulty", "easy");
  });

  it("returns null on PGRST116", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { code: "PGRST116", message: "no rows" } } } });
    expect(await findExistingLesson(mock as never, "u1", "travel", "easy")).toBeNull();
  });

  it("throws on other errors", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { message: "boom" } } } });
    await expect(findExistingLesson(mock as never, "u1", "travel", "easy")).rejects.toMatchObject({ message: "boom" });
  });
});

describe("countGeneratedLessons", () => {
  it("returns a head count filtered by user_id only", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: null, count: 4 } } });
    expect(await countGeneratedLessons(mock as never, "u1")).toBe(4);
    const builder = mock.builderFor("generated_lessons");
    expect(builder.eq).toHaveBeenCalledTimes(1);
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { generated_lessons: { data: null, error: { message: "boom" } } } });
    await expect(countGeneratedLessons(mock as never, "u1")).rejects.toMatchObject({ message: "boom" });
  });
});
