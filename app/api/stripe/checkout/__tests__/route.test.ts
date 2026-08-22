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

// The route builds its clients at module load, so it must be required after
// the mocks and env vars above are in place.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("../route") as typeof import("../route");
const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1", email: "buyer@example.com" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function checkoutRequest(body: unknown, url = "http://localhost/api/stripe/checkout") {
  return new Request(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  }) as unknown as NextRequest;
}

function authedUser(fullName: string | null = "Jane Doe") {
  return mockSupabase({
    user: USER,
    tables: { profiles: { data: { full_name: fullName }, error: null } },
  });
}

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

beforeEach(() => {
  createCheckoutSession.mockResolvedValue({
    id: "cs_test_1",
    url: "https://checkout.stripe.com/pay/cs_test_1",
  });
  delete process.env.NEXT_PUBLIC_APP_URL;
});

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("authorisation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(checkoutRequest({ sessions: 20 }));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("does not create a Stripe session for an anonymous caller", async () => {
    mockSupabase({ user: null });

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
});

describe("pack validation", () => {
  it.each([5, 20, 50])("accepts the %i-session pack", async (sessions) => {
    authedUser();

    const res = await POST(checkoutRequest({ sessions }));

    expect(res.status).toBe(200);
  });

  it.each([
    ["a pack size that is not for sale", { sessions: 7 }],
    ["zero sessions", { sessions: 0 }],
    ["a negative pack size", { sessions: -5 }],
    ["a non-numeric pack size", { sessions: "twenty" }],
    ["a missing pack size", {}],
    ["a null pack size", { sessions: null }],
  ])("rejects %s", async (_label, body) => {
    authedUser();

    const res = await POST(checkoutRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid pack size. Choose from: 5, 20, 50",
    });
  });

  it("rejects a malformed JSON body rather than throwing", async () => {
    authedUser();

    const res = await POST(checkoutRequest("not json"));

    expect(res.status).toBe(400);
  });

  it("accepts a numeric string for a valid pack size", async () => {
    authedUser();

    const res = await POST(checkoutRequest({ sessions: "20" }));

    expect(res.status).toBe(200);
  });

  it("does not create a Stripe session for an invalid pack", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 7 }));

    expect(createCheckoutSession).not.toHaveBeenCalled();
  });
});

describe("checkout session creation", () => {
  it("returns the Stripe hosted checkout url", async () => {
    authedUser();

    const res = await POST(checkoutRequest({ sessions: 20 }));

    await expect(res.json()).resolves.toEqual({
      url: "https://checkout.stripe.com/pay/cs_test_1",
    });
  });

  it("charges a one-time card payment in GBP", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: "payment",
        payment_method_types: ["card"],
      })
    );
    expect(createCheckoutSession.mock.calls[0][0].line_items[0].price_data.currency)
      .toBe("gbp");
  });

  it.each([
    [5, 500],
    [20, 1400],
    [50, 2900],
  ])("charges the %i-session pack at %i pence", async (sessions, pence) => {
    authedUser();

    await POST(checkoutRequest({ sessions }));

    expect(
      createCheckoutSession.mock.calls[0][0].line_items[0].price_data.unit_amount
    ).toBe(pence);
  });

  it("names the product after the pack and quantity", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    const productData =
      createCheckoutSession.mock.calls[0][0].line_items[0].price_data.product_data;
    expect(productData.name).toBe("20 Interview Sessions");
    expect(productData.description).toContain("£14");
  });

  it("buys exactly one pack per checkout", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession.mock.calls[0][0].line_items[0].quantity).toBe(1);
  });

  it("references the buyer so the webhook can credit them", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession).toHaveBeenCalledWith(
      expect.objectContaining({
        client_reference_id: USER.id,
        customer_email: USER.email,
      })
    );
  });

  it("carries the pack size in metadata for the webhook to read", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 50 }));

    expect(createCheckoutSession.mock.calls[0][0].metadata).toEqual({
      user_id: USER.id,
      full_name: "Jane Doe",
      sessions: "50",
    });
  });

  it("falls back to an empty name when the profile has none", async () => {
    authedUser(null);

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession.mock.calls[0][0].metadata.full_name).toBe("");
  });

  it("still creates the checkout when the profile row is missing", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: null, error: null } } });

    const res = await POST(checkoutRequest({ sessions: 20 }));

    expect(res.status).toBe(200);
    expect(createCheckoutSession.mock.calls[0][0].metadata.full_name).toBe("");
  });
});

describe("redirect urls", () => {
  it("sends a successful payment through verify-purchase for crediting", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession.mock.calls[0][0].success_url).toBe(
      "http://localhost/api/stripe/verify-purchase?session_id={CHECKOUT_SESSION_ID}&sessions=20"
    );
  });

  it("returns a cancelled payment to settings", async () => {
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession.mock.calls[0][0].cancel_url).toBe(
      "http://localhost/app/settings"
    );
  });

  it("prefers the configured app url over the request origin", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://myinterview.app";
    authedUser();

    await POST(checkoutRequest({ sessions: 20 }));

    expect(createCheckoutSession.mock.calls[0][0].success_url).toMatch(
      /^https:\/\/myinterview\.app\//
    );
    expect(createCheckoutSession.mock.calls[0][0].cancel_url).toBe(
      "https://myinterview.app/app/settings"
    );
  });

  it("derives the origin from the request when no app url is configured", async () => {
    authedUser();

    await POST(
      checkoutRequest({ sessions: 20 }, "https://preview.vercel.app/api/stripe/checkout")
    );

    expect(createCheckoutSession.mock.calls[0][0].cancel_url).toBe(
      "https://preview.vercel.app/app/settings"
    );
  });
});
