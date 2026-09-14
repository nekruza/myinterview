import type { NextRequest } from "next/server";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

const createCheckoutSession = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkout: { sessions: { create: createCheckoutSession } },
  })),
}));

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

process.env.STRIPE_SECRET_KEY = "sk_test";

// The route lazily builds the Stripe client on first use, so it is safe to
// import normally rather than requiring it after env/mocks are in place.
import { POST } from "../route";
const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "jane@example.com" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function freeProfile(overrides: Record<string, unknown> = {}) {
  return {
    id: USER.id,
    stripe_customer_id: null,
    stripe_subscription_id: null,
    pro_status: null,
    pro_current_period_end: null,
    ...overrides,
  };
}

function checkoutRequest(body: unknown, url = "http://localhost/api/stripe/checkout") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

beforeEach(() => {
  createCheckoutSession.mockResolvedValue({ url: "https://checkout.stripe.com/session/xyz" });
  delete process.env.NEXT_PUBLIC_APP_URL;
});

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("authorisation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(checkoutRequest({ plan: "monthly" }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
});

describe("plan validation", () => {
  it("returns 400 for a missing plan", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    const res = await POST(checkoutRequest({}));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid plan" });
  });

  it("returns 400 for an unrecognised plan", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    const res = await POST(checkoutRequest({ plan: "lifetime" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid plan" });
  });
});

describe("already pro", () => {
  it("returns 409 when the caller already has active Pro access", async () => {
    mockSupabase({
      user: USER,
      tables: {
        profiles: {
          data: freeProfile({ pro_status: "active", pro_current_period_end: "2999-01-01T00:00:00.000Z" }),
          error: null,
        },
      },
    });

    const res = await POST(checkoutRequest({ plan: "monthly" }));

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toEqual({ error: "already_pro" });
    expect(createCheckoutSession).not.toHaveBeenCalled();
  });

  it("allows checkout when a past subscription has already expired", async () => {
    mockSupabase({
      user: USER,
      tables: {
        profiles: {
          data: freeProfile({ pro_status: "canceled", pro_current_period_end: "2000-01-01T00:00:00.000Z" }),
          error: null,
        },
      },
    });

    const res = await POST(checkoutRequest({ plan: "monthly" }));

    expect(res.status).toBe(200);
  });
});

describe("checkout session creation", () => {
  it("creates a subscription-mode session with inline price_data for the monthly plan", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "subscription",
        line_items: [
          {
            quantity: 1,
            price_data: {
              currency: "usd",
              unit_amount: 999,
              recurring: { interval: "month" },
              product_data: {
                name: "Fina Pro",
                description: "Unlimited AI voice conversations and word generation",
              },
            },
          },
        ],
      })
    );
  });

  it("creates a yearly session with the yearly amount and interval", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "yearly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.line_items[0].price_data.unit_amount).toBe(5999);
    expect(args.line_items[0].price_data.recurring).toEqual({ interval: "year" });
  });

  it("passes client_reference_id and metadata for both the session and the subscription", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.client_reference_id).toBe(USER.id);
    expect(args.metadata).toEqual({ user_id: USER.id, plan: "monthly" });
    expect(args.subscription_data).toEqual({ metadata: { user_id: USER.id, plan: "monthly" } });
  });

  it("allows promotion codes", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    expect(createCheckoutSession.mock.calls[0][0].allow_promotion_codes).toBe(true);
  });

  it("uses success and cancel urls derived from the request origin", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.success_url).toBe(
      "http://localhost/api/stripe/verify-purchase?session_id={CHECKOUT_SESSION_ID}"
    );
    expect(args.cancel_url).toBe("http://localhost/app/settings?canceled=1");
  });

  it("prefers the configured app url for success/cancel urls", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://fina.app";
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.success_url).toBe("https://fina.app/api/stripe/verify-purchase?session_id={CHECKOUT_SESSION_ID}");
    expect(args.cancel_url).toBe("https://fina.app/app/settings?canceled=1");
  });

  it("returns the session url", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    const res = await POST(checkoutRequest({ plan: "monthly" }));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: "https://checkout.stripe.com/session/xyz" });
  });
});

describe("customer identification", () => {
  it("passes the existing stripe customer id and omits customer_email when one is on file", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: freeProfile({ stripe_customer_id: "cus_123" }), error: null } },
    });

    await POST(checkoutRequest({ plan: "monthly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.customer).toBe("cus_123");
    expect(args.customer_email).toBeUndefined();
  });

  it("falls back to customer_email when there is no stripe customer yet", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.customer).toBeUndefined();
    expect(args.customer_email).toBe(USER.email);
  });

  it("treats a missing profile row as having no stripe customer", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: null, error: null } } });

    await POST(checkoutRequest({ plan: "monthly" }));

    const args = createCheckoutSession.mock.calls[0][0];
    expect(args.customer).toBeUndefined();
    expect(args.customer_email).toBe(USER.email);
  });
});

describe("stripe errors", () => {
  it("returns 500 with the Stripe error message when the session cannot be created", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: freeProfile(), error: null } } });
    createCheckoutSession.mockRejectedValue(new Error("No such price"));

    const res = await POST(checkoutRequest({ plan: "monthly" }));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "No such price" });
  });
});
