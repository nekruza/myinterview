import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { UserProfile } from "@/lib/types/profile";

// Estimated minutes per completed session (avg voice call length)
const AVG_SESSION_MINUTES = 12;

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Run all queries in parallel
  const [
    { data: profile },
    { data: subscription },
    { data: sessions },
    { data: scores },
    { count: peerHostedCount },
    { count: peerJoinedCount },
    { data: streak },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "id, full_name, avatar_url, resume_url, experience_level, target_role, interview_timeline, target_companies, email_notifications, match_alerts, created_at, practice_sessions_used, peer_sessions_joined, isAdmin"
      )
      .eq("id", user.id)
      .single(),

    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user.id)
      .single(),

    supabase
      .from("interview_sessions")
      .select("id, type, status, started_at, completed_at, score")
      .eq("user_id", user.id)
      .order("started_at", { ascending: true }),

    supabase
      .from("progress_scores")
      .select("competency, score, assessed_at")
      .eq("user_id", user.id)
      .order("assessed_at", { ascending: true }),

    supabase
      .from("peer_sessions")
      .select("id", { count: "exact", head: true })
      .eq("host_id", user.id),

    supabase
      .from("peer_session_participants")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),

    supabase
      .from("user_streaks")
      .select("current_streak, longest_streak, last_practice_date")
      .eq("user_id", user.id)
      .single(),
  ]);

  // Fallback to user_metadata for fields not yet migrated to profiles
  const meta = user.user_metadata ?? {};

  // --- Stats ---
  const allSessions = sessions ?? [];
  const completed = allSessions.filter((s) => s.status === "completed");
  const completedAi = completed.filter((s) => s.type === "ai");
  const completedPeer = completed.filter((s) => s.type === "peer");

  const scoresWithValue = completedAi.filter((s) => s.score !== null);
  const avgScore =
    scoresWithValue.length > 0
      ? Math.round(
          (scoresWithValue.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            scoresWithValue.length) *
            10
        ) / 10
      : null;

  // --- Confidence tracking ---
  const allScores = scores ?? [];
  // Group scores by competency, keeping chronological order
  const byCompetency: Record<string, { score: number; assessed_at: string }[]> =
    {};
  for (const s of allScores) {
    if (!byCompetency[s.competency]) byCompetency[s.competency] = [];
    byCompetency[s.competency].push(s);
  }

  // Latest score per competency
  const latestByCompetency: Record<string, number> = {};
  const competencyScores: UserProfile["competency_scores"] = [];
  for (const [comp, entries] of Object.entries(byCompetency)) {
    const latest = entries[entries.length - 1];
    latestByCompetency[comp] = latest.score;
    competencyScores.push({
      competency: comp,
      score: latest.score,
      last_assessed: latest.assessed_at,
    });
  }

  // Current avg across latest competency scores
  const compValues = Object.values(latestByCompetency);
  const currentAvg =
    compValues.length > 0
      ? Math.round(
          (compValues.reduce((a, b) => a + b, 0) / compValues.length) * 10
        ) / 10
      : null;

  // Initial avg — first score per competency
  const initialValues: number[] = [];
  for (const entries of Object.values(byCompetency)) {
    initialValues.push(entries[0].score);
  }
  const initialAvg =
    initialValues.length > 0
      ? Math.round(
          (initialValues.reduce((a, b) => a + b, 0) / initialValues.length) *
            10
        ) / 10
      : null;

  // Trend
  let trend: UserProfile["confidence"]["trend"] = null;
  if (currentAvg !== null && initialAvg !== null) {
    const diff = currentAvg - initialAvg;
    if (diff > 3) trend = "improving";
    else if (diff < -3) trend = "declining";
    else trend = "stable";
  }

  // Strongest / weakest
  let strongest: string | null = null;
  let weakest: string | null = null;
  if (compValues.length > 0) {
    let maxScore = -1;
    let minScore = 101;
    for (const [comp, score] of Object.entries(latestByCompetency)) {
      if (score > maxScore) {
        maxScore = score;
        strongest = comp;
      }
      if (score < minScore) {
        minScore = score;
        weakest = comp;
      }
    }
  }

  const result: UserProfile = {
    id: user.id,
    email: user.email ?? "",
    full_name:
      profile?.full_name ?? meta.full_name ?? user.email?.split("@")[0] ?? "",
    avatar_url: profile?.avatar_url ?? null,
    resume_url: profile?.resume_url ?? null,
    created_at: profile?.created_at ?? user.created_at,

    experience_level:
      profile?.experience_level ?? meta.experience_level ?? null,
    interview_timeline:
      profile?.interview_timeline ?? meta.interview_timeline ?? null,
    target_companies:
      profile?.target_companies ?? meta.target_companies ?? [],
    target_role: profile?.target_role ?? null,

    stats: {
      total_sessions: completed.length,
      ai_sessions: completedAi.length,
      peer_sessions: completedPeer.length,
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      avg_score: avgScore,
      total_practice_minutes: completed.length * AVG_SESSION_MINUTES,
    },

    confidence: {
      current_avg: currentAvg,
      initial_avg: initialAvg,
      trend,
      by_competency: latestByCompetency,
    },

    competency_scores: competencyScores,
    strongest_competency: strongest,
    weakest_competency: weakest,

    peer: {
      sessions_hosted: peerHostedCount ?? 0,
      sessions_joined: peerJoinedCount ?? 0,
    },

    preferences: {
      email_notifications:
        profile?.email_notifications ?? meta.email_notifications ?? true,
      match_alerts: profile?.match_alerts ?? meta.match_alerts ?? true,
    },

    plan: (subscription?.plan as "free" | "pro") ?? "free",

    practice_sessions_used: profile?.practice_sessions_used ?? 0,
    peer_sessions_joined: profile?.peer_sessions_joined ?? 0,
    isAdmin: profile?.isAdmin ?? false,
  };

  return NextResponse.json(result);
}
