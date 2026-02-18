export interface UserProfile {
  // Identity
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  resume_url: string | null;
  created_at: string;

  // Interview context
  experience_level: string | null;
  interview_timeline: string | null;
  target_companies: string[];
  target_role: string | null;

  // Practice stats (computed)
  stats: {
    total_sessions: number;
    ai_sessions: number;
    peer_sessions: number;
    current_streak: number;
    longest_streak: number;
    avg_score: number | null;
    total_practice_minutes: number;
  };

  // Anxiety & confidence tracking
  confidence: {
    current_avg: number | null;
    initial_avg: number | null;
    trend: "improving" | "stable" | "declining" | null;
    by_competency: Record<string, number>;
  };

  // Strengths & growth
  competency_scores: {
    competency: string;
    score: number;
    last_assessed: string;
  }[];
  strongest_competency: string | null;
  weakest_competency: string | null;

  // Peer practice profile
  peer: {
    sessions_hosted: number;
    sessions_joined: number;
  };

  // Preferences
  preferences: {
    email_notifications: boolean;
    match_alerts: boolean;
  };

  // Subscription
  plan: "free" | "pro";
}
