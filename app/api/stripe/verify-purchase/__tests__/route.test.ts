import type { NextRequest } from "next/server";
import { createSupabaseMock, writePayload } from "@/test-utils/supabase-mock";

const retrieveSession = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkout: { sessions: { retrieve: retrieveSession } },
  })),
}));

const supabaseAdmin = createSupabaseMock();
jest.mock("@/lib/supabase/admin", () => ({
  createAdminClient: jest.fn(() => supabaseAdmin),
}));

process.env.STRIPE_SECRET_KEY = "sk_test";

import { GET } from "../route";
const { createAdminClient } = jest.requireMock("@/lib/supabase/admin");

const USER_ID = "user-1";
const STRIPE_SESSION_ID = "cs_test_123";
const SETTINGS = "http://localhost/app/settings";
const UPGRADED = "http://localhost/app/settings?upgraded=1";

function verifyRequest(query: string) {
  return new Request(`http://localhost/api/stripe/verify-purchase${query}`) as unknown as NextRequest;
}

function completeSession(overrides: Record<string, unknown> = {}) {
  return {
    id: STRIPE_SESSION_ID,
    status: "complete",
    client_reference_id: USER_ID,
    subscription: {
      id: "sub_123",
      status: "active",
      customer: "cus_123",
      items: { data: [{ current_period_end: 1_700_000_000 }] },
    },
    ...overrides,
  };
}

/** Every `.from("profiles")` call (both the pre-write lookup and the update) resolves to this row. */
function seedProfileLookup(row: Record<string, unknown> | null) {
  supabaseAdmin.calls.length = 0;
  supabaseAdmin.from.mockImplementation((table: string) => {
    const { createQueryBuilder } = jest.requireActual<typeof import("@/test-utils/supabase-mock")>(
      "@/test-utils/supabase-mock"
    );
    const builder = createQueryBuilder({ data: row, error: null });
    supabaseAdmin.calls.push({ table, builder });
    return builder;
  });
}

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;
const ORIGINAL_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

beforeEach(() => {
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";
  delete process.env.NEXT_PUBLIC_APP_URL;
  retrieveSession.mockResolvedValue(completeSession());
  supabaseAdmin.calls.length = 0;
  supabaseAdmin.from.mockImplementation((table: string) => {
    const { createQueryBuilder } = jest.requireActual<typeof import("@/test-utils/supabase-mock")>(
      "@/test-utils/supabase-mock"
    );
    const builder = createQueryBuilder({ data: null, error: null });
    supabaseAdmin.calls.push({ table, builder });
    return builder;
  });
});

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
  if (ORIGINAL_SERVICE_ROLE_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY;
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_SERVICE_ROLE_KEY;
});

describe("query validation", () => {
  it("redirects to bare settings when the session id is missing", async () => {
    const res = await GET(verifyRequest(""));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(SETTINGS);
    expect(retrieveSession).not.toHaveBeenCalled();
  });
});

describe("payment verification", () => {
  it("retrieves the session with the subscription expanded", async () => {
    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(retrieveSession).toHaveBeenCalledWith(STRIPE_SESSION_ID, { expand: ["subscription"] });
  });

  it("updates the profile and redirects to ?upgraded=1 on a complete session", async () => {
    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(UPGRADED);
    expect(writePayload(supabaseAdmin, "profiles", "update")).toEqual({
      stripe_subscription_id: "sub_123",
      stripe_customer_id: "cus_123",
      pro_status: "active",
      pro_current_period_end: new Date(1_700_000_000 * 1000).toISOString(),
    });
    expect(supabaseAdmin.builderFor("profiles").eq).toHaveBeenCalledWith("id", USER_ID);
  });

  it("still redirects to ?upgraded=1 without writing when the session is not complete", async () => {
    retrieveSession.mockResolvedValue(completeSession({ status: "open" }));

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe(UPGRADED);
    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("still redirects to ?upgraded=1 without writing when there is no user id", async () => {
    retrieveSession.mockResolvedValue(completeSession({ client_reference_id: null }));

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe(UPGRADED);
    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("still redirects to ?upgraded=1 without writing when the service role key is missing", async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe(UPGRADED);
    expect(createAdminClient).not.toHaveBeenCalled();
  });

  it("still redirects to ?upgraded=1 without writing when the subscription did not expand", async () => {
    retrieveSession.mockResolvedValue(completeSession({ subscription: "sub_123" }));

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe(UPGRADED);
    expect(supabaseAdmin.calls).toHaveLength(0);
  });

  it("logs and still redirects to ?upgraded=1 when Stripe throws", async () => {
    retrieveSession.mockRejectedValue(new Error("stripe down"));

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(UPGRADED);
  });
});

describe("stale-session guard", () => {
  it("does not overwrite when the profile already holds a different, current subscription", async () => {
    seedProfileLookup({ stripe_subscription_id: "sub_other" });

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe(UPGRADED);
    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeUndefined();
  });

  it("writes when the profile's subscription id already matches this one", async () => {
    seedProfileLookup({ stripe_subscription_id: "sub_123" });

    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeDefined();
  });

  it("writes when the profile has no subscription on file yet", async () => {
    seedProfileLookup({ stripe_subscription_id: null });

    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(writePayload(supabaseAdmin, "profiles", "update")).toBeDefined();
  });
});

describe("redirect target", () => {
  it("prefers the configured app url", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://fina.app";

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe("https://fina.app/app/settings?upgraded=1");
  });
});
