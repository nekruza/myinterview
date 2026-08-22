import type { NextRequest } from "next/server";
import { createQueryBuilder, writePayload } from "@/test-utils/supabase-mock";

const retrieveSession = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    checkout: { sessions: { retrieve: retrieveSession } },
  })),
}));

const calls: Array<{ table: string; builder: ReturnType<typeof createQueryBuilder> }> = [];
const supabaseAdmin = { from: jest.fn(), calls } as unknown as {
  from: jest.Mock;
  calls: typeof calls;
};

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => supabaseAdmin),
}));

process.env.STRIPE_SECRET_KEY = "sk_test";
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://project.supabase.co";
process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key";

// The route builds its clients at module load, so it must be required after
// the mocks and env vars above are in place.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { GET } = require("../route") as typeof import("../route");

const USER_ID = "user-1";
const STRIPE_SESSION_ID = "cs_test_123";
const SETTINGS = "http://localhost/app/settings";

function seedProfile(profile: Record<string, unknown> | null) {
  calls.length = 0;
  supabaseAdmin.from.mockImplementation((table: string) => {
    const builder = createQueryBuilder({ data: profile, error: null });
    calls.push({ table, builder });
    return builder;
  });
}

function verifyRequest(query: string) {
  return new Request(
    `http://localhost/api/stripe/verify-purchase${query}`
  ) as unknown as NextRequest;
}

function paidSession(overrides: Record<string, unknown> = {}) {
  return {
    id: STRIPE_SESSION_ID,
    payment_status: "paid",
    client_reference_id: USER_ID,
    ...overrides,
  };
}

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

beforeEach(() => {
  seedProfile({ session_credits: 5, last_stripe_session_id: null });
  retrieveSession.mockResolvedValue(paidSession());
  delete process.env.NEXT_PUBLIC_APP_URL;
});

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("query validation", () => {
  it("redirects to settings when the session id is missing", async () => {
    const res = await GET(verifyRequest("?sessions=20"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(SETTINGS);
    expect(retrieveSession).not.toHaveBeenCalled();
  });

  it("redirects to settings when the session count is missing", async () => {
    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}`));

    expect(res.headers.get("location")).toBe(SETTINGS);
    expect(retrieveSession).not.toHaveBeenCalled();
  });

  it("redirects to settings when the session count is zero", async () => {
    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=0`));

    expect(res.headers.get("location")).toBe(SETTINGS);
  });

  it("credits nothing when the query is incomplete", async () => {
    await GET(verifyRequest("?sessions=20"));

    expect(calls).toHaveLength(0);
  });
});

describe("payment verification", () => {
  it("credits the account for a paid session", async () => {
    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(writePayload(supabaseAdmin as never, "profiles", "update")).toEqual({
      session_credits: 25,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
  });

  it("looks up the session Stripe-side rather than trusting the query string", async () => {
    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(retrieveSession).toHaveBeenCalledWith(STRIPE_SESSION_ID);
  });

  it.each(["unpaid", "no_payment_required"])(
    "does not credit a session with payment_status %s",
    async (status) => {
      retrieveSession.mockResolvedValue(paidSession({ payment_status: status }));

      const res = await GET(
        verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`)
      );

      expect(res.headers.get("location")).toBe(SETTINGS);
      expect(writePayload(supabaseAdmin as never, "profiles", "update")).toBeUndefined();
    }
  );

  it("does not credit when the session has no user reference", async () => {
    retrieveSession.mockResolvedValue(paidSession({ client_reference_id: null }));

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(res.headers.get("location")).toBe(SETTINGS);
    expect(writePayload(supabaseAdmin as never, "profiles", "update")).toBeUndefined();
  });

  it("redirects to settings without crashing when Stripe throws", async () => {
    retrieveSession.mockRejectedValue(new Error("stripe down"));

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe(`${SETTINGS}?purchased=20`);
  });
});

describe("idempotency with the webhook", () => {
  it("does not credit again when the webhook already handled this session", async () => {
    seedProfile({ session_credits: 25, last_stripe_session_id: STRIPE_SESSION_ID });

    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(writePayload(supabaseAdmin as never, "profiles", "update")).toBeUndefined();
  });

  it("still confirms the purchase to the user on a duplicate visit", async () => {
    seedProfile({ session_credits: 25, last_stripe_session_id: STRIPE_SESSION_ID });

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(res.headers.get("location")).toBe(`${SETTINGS}?purchased=20`);
  });

  it("credits a new purchase even when a previous one is recorded", async () => {
    seedProfile({ session_credits: 25, last_stripe_session_id: "cs_test_OLD" });

    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(writePayload(supabaseAdmin as never, "profiles", "update")).toEqual({
      session_credits: 45,
      last_stripe_session_id: STRIPE_SESSION_ID,
    });
  });

  it("records the stripe session id to block a later replay", async () => {
    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(
      writePayload(supabaseAdmin as never, "profiles", "update").last_stripe_session_id
    ).toBe(STRIPE_SESSION_ID);
  });

  it("credits from zero when the profile has no balance", async () => {
    seedProfile({ session_credits: null, last_stripe_session_id: null });

    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(
      writePayload(supabaseAdmin as never, "profiles", "update").session_credits
    ).toBe(20);
  });

  it("credits from zero when the profile row is missing", async () => {
    seedProfile(null);

    await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(
      writePayload(supabaseAdmin as never, "profiles", "update").session_credits
    ).toBe(20);
  });
});

describe("redirect target", () => {
  it("confirms the purchased amount in the redirect", async () => {
    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=50`));

    expect(res.headers.get("location")).toBe(`${SETTINGS}?purchased=50`);
  });

  it("prefers the configured app url", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://myinterview.app";

    const res = await GET(verifyRequest(`?session_id=${STRIPE_SESSION_ID}&sessions=20`));

    expect(res.headers.get("location")).toBe(
      "https://myinterview.app/app/settings?purchased=20"
    );
  });
});
