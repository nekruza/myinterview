import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Create a new AI practice session
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { question, category, type = "ai" } = await req.json();

  if (!question || !category) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_id: user.id,
      type,
      topic: `${category}|${question}`,
      status: "active",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ sessionId: data.id });
}

// Complete a session with score and feedback
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { sessionId, score, feedback, competencyScores } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // Update session
  const { error: sessionError } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      score: score ?? null,
      feedback: feedback ?? null,
    })
    .eq("id", sessionId)
    .eq("user_id", user.id);

  if (sessionError) {
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }

  // Insert competency scores if provided
  if (competencyScores && Array.isArray(competencyScores)) {
    const scoreRows = competencyScores.map(
      (cs: { competency: string; score: number }) => ({
        user_id: user.id,
        competency: cs.competency,
        score: cs.score,
        source_type: "ai",
        source_id: sessionId,
      })
    );

    await supabase.from("progress_scores").insert(scoreRows);
  }

  return NextResponse.json({ ok: true });
}

// Get user's sessions
export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const limit = parseInt(url.searchParams.get("limit") ?? "20");

  const { data, error } = await supabase
    .from("interview_sessions")
    .select("id, type, topic, status, started_at, completed_at, score, feedback")
    .eq("user_id", user.id)
    .eq("type", "ai")
    .order("started_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 });
  }

  return NextResponse.json({ sessions: data });
}
