import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { data: session, error } = await supabase
    .from("peer_sessions")
    .select(
      `
      *,
      host:profiles!peer_sessions_host_id_fkey(id, full_name, avatar_url, experience_level),
      participants:peer_session_participants(
        user_id,
        joined_at,
        status,
        profile:profiles(id, full_name, avatar_url)
      )
    `
    )
    .eq("id", id)
    .single();

  if (error || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  return NextResponse.json({ session, userId: user.id });
}
