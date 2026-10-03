import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Raw figures behind the dashboard. Streak, weekly activity and scores are
 * derived in the browser (lib/dashboard-stats.ts) so they follow the user's
 * timezone; this route only returns what the database holds.
 */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [{ data: sessions }, { data: profile }] = await Promise.all([
    supabase
      .from("interview_sessions")
      .select("id, status, started_at, completed_at, score")
      .eq("user_id", user.id)
      .eq("type", "ai")
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("session_credits")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  const displayName =
    user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "there";

  return NextResponse.json({
    displayName,
    sessionCredits: profile?.session_credits ?? 0,
    sessions: sessions ?? [],
  });
}
