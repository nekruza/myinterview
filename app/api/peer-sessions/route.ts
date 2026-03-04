import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch upcoming sessions with host profile and participant count
  const { data: sessions, error } = await supabase
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
    .gte("scheduled_at", new Date().toISOString())
    .in("status", ["scheduled", "open"])
    .order("is_featured", { ascending: false })
    .order("scheduled_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions, userId: user.id });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Only admin users can create peer sessions
  const { data: profile } = await supabase
    .from("profiles")
    .select("isAdmin")
    .eq("id", user.id)
    .single();

  if (!profile?.isAdmin) {
    return NextResponse.json(
      { error: "admin_required" },
      { status: 403 }
    );
  }

  const body = await req.json();
  const { title, scheduled_at, duration_minutes, meeting_link, type, notes, max_participants, developer_type, interview_type } =
    body;

  if (!title || !scheduled_at || !meeting_link) {
    return NextResponse.json(
      { error: "Title, date, and meeting link are required" },
      { status: 400 }
    );
  }

  const { data: session, error } = await supabase
    .from("peer_sessions")
    .insert({
      host_id: user.id,
      title,
      scheduled_at,
      duration_minutes: duration_minutes || 45,
      meeting_link,
      type: type || "peer",
      notes: notes || null,
      max_participants: max_participants || 2,
      developer_type: developer_type || null,
      interview_type: interview_type || null,
      status: "open",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session }, { status: 201 });
}
