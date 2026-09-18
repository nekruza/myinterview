import type { User } from "@supabase/supabase-js";

/**
 * Development-only escape hatch for previewing the authenticated shell.
 *
 * The NODE_ENV check is intentional: setting the flag in a production
 * environment must never disable the app's authentication boundary.
 */
export function isAuthDisabled(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.NODE_ENV === "development" && env.NEXT_PUBLIC_FINA_AUTH_DISABLED === "true";
}

/** Stable identity used only while the local development bypass is enabled. */
export const TEMPORARY_AUTH_USER: User = {
  id: "00000000-0000-0000-0000-000000000001",
  aud: "authenticated",
  role: "authenticated",
  email: "dev@fina.local",
  email_confirmed_at: "1970-01-01T00:00:00.000Z",
  created_at: "1970-01-01T00:00:00.000Z",
  updated_at: "1970-01-01T00:00:00.000Z",
  app_metadata: { provider: "development", providers: ["development"] },
  user_metadata: { full_name: "Local Developer" },
  identities: [],
};
