/**
 * Minimal Supabase stand-in for end-to-end runs.
 *
 * Playwright's `page.route()` only sees requests the *browser* makes. This app
 * also talks to Supabase from the server — `middleware.ts` calls
 * `auth.getUser()` on every matched route to gate `/app`, and the route
 * handlers query Postgrest. Those calls never reach the browser, so they need a
 * real HTTP endpoint to hit.
 *
 * This server is deliberately dumb and stateless: its only job is to make
 * server-side auth resolve deterministically. Anything a test needs to assert
 * on is mocked per-test at the browser layer (see e2e/support/test.ts), which
 * keeps tests isolated from each other even though they share this process.
 *
 * Run: node e2e/stub/supabase.mjs  (PORT defaults to 54321)
 */
import { createServer } from "node:http";

const PORT = Number(process.env.STUB_SUPABASE_PORT ?? 54321);

/** The bearer token that counts as a signed-in user. Mirrors e2e/fixtures. */
export const E2E_ACCESS_TOKEN = "e2e-access-token";

const E2E_USER = {
  id: "e2e-user-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "e2e@example.com",
  email_confirmed_at: "2026-01-01T00:00:00.000Z",
  created_at: "2026-01-01T00:00:00.000Z",
  updated_at: "2026-01-01T00:00:00.000Z",
  app_metadata: { provider: "google", providers: ["google"] },
  user_metadata: {
    full_name: "E2E Tester",
    email: "e2e@example.com",
  },
  identities: [],
};

function session() {
  return {
    access_token: E2E_ACCESS_TOKEN,
    token_type: "bearer",
    expires_in: 3600,
    // Far future so the client never tries to refresh mid-test.
    expires_at: 4102444800,
    refresh_token: "e2e-refresh-token",
    user: E2E_USER,
  };
}

function send(res, status, body, headers = {}) {
  const payload = body === null ? "" : JSON.stringify(body);
  res.writeHead(status, {
    "Content-Type": "application/json",
    // The browser client calls this cross-origin from the app's port.
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
    "Access-Control-Expose-Headers": "content-range",
    ...headers,
  });
  res.end(payload);
}

/**
 * Per-test state travels inside the access token.
 *
 * Server Components and route handlers query Postgrest from the Next.js
 * process, so Playwright cannot intercept those reads. Keeping mutable state in
 * this shared stub would leak between parallel tests, so instead a test encodes
 * what it needs into the token it signs in with — e.g.
 *
 *   e2e-access-token;onboarded=0;pro=1;current_streak=5
 *
 * and every request carrying that token sees exactly that. Isolation comes free
 * because the token is scoped to one browser context.
 */
function tokenOf(req) {
  const auth = req.headers.authorization ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : "";
}

function isSignedIn(req) {
  return tokenOf(req).startsWith(E2E_ACCESS_TOKEN);
}

function stateFrom(req) {
  const [, ...pairs] = tokenOf(req).split(";");
  const state = {};
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (!key) continue;
    const n = Number(value);
    state[key] = Number.isFinite(n) && value !== "" ? n : value;
  }
  return state;
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, `http://localhost:${PORT}`);

  if (req.method === "OPTIONS") return send(res, 204, null);

  // ── Auth ──────────────────────────────────────────────────────────────────
  // getUser() is what middleware uses to decide whether /app is reachable, so
  // this endpoint alone determines "signed in" for the whole server side.
  if (pathname === "/auth/v1/user") {
    return isSignedIn(req)
      ? send(res, 200, E2E_USER)
      : send(res, 401, { message: "invalid claim: missing sub claim" });
  }

  if (pathname === "/auth/v1/token") return send(res, 200, session());
  if (pathname === "/auth/v1/signup") return send(res, 200, session());
  if (pathname === "/auth/v1/logout") return send(res, 204, null);

  // OAuth: bounce straight back to the app's callback with a code, so the
  // "Continue with Google" button can be exercised without leaving the suite.
  if (pathname === "/auth/v1/authorize") {
    const redirectTo =
      new URL(req.url, `http://localhost:${PORT}`).searchParams.get("redirect_to") ??
      "http://localhost:3100/auth/callback";
    const target = new URL(redirectTo);
    target.searchParams.set("code", "e2e-auth-code");
    return send(res, 302, null, { Location: target.toString() });
  }

  // ── Postgrest ─────────────────────────────────────────────────────────────
  if (pathname.startsWith("/rest/v1/")) {
    if (req.method !== "GET") return send(res, 201, []);

    const table = pathname.replace("/rest/v1/", "");
    const state = stateFrom(req);

    // `.single()` / `.maybeSingle()` ask for a bare object via Accept.
    const wantsOne = (req.headers.accept ?? "").includes("vnd.pgrst.object+json");

    const onboarded = state.onboarded !== 0;
    const isPro = state.pro === 1;

    const rows =
      table === "profiles"
        ? [
            {
              id: E2E_USER.id,
              email: E2E_USER.email,
              display_name: "E2E Tester",
              user_level: "intermediate",
              current_streak: state.current_streak ?? 2,
              words_learned: 0,
              accuracy: null,
              last_conversation_date: null,
              weekly_activity: "[false,true,true,false,false,false,false]",
              target_language: onboarded ? "spanish" : null,
              learning_motivation: "travel",
              daily_goal_minutes: 10,
              study_plan_completed_days: "[1]",
              study_plan_start_date: "2026-09-10T00:00:00.000Z",
              native_language: "english",
              tutor_id: "luna",
              ai_consent_at: "2026-01-01T00:00:00.000Z",
              stripe_customer_id: isPro ? "cus_e2e" : null,
              stripe_subscription_id: isPro ? "sub_e2e" : null,
              pro_status: isPro ? "active" : null,
              pro_current_period_end: "2099-01-01T00:00:00.000Z",
              created_at: "2026-01-01T00:00:00.000Z",
              updated_at: null,
            },
          ]
        : [];

    return send(res, 200, wantsOne ? (rows[0] ?? null) : rows, {
      "Content-Range": `0-${Math.max(rows.length - 1, 0)}/${rows.length}`,
    });
  }

  send(res, 200, {});
});

server.listen(PORT, () => {
  console.log(`[stub-supabase] listening on http://localhost:${PORT}`);
});
