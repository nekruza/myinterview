import type Stripe from "stripe";

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation((key: string, opts: unknown) => ({ __key: key, __opts: opts })),
}));

import { getStripe, subscriptionToProfileFields } from "../stripe";

const StripeCtor = jest.requireMock("stripe").default as jest.Mock;

const ORIGINAL_KEY = process.env.STRIPE_SECRET_KEY;

afterEach(() => {
  if (ORIGINAL_KEY === undefined) delete process.env.STRIPE_SECRET_KEY;
  else process.env.STRIPE_SECRET_KEY = ORIGINAL_KEY;
});

describe("getStripe", () => {
  // Must run before any test below caches the module-level singleton.
  it("throws when STRIPE_SECRET_KEY is not configured", () => {
    delete process.env.STRIPE_SECRET_KEY;
    expect(() => getStripe()).toThrow("STRIPE_SECRET_KEY not configured");
  });

  it("constructs a Stripe client once, pinned to the contracted API version, and reuses it", () => {
    process.env.STRIPE_SECRET_KEY = "sk_test_123";

    const a = getStripe();
    const b = getStripe();

    expect(a).toBe(b);
    expect(StripeCtor).toHaveBeenCalledTimes(1);
    expect(StripeCtor).toHaveBeenCalledWith("sk_test_123", { apiVersion: "2026-02-25.clover" });
  });
});

type SubInput = Pick<Stripe.Subscription, "id" | "status" | "customer"> & {
  items?: { data: { current_period_end?: number }[] };
  current_period_end?: number;
};

function sub(overrides: Partial<SubInput> = {}): SubInput {
  return {
    id: "sub_123",
    status: "active",
    customer: "cus_123",
    ...overrides,
  };
}

describe("subscriptionToProfileFields", () => {
  it("prefers the item-level current_period_end", () => {
    const result = subscriptionToProfileFields(
      sub({ items: { data: [{ current_period_end: 1_700_000_000 }] }, current_period_end: 1_600_000_000 })
    );

    expect(result.pro_current_period_end).toBe(new Date(1_700_000_000 * 1000).toISOString());
  });

  it("falls back to the top-level current_period_end when items are absent", () => {
    const result = subscriptionToProfileFields(sub({ current_period_end: 1_650_000_000 }));

    expect(result.pro_current_period_end).toBe(new Date(1_650_000_000 * 1000).toISOString());
  });

  it("falls back to the top-level current_period_end when the item has none", () => {
    const result = subscriptionToProfileFields(
      sub({ items: { data: [{}] }, current_period_end: 1_650_000_000 })
    );

    expect(result.pro_current_period_end).toBe(new Date(1_650_000_000 * 1000).toISOString());
  });

  it("returns null when neither item-level nor top-level period end is present", () => {
    const result = subscriptionToProfileFields(sub());

    expect(result.pro_current_period_end).toBeNull();
  });

  it("passes through id and status", () => {
    const result = subscriptionToProfileFields(sub({ id: "sub_abc", status: "trialing" }));

    expect(result.stripe_subscription_id).toBe("sub_abc");
    expect(result.pro_status).toBe("trialing");
  });

  it("keeps a string customer id as-is", () => {
    const result = subscriptionToProfileFields(sub({ customer: "cus_string" }));

    expect(result.stripe_customer_id).toBe("cus_string");
  });

  it("extracts the id from an expanded customer object", () => {
    const result = subscriptionToProfileFields(
      sub({ customer: { id: "cus_expanded" } as Stripe.Customer })
    );

    expect(result.stripe_customer_id).toBe("cus_expanded");
  });

  it("returns null when there is no customer", () => {
    const result = subscriptionToProfileFields(sub({ customer: null as unknown as string }));

    expect(result.stripe_customer_id).toBeNull();
  });
});
