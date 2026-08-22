/**
 * Shared response shapes for the E2E suite.
 *
 * These mirror what the real API returns, so a drift between fixture and
 * handler shows up as a failing test rather than a silently passing one.
 */

export const E2E_ACCESS_TOKEN = "e2e-access-token";

export const E2E_USER = {
  id: "e2e-user-0000-0000-000000000001",
  email: "e2e@example.com",
};

/** Matches the `UserProfile` returned by GET /api/profile. */
export function profileFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: E2E_USER.id,
    email: E2E_USER.email,
    full_name: "E2E Tester",
    avatar_url: null,
    resume_url: null,
    created_at: "2026-01-01T00:00:00.000Z",
    experience_level: "senior",
    interview_timeline: "1_month",
    target_companies: ["Acme"],
    target_role: "Senior Engineer",
    stats: {
      total_sessions: 4,
      ai_sessions: 3,
      peer_sessions: 1,
      current_streak: 2,
      longest_streak: 5,
      avg_score: 7.5,
      total_practice_minutes: 48,
    },
    confidence: {
      current_avg: 72,
      initial_avg: 60,
      trend: "improving",
      by_competency: { leadership: 80, ownership: 64 },
    },
    competency_scores: [
      { competency: "leadership", score: 80, last_assessed: "2026-02-01" },
      { competency: "ownership", score: 64, last_assessed: "2026-02-01" },
    ],
    strongest_competency: "leadership",
    weakest_competency: "ownership",
    peer: { sessions_hosted: 0, sessions_joined: 1 },
    preferences: { email_notifications: true, match_alerts: true },
    plan: "free",
    session_credits: 12,
    practice_sessions_used: 3,
    peer_sessions_joined: 1,
    isAdmin: false,
    ...overrides,
  };
}

/** Matches GET /api/sessions/usage for a signed-in user. */
export function authUsage(remaining: number) {
  return { kind: "auth", remaining, max: null };
}

/** Matches GET /api/sessions/usage for an anonymous visitor. */
export function anonUsage(remaining: number) {
  return { kind: "anon", remaining, max: 3 };
}

/** The 403 body both the anonymous trial and the credit gate return. */
export const ANON_LIMIT_REACHED = { error: "limit_reached", type: "anon_trial" };
export const CREDIT_LIMIT_REACHED = { error: "limit_reached", type: "practice" };

/** Matches the graded result from POST /api/ai/feedback. */
export function feedbackFixture(overrides: Record<string, unknown> = {}) {
  return {
    company: "Acme",
    role: "Senior Engineer",
    interviewType: "Behavioral",
    verdict: "Lean Pass",
    score: 7.2,
    summary: "Clear structure, but quantify the impact next time.",
    categories: [
      { name: "Communication", score: 8, comment: "Easy to follow." },
      { name: "Problem Solving", score: 7, comment: "Reasonable trade-offs." },
      { name: "Confidence", score: 7, comment: "Steady delivery." },
      { name: "STAR Framework", score: 6, comment: "Result was thin." },
    ],
    strengths: ["Clear structure", "Concrete example"],
    improvements: ["Quantify the impact", "Tighten the setup"],
    tips: ["Lead with the result", "Name the trade-off explicitly"],
    questions: [
      {
        question: "Tell me about a time you led a project.",
        score: 7,
        answer: "I led the billing migration.",
        feedback: "Good scope, add the measurable outcome.",
      },
    ],
    ...overrides,
  };
}

/** A peer session row as GET /api/peer-sessions returns it. */
export function peerSessionFixture(overrides: Record<string, unknown> = {}) {
  return {
    id: "e2e-peer-1",
    host_id: "another-user",
    title: "System design practice",
    scheduled_at: "2099-01-01T18:00:00.000Z",
    duration_minutes: 45,
    meeting_link: "https://meet.example.com/e2e",
    type: "peer",
    status: "open",
    notes: null,
    max_participants: 4,
    is_featured: false,
    created_at: "2026-01-01T00:00:00.000Z",
    developer_type: null,
    interview_type: null,
    host: { id: "another-user", full_name: "Peer Host", avatar_url: null },
    participants: [],
    ...overrides,
  };
}
