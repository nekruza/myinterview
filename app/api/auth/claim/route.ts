import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAnonId, clearAnonId } from "@/lib/anon-session";

// Claim any anonymous interview_sessions for the now-authenticated user.
// Idempotent: re-running with no anon cookie or already-claimed rows is a no-op.
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const anonId = await getAnonId();
  if (!anonId) {
    return NextResponse.json({ claimed: 0 });
  }

  const admin = createAdminClient();

  const { data: claimed, error } = await admin
    .from("interview_sessions")
    .update({ user_id: user.id, anonymous_id: null })
    .eq("anonymous_id", anonId)
    .is("user_id", null)
    .select("id");

  if (error) {
    return NextResponse.json({ error: "Failed to claim sessions" }, { status: 500 });
  }

  const count = claimed?.length ?? 0;

  if (count > 0) {
    const { data: profile } = await admin
      .from("profiles")
      .select("practice_sessions_used")
      .eq("id", user.id)
      .single();
    await admin
      .from("profiles")
      .update({
        practice_sessions_used: (profile?.practice_sessions_used ?? 0) + count,
      })
      .eq("id", user.id);
  }

  // Cookie has served its purpose — drop it so future requests are clean
  await clearAnonId();

  return NextResponse.json({ claimed: count });
}
