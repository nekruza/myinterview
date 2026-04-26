import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrCreateAnonId, getAnonId, MAX_ANON_SESSIONS } from "@/lib/anon-session";

// Create a new AI practice session (authed or anonymous)
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { question, category, type = "ai" } = await req.json();

  if (!question || !category) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  // ── Authenticated flow: paid credits ─────────────────────────
  if (user) {
    const { data: profileUsage } = await supabase
      .from("profiles")
      .select("session_credits, practice_sessions_used")
      .eq("id", user.id)
      .single();

    const credits = profileUsage?.session_credits ?? 0;

    if (credits <= 0) {
      return NextResponse.json(
        { error: "limit_reached", type: "practice" },
        { status: 403 }
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

    const sessionsUsed = profileUsage?.practice_sessions_used ?? 0;
    await supabase
      .from("profiles")
      .update({
        session_credits: credits - 1,
        practice_sessions_used: sessionsUsed + 1,
      })
      .eq("id", user.id);

    return NextResponse.json({ sessionId: data.id });
  }

  // ── Anonymous flow: cookie-based 3-free trial ─────────────────
  const anonId = await getOrCreateAnonId();
  const admin = createAdminClient();

  const { count } = await admin
    .from("interview_sessions")
    .select("id", { count: "exact", head: true })
    .eq("anonymous_id", anonId);

  if ((count ?? 0) >= MAX_ANON_SESSIONS) {
    return NextResponse.json(
      { error: "limit_reached", type: "anon_trial" },
      { status: 403 }
    );
  }

  const { data, error } = await admin
    .from("interview_sessions")
    .insert({
      anonymous_id: anonId,
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

  const { sessionId, score, feedback, competencyScores } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  // ── Authenticated flow ───────────────────────────────────────
  if (user) {
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

    // Update streak tracking
    const today = new Date().toISOString().split("T")[0];
    const { data: existing } = await supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_practice_date")
      .eq("user_id", user.id)
      .single();

    if (existing) {
      const lastDate = existing.last_practice_date;
      const yesterday = new Date(Date.now() - 86400000)
        .toISOString()
        .split("T")[0];

      let newStreak = existing.current_streak;
      if (lastDate === today) {
        // already practiced today
      } else if (lastDate === yesterday) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }

      const newLongest = Math.max(existing.longest_streak, newStreak);

      await supabase
        .from("user_streaks")
        .update({
          current_streak: newStreak,
          longest_streak: newLongest,
          last_practice_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
    } else {
      await supabase.from("user_streaks").insert({
        user_id: user.id,
        current_streak: 1,
        longest_streak: 1,
        last_practice_date: today,
      });
    }

    return NextResponse.json({ ok: true });
  }

  // ── Anonymous flow: only update the session row ──────────────
  const anonId = await getAnonId();
  if (!anonId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { error: sessionError } = await admin
    .from("interview_sessions")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      score: score ?? null,
      feedback: feedback ?? null,
    })
    .eq("id", sessionId)
    .eq("anonymous_id", anonId);

  if (sessionError) {
    return NextResponse.json(
      { error: "Failed to update session" },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true });
}

// Get user's sessions (authed only)
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
