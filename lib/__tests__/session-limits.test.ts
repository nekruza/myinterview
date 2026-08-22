import {
  FREE_TRIAL_CREDITS,
  SESSION_LIMITS,
  SESSION_PACKS,
  calcPackPricePence,
  getPackPrice,
  type PackSize,
} from "../session-limits";

describe("FREE_TRIAL_CREDITS", () => {
  it("grants 3 free sessions before payment is required", () => {
    expect(FREE_TRIAL_CREDITS).toBe(3);
  });
});

describe("SESSION_PACKS", () => {
  it("exposes exactly the three purchasable pack sizes", () => {
    expect(SESSION_PACKS.map((p) => p.sessions)).toEqual([5, 20, 50]);
  });

  it("has no duplicate pack sizes", () => {
    const sizes = SESSION_PACKS.map((p) => p.sessions);
    expect(new Set(sizes).size).toBe(sizes.length);
  });

  it("gets cheaper per session as the pack grows", () => {
    const perSession = SESSION_PACKS.map((p) => p.priceGbp / p.sessions);
    for (let i = 1; i < perSession.length; i++) {
      expect(perSession[i]).toBeLessThan(perSession[i - 1]);
    }
  });

  it("prices every pack above zero in both currencies", () => {
    for (const pack of SESSION_PACKS) {
      expect(pack.priceGbp).toBeGreaterThan(0);
      expect(pack.priceUsd).toBeGreaterThan(0);
      expect(pack.sessions).toBeGreaterThan(0);
    }
  });

  it("advertises a saving that matches the discount off the smallest pack", () => {
    const [base] = SESSION_PACKS;
    const baseRate = base.priceGbp / base.sessions;

    for (const pack of SESSION_PACKS) {
      const actualSaving = (1 - pack.priceGbp / pack.sessions / baseRate) * 100;
      // The marketing figure is rounded, so allow a couple of points of drift
      // but catch a claim that is outright wrong.
      expect(Math.abs(actualSaving - pack.savingPct)).toBeLessThan(5);
    }
  });

  it("labels only the discounted packs", () => {
    expect(SESSION_PACKS[0].label).toBeNull();
    expect(SESSION_PACKS[1].label).toBe("Save 30%");
    expect(SESSION_PACKS[2].label).toBe("Best value");
  });
});

describe("getPackPrice", () => {
  it.each(SESSION_PACKS.map((p) => [p.sessions, p] as const))(
    "returns the full pack record for %i sessions",
    (sessions, expected) => {
      expect(getPackPrice(sessions)).toEqual(expected);
    }
  );

  it("throws on a pack size that is not for sale", () => {
    expect(() => getPackPrice(7 as PackSize)).toThrow("Unknown pack size: 7");
  });

  it("throws rather than coercing a stringified size", () => {
    expect(() => getPackPrice("5" as unknown as PackSize)).toThrow(
      "Unknown pack size: 5"
    );
  });
});

describe("calcPackPricePence", () => {
  it.each([
    [5, 500],
    [20, 1400],
    [50, 2900],
  ] as const)("converts the £ price of the %i pack to %i pence", (sessions, pence) => {
    expect(calcPackPricePence(sessions)).toBe(pence);
  });

  it("always returns a whole number of pence for Stripe", () => {
    for (const pack of SESSION_PACKS) {
      expect(Number.isInteger(calcPackPricePence(pack.sessions))).toBe(true);
    }
  });

  it("propagates the error for an unknown pack size", () => {
    expect(() => calcPackPricePence(999 as PackSize)).toThrow(
      "Unknown pack size: 999"
    );
  });
});

describe("SESSION_LIMITS", () => {
  it("free tier matches the free trial credit grant", () => {
    expect(SESSION_LIMITS.free).toBe(3);
    expect(SESSION_LIMITS.free).toBe(FREE_TRIAL_CREDITS);
  });

  it("pro tier is effectively unlimited", () => {
    expect(SESSION_LIMITS.pro).toBe(9999);
  });

  it("defines a limit for every plan", () => {
    expect(Object.keys(SESSION_LIMITS).sort()).toEqual(["free", "pro"]);
  });
});
