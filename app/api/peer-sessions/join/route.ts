import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session_id } = await req.json();

  if (!session_id) {
    return NextResponse.json({ error: "Session ID is required" }, { status: 400 });
  }

  // Get session to check capacity and host info
  const { data: session, error: sessionError } = await supabase
    .from("peer_sessions")
    .select("*, participants:peer_session_participants(user_id, status)")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  // Can't join own session
  if (session.host_id === user.id) {
    return NextResponse.json({ error: "You can't join your own session" }, { status: 400 });
  }

  // Check if already requested or joined
  const existing = session.participants?.find(
    (p: { user_id: string; status: string }) => p.user_id === user.id
  );
  if (existing) {
    const msg =
      existing.status === "pending"
        ? "You already have a pending request"
        : "You already joined this session";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  // Check capacity — only count accepted participants
  const acceptedCount =
    (session.participants?.filter(
      (p: { status: string }) => p.status === "accepted"
    ).length || 0) + 1; // +1 for host
  if (acceptedCount >= session.max_participants) {
    return NextResponse.json({ error: "Session is full" }, { status: 400 });
  }

  // Get requester profile name for the notification
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .single();

  const requesterName = profile?.full_name || user.email || "Someone";

  // Insert join request with pending status
  const { error: joinError } = await supabase.from("peer_session_participants").insert({
    session_id,
    user_id: user.id,
    status: "pending",
  });

  if (joinError) {
    return NextResponse.json({ error: joinError.message }, { status: 500 });
  }

  // Create notification for the host
  await supabase.from("notifications").insert({
    user_id: session.host_id,
    type: "join_request",
    title: "New join request",
    body: `${requesterName} wants to join "${session.title}"`,
    data: {
      session_id: session.id,
      session_title: session.title,
      requester_id: user.id,
      requester_name: requesterName,
    },
  });

  return NextResponse.json({ status: "pending" });
}

export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { session_id } = await req.json();

  const { error } = await supabase
    .from("peer_session_participants")
    .delete()
    .eq("session_id", session_id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
