import type { NextRequest } from "next/server";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

const createPortalSession = jest.fn();

jest.mock("stripe", () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => ({
    billingPortal: { sessions: { create: createPortalSession } },
  })),
}));

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

process.env.STRIPE_SECRET_KEY = "sk_test";

import { POST } from "../route";
const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

function withCustomer(customerId: string | null) {
  return mockSupabase({
    user: USER,
    tables: { profiles: { data: { stripe_customer_id: customerId }, error: null } },
  });
}

function portalRequest(url = "http://localhost/api/stripe/portal") {
  return new Request(url, { method: "POST" }) as unknown as NextRequest;
}

const ORIGINAL_APP_URL = process.env.NEXT_PUBLIC_APP_URL;

beforeEach(() => {
  createPortalSession.mockResolvedValue({ url: "https://billing.stripe.com/session/xyz" });
  delete process.env.NEXT_PUBLIC_APP_URL;
});

afterEach(() => {
  if (ORIGINAL_APP_URL === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = ORIGINAL_APP_URL;
});

describe("authorisation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(portalRequest());

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("does not open a portal session for an anonymous caller", async () => {
    mockSupabase({ user: null });

    await POST(portalRequest());

    expect(createPortalSession).not.toHaveBeenCalled();
  });
});

describe("customer lookup", () => {
  it("returns 404 with 'No billing account' when the user has never paid", async () => {
    withCustomer(null);

    const res = await POST(portalRequest());

    expect(res.status).toBe(404);
    await expect(res.json()).resolves.toEqual({ error: "No billing account" });
  });

  it("returns 404 when the profile row is missing", async () => {
    mockSupabase({ user: USER, tables: { profiles: { data: null, error: null } } });

    const res = await POST(portalRequest());

    expect(res.status).toBe(404);
  });

  it("reads the customer id for the caller only", async () => {
    const db = withCustomer("cus_123");

    await POST(portalRequest());

    expect(db.builderFor("profiles").eq).toHaveBeenCalledWith("id", USER.id);
  });
});

describe("portal session", () => {
  it("returns the hosted billing portal url", async () => {
    withCustomer("cus_123");

    const res = await POST(portalRequest());

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ url: "https://billing.stripe.com/session/xyz" });
  });

  it("opens the portal for the caller's own stripe customer, returning to settings", async () => {
    withCustomer("cus_123");

    await POST(portalRequest());

    expect(createPortalSession).toHaveBeenCalledWith({
      customer: "cus_123",
      return_url: "http://localhost/app/settings",
    });
  });

  it("prefers the configured app url for the return link", async () => {
    process.env.NEXT_PUBLIC_APP_URL = "https://fina.app";
    withCustomer("cus_123");

    await POST(portalRequest());

    expect(createPortalSession.mock.calls[0][0].return_url).toBe("https://fina.app/app/settings");
  });

  it("derives the return link from the request when nothing is configured", async () => {
    withCustomer("cus_123");

    await POST(portalRequest("https://preview.vercel.app/api/stripe/portal"));

    expect(createPortalSession.mock.calls[0][0].return_url).toBe("https://preview.vercel.app/app/settings");
  });

  it("returns 500 with the Stripe message when the portal cannot be opened", async () => {
    withCustomer("cus_123");
    createPortalSession.mockRejectedValue(new Error("No configuration provided"));

    const res = await POST(portalRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "No configuration provided" });
  });

  it("returns a generic message when Stripe throws a non-Error", async () => {
    withCustomer("cus_123");
    createPortalSession.mockRejectedValue("boom");

    const res = await POST(portalRequest());

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Stripe error" });
  });
});
