import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import { countGenerationEvents, recordGenerationEvent } from "@/lib/db/generationEvents";

describe("countGenerationEvents", () => {
  it("returns a head count of the user's generation events", async () => {
    const mock = createSupabaseMock({ tables: { vocabulary_generation_events: { data: null, error: null, count: 4 } } });

    await expect(countGenerationEvents(mock as never, "u1")).resolves.toBe(4);

    const builder = mock.builderFor("vocabulary_generation_events");
    expect(builder.select).toHaveBeenCalledWith("id", { count: "exact", head: true });
    expect(builder.eq).toHaveBeenCalledWith("user_id", "u1");
  });

  it("treats a null count as zero", async () => {
    const mock = createSupabaseMock({ tables: { vocabulary_generation_events: { data: null, error: null, count: null } } });

    await expect(countGenerationEvents(mock as never, "u1")).resolves.toBe(0);
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({
      tables: { vocabulary_generation_events: { data: null, error: { message: "boom" } } },
    });

    await expect(countGenerationEvents(mock as never, "u1")).rejects.toEqual({ message: "boom" });
  });
});

describe("recordGenerationEvent", () => {
  it("appends one event for the user", async () => {
    const mock = createSupabaseMock({ tables: { vocabulary_generation_events: { data: null, error: null } } });

    await recordGenerationEvent(mock as never, "u1");

    expect(writePayload(mock, "vocabulary_generation_events", "insert")).toEqual({ user_id: "u1" });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({
      tables: { vocabulary_generation_events: { data: null, error: { message: "rls" } } },
    });

    await expect(recordGenerationEvent(mock as never, "u1")).rejects.toEqual({ message: "rls" });
  });
});
