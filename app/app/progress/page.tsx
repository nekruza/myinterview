import { createClient } from "@/lib/supabase/server";
import {
  BarChart3,
  Flame,
  TrendingUp,
  Calendar,
  Sparkles,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────────────────

interface Session {
  id: string;
  type: string;
  topic: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  score: number | null;
  feedback: string | null;
}

interface ProgressScore {
  competency: string;
  score: number;
  assessed_at: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const COMPETENCY_LABELS: Record<string, string> = {
  leadership: "Leadership",
  ownership: "Ownership",
  conflict: "Conflict",
  failure: "Failure & Growth",
  collaboration: "Collaboration",
};

const COMPETENCY_COLORS: Record<string, string> = {
  leadership: "#2dec29",
  ownership: "#f59e0b",
  conflict: "#8b5cf6",
  failure: "#ef4444",
  collaboration: "#06b6d4",
};

function parseSession(s: Session): {
  category: string;
  question: string;
  date: string;
} {
  const parts = s.topic.split("|");
  return {
    category: parts[0] ?? "",
    question: parts[1] ?? s.topic,
    date: s.completed_at
      ? new Date(s.completed_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        })
      : new Date(s.started_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
  };
}

function calcStreak(sessions: Session[]): number {
  if (!sessions.length) return 0;
  const dates = sessions
    .filter((s) => s.status === "completed")
    .map((s) => new Date(s.completed_at ?? s.started_at).toDateString())
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!dates.length) return 0;

  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);

  for (const d of dates) {
    const date = new Date(d);
    const diff =
      (current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) {
      streak++;
      current = date;
    } else {
      break;
    }
  }
  return streak;
}

// ─── Radar Chart ─────────────────────────────────────────────────────────────

function RadarChart({
  data,
}: {
  data: Record<string, number>;
}) {
  const competencies = ["leadership", "ownership", "conflict", "failure", "collaboration"];
  const cx = 120;
  const cy = 120;
  const r = 90;
  const n = competencies.length;

  function point(index: number, value: number) {
    const angle = (index * 2 * Math.PI) / n - Math.PI / 2;
    const d = (value / 100) * r;
    return { x: cx + d * Math.cos(angle), y: cy + d * Math.sin(angle) };
  }

  function gridPoint(index: number, frac: number) {
    const angle = (index * 2 * Math.PI) / n - Math.PI / 2;
    return { x: cx + frac * r * Math.cos(angle), y: cy + frac * r * Math.sin(angle) };
  }

  const labelPoint = (index: number) => {
    const angle = (index * 2 * Math.PI) / n - Math.PI / 2;
    const offset = 16;
    return {
      x: cx + (r + offset) * Math.cos(angle),
      y: cy + (r + offset) * Math.sin(angle),
    };
  };

  const hasData = competencies.some((c) => (data[c] ?? 0) > 0);

  const dataPoints = competencies.map((c, i) => point(i, data[c] ?? 0));
  const dataPath =
    dataPoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";

  const gridLevels = [0.25, 0.5, 0.75, 1];

  return (
    <div className="flex flex-col items-center">
      <svg width="240" height="240" viewBox="0 0 240 240">
        {/* Grid rings */}
        {gridLevels.map((frac) => {
          const pts = competencies.map((_, i) => gridPoint(i, frac));
          const path =
            pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ") + " Z";
          return (
            <path
              key={frac}
              d={path}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Axis lines */}
        {competencies.map((_, i) => {
          const outer = gridPoint(i, 1);
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={outer.x}
              y2={outer.y}
              stroke="#e5e7eb"
              strokeWidth="1"
            />
          );
        })}

        {/* Data area */}
        {hasData && (
          <>
            <path d={dataPath} fill="#2dec2930" stroke="#2dec29" strokeWidth="2" />
            {dataPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="4"
                fill="#2dec29"
              />
            ))}
          </>
        )}

        {/* Labels */}
        {competencies.map((c, i) => {
          const lp = labelPoint(i);
          return (
            <text
              key={c}
              x={lp.x}
              y={lp.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="9"
              fill="#6b7280"
              fontWeight="500"
            >
              {COMPETENCY_LABELS[c]}
            </text>
          );
        })}
      </svg>
      {!hasData && (
        <p className="text-xs text-neutral-400 -mt-4 text-center">
          Complete sessions to see your competency chart
        </p>
      )}
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch sessions + progress scores in parallel
  const [{ data: sessions }, { data: scores }] = await Promise.all([
    supabase
      .from("interview_sessions")
      .select("id, type, topic, status, started_at, completed_at, score, feedback")
      .eq("user_id", user.id)
      .eq("type", "ai")
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("progress_scores")
      .select("competency, score, assessed_at")
      .eq("user_id", user.id)
      .order("assessed_at", { ascending: false }),
  ]);

  const sessionList: Session[] = sessions ?? [];
  const scoreList: ProgressScore[] = scores ?? [];

  const completed = sessionList.filter((s) => s.status === "completed");
  const streak = calcStreak(sessionList);

  // Average score across completed sessions
  const scoresWithValue = completed.filter((s) => s.score !== null);
  const avgConfidence =
    scoresWithValue.length > 0
      ? Math.round(
          scoresWithValue.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            scoresWithValue.length
        )
      : null;

  // Latest competency scores per competency (most recent per type)
  const latestByCompetency: Record<string, number> = {};
  for (const s of scoreList) {
    if (!(s.competency in latestByCompetency)) {
      latestByCompetency[s.competency] = s.score;
    }
  }

  const stats = [
    {
      label: "Sessions Completed",
      value: completed.length.toString(),
      icon: CheckCircle2,
      color: "#2dec29",
      sub: sessionList.length > completed.length
        ? `${sessionList.length - completed.length} in progress`
        : "Keep it up!",
    },
    {
      label: "Avg Confidence",
      value: avgConfidence !== null ? `${avgConfidence}/10` : "—",
      icon: TrendingUp,
      color: "#f59e0b",
      sub: avgConfidence !== null ? "Post-session score" : "Complete a session",
    },
    {
      label: "Practice Streak",
      value: streak > 0 ? `${streak} day${streak !== 1 ? "s" : ""}` : "0 days",
      icon: Flame,
      color: "#ef4444",
      sub: streak > 0 ? "Keep the fire going!" : "Start today",
    },
    {
      label: "Competencies Practiced",
      value: Object.keys(latestByCompetency).length.toString(),
      icon: BarChart3,
      color: "#8b5cf6",
      sub: "of 5 areas",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary">Progress</h1>
          <p className="text-neutral-500 mt-1 text-sm">
            Track your improvement across behavioral interview competencies.
          </p>
        </div>
        <Link
          href="/app/practice"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          <Sparkles className="w-4 h-4" />
          Practice Now
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
              style={{ background: color + "20" }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-secondary">{value}</div>
            <div className="text-xs font-semibold text-neutral-700 mt-0.5">{label}</div>
            <div className="text-xs text-neutral-400 mt-0.5">{sub}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4">Competency Radar</h2>
          <RadarChart data={latestByCompetency} />
          <div className="grid grid-cols-2 gap-2 mt-4">
            {Object.entries(COMPETENCY_LABELS).map(([key, label]) => {
              const val = latestByCompetency[key];
              return (
                <div key={key} className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: COMPETENCY_COLORS[key] }}
                  />
                  <span className="text-xs text-neutral-500 flex-1">{label}</span>
                  <span className="text-xs font-semibold text-secondary">
                    {val !== undefined ? `${val}%` : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Confidence trend (simple bar chart) */}
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
          <h2 className="font-semibold text-secondary mb-4">Confidence Trend</h2>
          {scoresWithValue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Calendar className="w-8 h-8 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-400">
                Your confidence scores will appear here after completing sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {scoresWithValue.slice(0, 8).reverse().map((s, i) => {
                const { date } = parseSession(s);
                const pct = ((s.score ?? 0) / 10) * 100;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-20 shrink-0">{date}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#2dec29" }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-secondary w-6 text-right">
                      {s.score}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Session History */}
      <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
          <h2 className="font-semibold text-secondary">Session History</h2>
          {completed.length > 0 && (
            <span className="text-xs text-neutral-400">
              {completed.length} completed session{completed.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        {sessionList.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#f4fdf3" }}
            >
              <BarChart3 className="w-7 h-7 text-neutral-400" />
            </div>
            <p className="font-semibold text-secondary">No sessions yet</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              Start your first AI practice session to begin tracking your progress.
            </p>
            <Link
              href="/app/practice"
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-xl text-sm font-semibold transition hover:opacity-90"
              style={{ background: "#2dec29", color: "#112715" }}
            >
              Start Practicing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50">
            {sessionList.map((s) => {
              const { category, question, date } = parseSession(s);
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-neutral-50 transition"
                >
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                    style={{
                      background:
                        (COMPETENCY_COLORS[category] ?? "#6b7280") + "20",
                    }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        background: COMPETENCY_COLORS[category] ?? "#6b7280",
                      }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-neutral-500 uppercase tracking-wide">
                        {COMPETENCY_LABELS[category] ?? category}
                      </span>
                      {s.status === "completed" ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 font-medium">
                          Completed
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                          In progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-secondary truncate max-w-sm">
                      {question}
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5">{date}</p>
                  </div>
                  {s.score !== null && (
                    <div className="text-right shrink-0">
                      <p className="text-lg font-bold text-secondary">{s.score}</p>
                      <p className="text-xs text-neutral-400">/ 10</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
