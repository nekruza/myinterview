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

  const { session_id, user_id, action } = await req.json();

  if (!session_id || !user_id || !["accept", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "session_id, user_id, and action (accept/reject) are required" },
      { status: 400 }
    );
  }

  // Verify caller is the host
  const { data: session, error: sessionError } = await supabase
    .from("peer_sessions")
    .select("id, host_id, title")
    .eq("id", session_id)
    .single();

  if (sessionError || !session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }

  if (session.host_id !== user.id) {
    return NextResponse.json({ error: "Only the host can respond to requests" }, { status: 403 });
  }

  if (action === "accept") {
    // Update participant status to accepted
    const { error: updateError } = await supabase
      .from("peer_session_participants")
      .update({ status: "accepted" })
      .eq("session_id", session_id)
      .eq("user_id", user_id)
      .eq("status", "pending");

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    // Notify the requester they were accepted
    await supabase.from("notifications").insert({
      user_id,
      type: "join_accepted",
      title: "Request accepted!",
      body: `Your request to join "${session.title}" was accepted`,
      data: { session_id: session.id, session_title: session.title },
    });
  } else {
    // Delete the participant row
    const { error: deleteError } = await supabase
      .from("peer_session_participants")
      .delete()
      .eq("session_id", session_id)
      .eq("user_id", user_id)
      .eq("status", "pending");

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    // Notify the requester they were rejected
    await supabase.from("notifications").insert({
      user_id,
      type: "join_rejected",
      title: "Request declined",
      body: `Your request to join "${session.title}" was declined`,
      data: { session_id: session.id, session_title: session.title },
    });
  }

  return NextResponse.json({ ok: true });
}
