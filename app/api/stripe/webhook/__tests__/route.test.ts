import type { NextRequest } from "next/server";
import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";

// The route builds its Stripe and Supabase clients at module load, so both have
// to be mocked before `../route` is imported.
const constructEvent = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent },
  })),
}));

const supabaseAdmin = createSupabaseMock();
jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => supabaseAdmin),
}));

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

// The route builds its clients at module load, so it must be required after
// the mocks and env vars above are in place.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { POST } = require("../route") as typeof import("../route");

const USER_ID = "user-1";
const STRIPE_SESSION_ID = "cs_test_123";

function webhookRequest(signature: string | null = "sig-abc", body = "{}") {
  const headers = new Headers();
  if (signature !== null) headers.set("stripe-signature", signature);
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  }) as unknown as NextRequest;
}

function checkoutCompleted(overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: STRIPE_SESSION_ID,
        client_reference_id: USER_ID,
        metadata: { sessions: "20" },
        customer: null,
        ...overrides,
      },
    },
  };
}

/**
 * Reset the shared admin-client double and load it with the profile row the
 * handler will read during the idempotency check.
 */
function seedProfile(profile: Record<string, unknown> | null) {
  supabaseAdmin.calls.length = 0;
  supabaseAdmin.from.mockImplementation(() => {
    const { createQueryBuilder } = jest.requireActual<
      typeof import("@/test-utils/supabase-mock")
    >("@/test-utils/supabase-mock");
    const builder = createQueryBuilder({ data: profile, error: null });
    supabaseAdmin.calls.push({ table: "profiles", builder });
    return builder;
  });
}

beforeEach(() => {
  seedProfile({ session_credits: 5, last_stripe_session_id: null });
});

describe("signature verification", () => {
  it("rejects a request with no stripe-signature header", async () => {
    const res = await POST(webhookRequest(null));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing signature" });
    expect(constructEvent).not.toHaveBeenCalled();
  });

  it("rejects a request whose signature does not verify", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid signature" });
  });

  it("does not credit anyone when the signature is invalid", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    await POST(webhookRequest());

    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("verifies the raw body against the webhook secret", async () => {
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest("sig-abc", '{"id":"evt_1"}'));

    expect(constructEvent).toHaveBeenCalledWith(
      '{"id":"evt_1"}',
      "sig-abc",
      "whsec_test"
    );
  });
});

describe("checkout.session.completed", () => {
  it("acknowledges the event", async () => {
    constructEvent.mockReturnValue(checkoutCompleted());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
  });

  it("adds the purchased credits on top of the existing balance", async () => {
    seedProfile({ session_credits: 5, last_stripe_session_id: null });
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toEqual({
      session_credits: 25,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
  });

  it("records the stripe session id so the credit cannot be replayed", async () => {
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest());

    expect(
      writePayload(supabaseAdmin, "profiles", "update").last_stripe_session_id
    ).toBe(STRIPE_SESSION_ID);
  });

  it("credits from zero when the profile has no balance yet", async () => {
    seedProfile({ session_credits: null, last_stripe_session_id: null });
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update").session_credits).toBe(20);
  });

  it("credits from zero when the profile row is missing entirely", async () => {
    seedProfile(null);
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update").session_credits).toBe(20);
  });

  it.each([
    ["5", 5],
    ["20", 20],
    ["50", 50],
  ])("credits a %s-session pack", async (metadataValue, expected) => {
    seedProfile({ session_credits: 0, last_stripe_session_id: null });
    constructEvent.mockReturnValue(
      checkoutCompleted({ metadata: { sessions: metadataValue } })
    );

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update").session_credits).toBe(
      expected
    );
  });
});

describe("idempotency", () => {
  it("does not credit twice for the same stripe session", async () => {
    seedProfile({
      session_credits: 25,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeUndefined();
  });

  it("still acknowledges a duplicate delivery so Stripe stops retrying", async () => {
    seedProfile({
      session_credits: 25,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
    constructEvent.mockReturnValue(checkoutCompleted());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
  });

  it("credits a genuinely new purchase by the same user", async () => {
    seedProfile({
      session_credits: 25,
      last_stripe_session_id: "cs_test_OLD",
    });
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toEqual({
      session_credits: 45,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
  });
});

describe("malformed checkout sessions", () => {
  it("skips crediting when there is no user reference", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ client_reference_id: null }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("skips crediting when the session count metadata is missing", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ metadata: {} }));

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeUndefined();
  });

  it("skips crediting when the session count is zero", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ metadata: { sessions: "0" } }));

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeUndefined();
  });

  it("skips crediting when the session count is not a number", async () => {
    constructEvent.mockReturnValue(
      checkoutCompleted({ metadata: { sessions: "twenty" } })
    );

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeUndefined();
  });

  it("does not credit a negative session count", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ metadata: { sessions: "-5" } }));

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeUndefined();
  });
});

describe("stripe customer linkage", () => {
  it("stores the stripe customer id on the profile", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ customer: "cus_123" }));

    await POST(webhookRequest());

    // Second update on profiles is the customer linkage.
    expect(writePayload(supabaseAdmin, "profiles", "update", 1)).toEqual({
      stripe_customer_id: "cus_123",
    });
  });

  it("does not write a customer id when the session has none", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ customer: null }));

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update", 1)).toBeUndefined();
  });

  it("still links the customer when the credit was already applied", async () => {
    seedProfile({
      session_credits: 25,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
    constructEvent.mockReturnValue(checkoutCompleted({ customer: "cus_123" }));

    await POST(webhookRequest());

    expect(writePayload(supabaseAdmin, "profiles", "update")).toEqual({
      stripe_customer_id: "cus_123",
    });
  });
});

describe("other event types", () => {
  it.each([
    "customer.subscription.updated",
    "customer.subscription.deleted",
  ])("acknowledges the legacy %s event without crediting", async (type) => {
    constructEvent.mockReturnValue({ type, data: { object: {} } });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("acknowledges an unrecognised event type", async () => {
    constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: {} },
    });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
  });
});
