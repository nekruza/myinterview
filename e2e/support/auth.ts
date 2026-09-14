import type { BrowserContext } from "@playwright/test";
import { E2E_ACCESS_TOKEN, E2E_USER } from "../fixtures/data";

/**
 * Seeds the Supabase auth cookie directly.
 *
 * Sign-in is Google OAuth only, so there is no form to drive. Instead we write
 * the cookie `@supabase/ssr` would have written, in exactly its format:
 *
 *   name  = sb-<first hostname segment of the Supabase URL>-auth-token
 *   value = "base64-" + base64url(JSON.stringify(session))
 *
 * The bearer token inside is the one the Supabase stub accepts, so both the
 * browser client and server-side `getUser()` in middleware agree the user is
 * signed in.
 */

function base64url(input: string): string {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/** Mirrors supabase-js: `sb-${new URL(url).hostname.split(".")[0]}-auth-token`. */
export function authCookieName(supabaseUrl: string): string {
  return `sb-${new URL(supabaseUrl).hostname.split(".")[0]}-auth-token`;
}

/**
 * State the Supabase stub should reflect for this session.
 *
 * Server Components read Postgrest from the Next.js process, out of reach of
 * `page.route`. Encoding the values into the access token lets each browser
 * context get its own view without the stub holding shared mutable state.
 */
export interface SessionState {
  /** False signs in a user who hasn't finished onboarding (`target_language` is null). Defaults to true. */
  onboarded?: boolean;
  /** True gives the profile row an active Fina Pro subscription. Defaults to false. */
  pro?: boolean;
  current_streak?: number;
}

function tokenFor(state: SessionState): string {
  const pairs = Object.entries(state)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${k}=${typeof v === "boolean" ? (v ? 1 : 0) : v}`);
  return [E2E_ACCESS_TOKEN, ...pairs].join(";");
}

export function buildSession(state: SessionState = {}) {
  return {
    access_token: tokenFor(state),
    token_type: "bearer",
    expires_in: 3600,
    expires_at: 4102444800,
    refresh_token: "e2e-refresh-token",
    user: {
      id: E2E_USER.id,
      aud: "authenticated",
      role: "authenticated",
      email: E2E_USER.email,
      email_confirmed_at: "2026-01-01T00:00:00.000Z",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
      app_metadata: { provider: "google", providers: ["google"] },
      user_metadata: {
        full_name: "E2E Tester",
        email: E2E_USER.email,
      },
      identities: [],
    },
  };
}

export async function signIn(
  context: BrowserContext,
  {
    appUrl = "http://localhost:3100",
    supabaseUrl = "http://localhost:54321",
    ...state
  }: { appUrl?: string; supabaseUrl?: string } & SessionState = {}
) {
  const value = `base64-${base64url(JSON.stringify(buildSession(state)))}`;

  await context.addCookies([
    {
      name: authCookieName(supabaseUrl),
      value,
      url: appUrl,
      httpOnly: false,
      sameSite: "Lax",
    },
  ]);
}

/** Drops the auth cookie without clearing anything else the test set up. */
export async function signOut(
  context: BrowserContext,
  supabaseUrl = "http://localhost:54321"
) {
  const name = authCookieName(supabaseUrl);
  const remaining = (await context.cookies()).filter((c) => c.name !== name);
  await context.clearCookies();
  await context.addCookies(remaining);
}
