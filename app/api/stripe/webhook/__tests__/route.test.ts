import type { NextRequest } from "next/server";
import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";

const constructEvent = jest.fn();
const retrieveSubscription = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    webhooks: { constructEvent },
    subscriptions: { retrieve: retrieveSubscription },
  })),
}));

const supabaseAdmin = createSupabaseMock();
jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(() => supabaseAdmin),
}));

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.STRIPE_WEBHOOK_SECRET = "whsec_test";

import { POST } from "../route";
const { createAdminClient } = jest.requireMock("@/lib/supabase/admin");

const USER_ID = "user-1";
const SUBSCRIPTION_ID = "sub_123";
const CUSTOMER_ID = "cus_123";

function webhookRequest(signature: string | null = "sig-abc", body = "{}") {
  const headers = new Headers();
  if (signature !== null) headers.set("stripe-signature", signature);
  return new Request("http://localhost/api/stripe/webhook", {
    method: "POST",
    headers,
    body,
  }) as unknown as NextRequest;
}

function activeSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: SUBSCRIPTION_ID,
    status: "active",
    customer: CUSTOMER_ID,
    items: { data: [{ current_period_end: 1_700_000_000 }] },
    metadata: { user_id: USER_ID },
    ...overrides,
  };
}

function checkoutCompleted(overrides: Record<string, unknown> = {}) {
  return {
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_test_123",
        mode: "subscription",
        client_reference_id: USER_ID,
        subscription: SUBSCRIPTION_ID,
        ...overrides,
      },
    },
  };
}

function subscriptionEvent(type: string, overrides: Record<string, unknown> = {}) {
  return { type, data: { object: activeSubscription(overrides) } };
}

/** Every `.from("profiles")` call matches by default (simulates a normal, matched update). */
function seedDefaultProfilesMatch() {
  supabaseAdmin.from.mockImplementation((table: string) => {
    const { createQueryBuilder } = jest.requireActual<typeof import("@/test-utils/supabase-mock")>(
      "@/test-utils/supabase-mock"
    );
    const builder = createQueryBuilder({ data: [{ id: USER_ID }], error: null });
    supabaseAdmin.calls.push({ table, builder });
    return builder;
  });
}

/** Every `.from("profiles")` call returns an error (simulates a DB failure). */
function seedProfilesError(message = "boom") {
  supabaseAdmin.from.mockImplementation((table: string) => {
    const { createQueryBuilder } = jest.requireActual<typeof import("@/test-utils/supabase-mock")>(
      "@/test-utils/supabase-mock"
    );
    const builder = createQueryBuilder({ data: null, error: { message } });
    supabaseAdmin.calls.push({ table, builder });
    return builder;
  });
}

/** Every `.from("profiles")` call matches nothing (simulates no row satisfying the filter). */
function seedNoProfilesMatch() {
  supabaseAdmin.from.mockImplementation((table: string) => {
    const { createQueryBuilder } = jest.requireActual<typeof import("@/test-utils/supabase-mock")>(
      "@/test-utils/supabase-mock"
    );
    const builder = createQueryBuilder({ data: [], error: null });
    supabaseAdmin.calls.push({ table, builder });
    return builder;
  });
}

const ORIGINAL_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  supabaseAdmin.calls.length = 0;
  seedDefaultProfilesMatch();
  retrieveSubscription.mockResolvedValue(activeSubscription());
});

afterEach(() => {
  if (ORIGINAL_SERVICE_ROLE_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_SERVICE_ROLE_KEY;
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

  it("does not touch the database when the signature is invalid", async () => {
    constructEvent.mockImplementation(() => {
      throw new Error("bad signature");
    });

    await POST(webhookRequest());

    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("verifies the raw body against the webhook secret", async () => {
    constructEvent.mockReturnValue(checkoutCompleted());

    await POST(webhookRequest("sig-abc", '{"id":"evt_1"}'));

    expect(constructEvent).toHaveBeenCalledWith('{"id":"evt_1"}', "sig-abc", "whsec_test");
  });
});

describe("missing service role key", () => {
  it("returns 500 without touching the database", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;
    constructEvent.mockReturnValue(checkoutCompleted());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Server not configured" });
    expect(createAdminClient).not.toHaveBeenCalled();
  });
});

describe("checkout.session.completed", () => {
  it("retrieves the subscription and updates the profile by client_reference_id", async () => {
    constructEvent.mockReturnValue(checkoutCompleted());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscription).toHaveBeenCalledWith(SUBSCRIPTION_ID);
    expect(writePayload(supabaseAdmin, "profiles", "update")).toEqual({
      stripe_subscription_id: SUBSCRIPTION_ID,
      stripe_customer_id: CUSTOMER_ID,
      pro_status: "active",
      pro_current_period_end: new Date(1_700_000_000 * 1000).toISOString(),
    });
    expect(supabaseAdmin.builderFor("profiles").eq).toHaveBeenCalledWith("id", USER_ID);
  });

  it("ignores a non-subscription-mode checkout session", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ mode: "payment" }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscription).not.toHaveBeenCalled();
    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("does nothing when there is no client_reference_id", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ client_reference_id: null }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscription).not.toHaveBeenCalled();
  });

  it("does nothing when the session has no subscription", async () => {
    constructEvent.mockReturnValue(checkoutCompleted({ subscription: null }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscription).not.toHaveBeenCalled();
  });
});

describe.each(["customer.subscription.created", "customer.subscription.updated"])("%s", (type) => {
  it("writes the re-retrieved subscription's fields (not the event payload's) matched by stripe_subscription_id", async () => {
    // The event payload itself carries a stale/incomplete snapshot, but the
    // re-retrieved subscription (what the handler must actually write) is active.
    retrieveSubscription.mockResolvedValue(activeSubscription({ status: "active" }));
    constructEvent.mockReturnValue(subscriptionEvent(type, { status: "incomplete" }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscription).toHaveBeenCalledWith(SUBSCRIPTION_ID);
    expect(writePayload(supabaseAdmin, "profiles", "update").pro_status).toBe("active");
    expect(supabaseAdmin.builderFor("profiles").eq).toHaveBeenCalledWith("stripe_subscription_id", SUBSCRIPTION_ID);
  });

  it("falls back to updating by metadata.user_id when no row matches the subscription id", async () => {
    let call = 0;
    supabaseAdmin.from.mockImplementation((table: string) => {
      const { createQueryBuilder } = jest.requireActual<typeof import("@/test-utils/supabase-mock")>(
        "@/test-utils/supabase-mock"
      );
      call += 1;
      // First update (by subscription id) matches nothing; second (by user id, scoped) succeeds.
      const builder = createQueryBuilder(call === 1 ? { data: [], error: null } : { data: [{ id: USER_ID }], error: null });
      supabaseAdmin.calls.push({ table, builder });
      return builder;
    });
    constructEvent.mockReturnValue(subscriptionEvent(type));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(supabaseAdmin.callCountFor("profiles")).toBe(2);
    const fallbackBuilder = supabaseAdmin.builderFor("profiles", 1);
    expect(fallbackBuilder.eq).toHaveBeenCalledWith("id", USER_ID);
    expect(fallbackBuilder.or).toHaveBeenCalledWith(
      `stripe_subscription_id.is.null,stripe_subscription_id.eq.${SUBSCRIPTION_ID}`
    );
  });

  it("does not fall back when there is no metadata.user_id", async () => {
    seedNoProfilesMatch();
    retrieveSubscription.mockResolvedValue(activeSubscription({ metadata: {} }));
    constructEvent.mockReturnValue(subscriptionEvent(type));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(supabaseAdmin.callCountFor("profiles")).toBe(1);
  });

  it("scopes the fallback so a stale event for an old subscription cannot overwrite a profile that already holds a different, current one", async () => {
    // Simulates the real Postgres filter rejecting the write: the profile's
    // actual stripe_subscription_id is a *different* (current) subscription,
    // so the `.or(is null, eq this stale sub)` clause matches no rows.
    seedNoProfilesMatch();
    const staleId = "sub_old_1";
    retrieveSubscription.mockResolvedValue(activeSubscription({ id: staleId, metadata: { user_id: USER_ID } }));
    constructEvent.mockReturnValue(subscriptionEvent(type, { id: staleId, metadata: { user_id: USER_ID } }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    const fallbackBuilder = supabaseAdmin.builderFor("profiles", 1);
    expect(fallbackBuilder.eq).toHaveBeenCalledWith("id", USER_ID);
    expect(fallbackBuilder.or).toHaveBeenCalledWith(`stripe_subscription_id.is.null,stripe_subscription_id.eq.${staleId}`);
  });

  it("returns 500 when the primary update errors, so Stripe retries", async () => {
    seedProfilesError();
    constructEvent.mockReturnValue(subscriptionEvent(type));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Webhook handling failed" });
  });

  it("returns 500 when re-retrieving the subscription fails, so Stripe retries", async () => {
    retrieveSubscription.mockRejectedValue(new Error("stripe down"));
    constructEvent.mockReturnValue(subscriptionEvent(type));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Webhook handling failed" });
  });
});

describe("out-of-order deliveries", () => {
  it("an updated-then-created delivery ends as active, since both re-retrieve the same current subscription", async () => {
    retrieveSubscription.mockResolvedValue(activeSubscription({ status: "active" }));

    constructEvent.mockReturnValueOnce(subscriptionEvent("customer.subscription.updated", { status: "active" }));
    const first = await POST(webhookRequest());
    expect(first.status).toBe(200);

    constructEvent.mockReturnValueOnce(subscriptionEvent("customer.subscription.created", { status: "incomplete" }));
    const second = await POST(webhookRequest());
    expect(second.status).toBe(200);

    expect(writePayload(supabaseAdmin, "profiles", "update", 0).pro_status).toBe("active");
    expect(writePayload(supabaseAdmin, "profiles", "update", 1).pro_status).toBe("active");
  });
});

describe("customer.subscription.deleted", () => {
  it("re-retrieves the subscription and writes its canceled status", async () => {
    retrieveSubscription.mockResolvedValue(activeSubscription({ status: "canceled" }));
    constructEvent.mockReturnValue(subscriptionEvent("customer.subscription.deleted", { status: "active" }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(retrieveSubscription).toHaveBeenCalledWith(SUBSCRIPTION_ID);
    expect(writePayload(supabaseAdmin, "profiles", "update")).toEqual({
      stripe_subscription_id: SUBSCRIPTION_ID,
      stripe_customer_id: CUSTOMER_ID,
      pro_status: "canceled",
      pro_current_period_end: new Date(1_700_000_000 * 1000).toISOString(),
    });
  });

  it("falls back to a canceled status derived from the event when the re-retrieve fails", async () => {
    retrieveSubscription.mockRejectedValue(new Error("subscription not found"));
    constructEvent.mockReturnValue(subscriptionEvent("customer.subscription.deleted", { status: "active" }));

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    expect(writePayload(supabaseAdmin, "profiles", "update").pro_status).toBe("canceled");
  });
});

describe("checkout.session.completed failures return 500 so Stripe retries", () => {
  it("returns 500 when the profile update errors", async () => {
    seedProfilesError();
    constructEvent.mockReturnValue(checkoutCompleted());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Webhook handling failed" });
  });

  it("returns 500 when re-retrieving the subscription fails", async () => {
    retrieveSubscription.mockRejectedValue(new Error("stripe down"));
    constructEvent.mockReturnValue(checkoutCompleted());

    const res = await POST(webhookRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Webhook handling failed" });
  });
});

describe("unrecognised events", () => {
  it("acknowledges an event type it does not handle with 200 (nothing to retry)", async () => {
    constructEvent.mockReturnValue({ type: "payment_intent.succeeded", data: { object: {} } });

    const res = await POST(webhookRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ received: true });
    expect(supabaseAdmin.calls).toHaveLength(0);
  });
});
