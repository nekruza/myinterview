import { createBrowserClient } from "@supabase/ssr";
import { isAuthDisabled, TEMPORARY_AUTH_USER } from "@/lib/auth-config";

export function createClient() {
  const client = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  if (isAuthDisabled()) {
    Object.assign(client.auth, {
      getUser: async () => ({ data: { user: TEMPORARY_AUTH_USER }, error: null }),
    });
  }

  return client;
}
