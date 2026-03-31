import { SESSION_LIMITS } from "../session-limits";

describe("SESSION_LIMITS", () => {
  it("free tier allows 3 sessions", () => {
    expect(SESSION_LIMITS.free).toBe(3);
  });

  it("pro tier allows 30 sessions", () => {
    expect(SESSION_LIMITS.pro).toBe(30);
  });

  it("max tier allows 100 sessions", () => {
    expect(SESSION_LIMITS.max).toBe(100);
  });
});
