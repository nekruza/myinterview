import { hasProAccess, PLANS, isBillingPlan, FREE_CONVERSATIONS, FREE_GENERATIONS } from "@/lib/billing";

describe("billing", () => {
  const now = new Date("2026-09-13T12:00:00Z");

  it("grants pro to active subscriptions in period", () =>
    expect(hasProAccess({ pro_status: "active", pro_current_period_end: "2026-10-13T00:00:00Z" }, now)).toBe(true));

  it("grants pro to trialing with no end", () =>
    expect(hasProAccess({ pro_status: "trialing", pro_current_period_end: null }, now)).toBe(true));

  it("denies expired periods", () =>
    expect(hasProAccess({ pro_status: "active", pro_current_period_end: "2026-09-01T00:00:00Z" }, now)).toBe(false));

  it.each(["canceled", "past_due", "incomplete", null])("denies status %s", (s) =>
    expect(hasProAccess({ pro_status: s }, now)).toBe(false)
  );

  it("denies missing profiles", () => expect(hasProAccess(null, now)).toBe(false));

  it("prices plans", () => {
    expect(PLANS.monthly.amountCents).toBe(999);
    expect(PLANS.yearly.amountCents).toBe(5999);
    expect(PLANS.yearly.interval).toBe("year");
  });

  it("guards plans", () => {
    expect(isBillingPlan("yearly")).toBe(true);
    expect(isBillingPlan("weekly")).toBe(false);
  });

  it("free limits", () => {
    expect(FREE_CONVERSATIONS).toBe(3);
    expect(FREE_GENERATIONS).toBe(3);
  });
});
