import { safeNext } from "@/lib/safe-next";

describe("safeNext", () => {
  it("accepts a same-site path", () => {
    expect(safeNext("/app/x")).toBe("/app/x");
  });

  it("rejects a protocol-relative URL (//evil.com)", () => {
    expect(safeNext("//evil.com")).toBe("/app");
  });

  it("rejects a backslash-prefixed URL (browsers normalize \\ to /)", () => {
    expect(safeNext("/\\evil.com")).toBe("/app");
  });

  it("rejects an absolute URL to another origin", () => {
    expect(safeNext("https://evil.com")).toBe("/app");
  });

  it("rejects a javascript: URL", () => {
    expect(safeNext("javascript:alert(1)")).toBe("/app");
  });

  it("falls back for an empty string", () => {
    expect(safeNext("")).toBe("/app");
  });

  it("falls back for null", () => {
    expect(safeNext(null)).toBe("/app");
  });

  it("falls back for undefined", () => {
    expect(safeNext(undefined)).toBe("/app");
  });

  it("rejects a path containing control characters", () => {
    expect(safeNext("/app\x00/x")).toBe("/app");
    expect(safeNext("/app\t/x")).toBe("/app");
  });

  it("honors a custom fallback", () => {
    expect(safeNext(null, "/onboarding")).toBe("/onboarding");
    expect(safeNext("//evil.com", "/onboarding")).toBe("/onboarding");
  });

  it("accepts a bare slash", () => {
    expect(safeNext("/")).toBe("/");
  });

  it("accepts a path with a query string", () => {
    expect(safeNext("/app/settings?tab=billing")).toBe("/app/settings?tab=billing");
  });
});
