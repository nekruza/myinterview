import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId, MAX_ANON_SESSIONS } from "@/lib/anon-session";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("session_credits")
      .eq("id", user.id)
      .single();
    return NextResponse.json({
      kind: "auth",
      remaining: profile?.session_credits ?? 0,
      max: null,
    });
  }

  // Anonymous: count existing rows under this device's cookie
  const anonId = await getOrCreateAnonId();
  const admin = createAdminClient();
  const { count } = await admin
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("anonymous_id", anonId);

  const used = count ?? 0;
  return NextResponse.json({
    kind: "anon",
    remaining: Math.max(0, MAX_ANON_SESSIONS - used),
    max: MAX_ANON_SESSIONS,
  });
}
