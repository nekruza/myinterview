import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createAdminClient } from "@/lib/supabase/admin";
import { ANON_COOKIE } from "@/lib/anon-session";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/app/dashboard";

  if (code) {
    const response = NextResponse.redirect(`${origin}${next}`);

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // Best-effort: claim any anonymous sessions for this user
      const anonId = request.cookies.get(ANON_COOKIE)?.value;
      if (anonId) {
        try {
          const admin = createAdminClient();
          const { data: claimed } = await admin
            .from("interview_sessions")
            .update({ user_id: data.user.id, anonymous_id: null })
            .eq("anonymous_id", anonId)
            .is("user_id", null)
            .select("id");

          const count = claimed?.length ?? 0;
          if (count > 0) {
            const { data: profile } = await admin
              .from("profiles")
              .select("practice_sessions_used")
              .eq("id", data.user.id)
              .single();
            await admin
              .from("profiles")
              .update({
                practice_sessions_used:
                  (profile?.practice_sessions_used ?? 0) + count,
              })
              .eq("id", data.user.id);
          }
        } catch {
          // non-fatal: client can retry via POST /api/auth/claim
        }
        response.cookies.delete(ANON_COOKIE);
      }
      return response;
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}
