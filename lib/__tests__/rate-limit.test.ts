import {
  clientIp,
  rateLimit,
  resetRateLimit,
  __resetAllRateLimits,
} from "@/lib/rate-limit";

beforeEach(() => {
  __resetAllRateLimits();
});

afterEach(() => {
  jest.useRealTimers();
});

describe("rateLimit", () => {
  it("allows requests up to the limit", () => {
    for (let i = 0; i < 3; i++) {
      expect(rateLimit("k", 3, 60).ok).toBe(true);
    }
  });

  it("blocks the request that exceeds the limit", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60);
    const blocked = rateLimit("k", 3, 60);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("counts each key independently", () => {
    for (let i = 0; i < 3; i++) rateLimit("a", 3, 60);
    expect(rateLimit("a", 3, 60).ok).toBe(false);
    expect(rateLimit("b", 3, 60).ok).toBe(true);
  });

  it("reports remaining attempts", () => {
    expect(rateLimit("k", 3, 60).remaining).toBe(2);
    expect(rateLimit("k", 3, 60).remaining).toBe(1);
    expect(rateLimit("k", 3, 60).remaining).toBe(0);
  });

  it("reopens after the window elapses", () => {
    jest.useFakeTimers();
    const start = Date.now();
    jest.setSystemTime(start);

    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60);
    expect(rateLimit("k", 3, 60).ok).toBe(false);

    jest.setSystemTime(start + 61_000);
    expect(rateLimit("k", 3, 60).ok).toBe(true);
  });

  it("clears a key on resetRateLimit", () => {
    for (let i = 0; i < 3; i++) rateLimit("k", 3, 60);
    expect(rateLimit("k", 3, 60).ok).toBe(false);

    resetRateLimit("k");
    expect(rateLimit("k", 3, 60).ok).toBe(true);
  });
});

describe("clientIp", () => {
  function req(headers: Record<string, string>) {
    return { headers: { get: (n: string) => headers[n] ?? null } };
  }

  it("takes the first entry of x-forwarded-for", () => {
    expect(clientIp(req({ "x-forwarded-for": "1.2.3.4, 5.6.7.8" }))).toBe(
      "1.2.3.4"
    );
  });

  it("falls back to x-real-ip", () => {
    expect(clientIp(req({ "x-real-ip": "9.9.9.9" }))).toBe("9.9.9.9");
  });

  it("falls back to a shared bucket when no headers are present", () => {
    expect(clientIp(req({}))).toBe("unknown");
  });
});
