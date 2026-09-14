import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";
import { submitFeedback } from "@/lib/db/feedback";

describe("submitFeedback", () => {
  it("inserts type/message/user_id/user_email", async () => {
    const mock = createSupabaseMock({ tables: { feedback: { data: null, error: null } } });
    await submitFeedback(mock as never, { type: "bug", message: "It crashed", userId: "u1", userEmail: "u1@test.com" });
    expect(writePayload(mock, "feedback", "insert")).toEqual({
      type: "bug",
      message: "It crashed",
      user_id: "u1",
      user_email: "u1@test.com",
    });
  });

  it("allows anonymous feedback (null userId/userEmail)", async () => {
    const mock = createSupabaseMock({ tables: { feedback: { data: null, error: null } } });
    await submitFeedback(mock as never, { type: "feature", message: "Add dark mode", userId: null, userEmail: null });
    expect(writePayload(mock, "feedback", "insert")).toEqual({
      type: "feature",
      message: "Add dark mode",
      user_id: null,
      user_email: null,
    });
  });

  it("throws on error", async () => {
    const mock = createSupabaseMock({ tables: { feedback: { data: null, error: { message: "boom" } } } });
    await expect(
      submitFeedback(mock as never, { type: "compliment", message: "Nice app", userId: "u1", userEmail: "u1@test.com" })
    ).rejects.toMatchObject({ message: "boom" });
  });
});
