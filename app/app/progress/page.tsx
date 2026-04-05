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
  conflict: "#3b82f6",
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

// ─── Performance Trend Line Chart ────────────────────────────────────────────

function PerformanceTrendLineChart({ sessions }: { sessions: Session[] }) {
  // Oldest → newest, cap at 20
  const data = [...sessions]
    .filter((s) => s.score !== null)
    .slice(0, 20)
    .reverse();

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-center">
        <TrendingUp className="w-8 h-8 text-neutral-300 mb-3" />
        <p className="text-sm text-neutral-400">
          Your performance trend will appear here after completing sessions.
        </p>
      </div>
    );
  }

  const W = 400;
  const H = 180;
  const pad = { top: 20, right: 16, bottom: 32, left: 40 };
  const CW = W - pad.left - pad.right;
  const CH = H - pad.top - pad.bottom;

  const toX = (i: number) =>
    pad.left + (data.length > 1 ? (i / (data.length - 1)) * CW : CW / 2);
  const toY = (score: number) => pad.top + (1 - score / 100) * CH;

  const pts = data.map((s, i) => ({ x: toX(i), y: toY(s.score!) }));
  const linePath = pts
    .map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${pts.at(-1)!.x.toFixed(1)},${(pad.top + CH).toFixed(1)} L${pts[0].x.toFixed(1)},${(pad.top + CH).toFixed(1)} Z`;

  const gridLines = [0, 25, 50, 75, 100];

  // Trend: compare first-half avg vs second-half avg
  const trend = (() => {
    if (data.length < 3) return null;
    const half = Math.floor(data.length / 2);
    const firstAvg =
      data.slice(0, half).reduce((s, d) => s + d.score!, 0) / half;
    const lastAvg =
      data.slice(-half).reduce((s, d) => s + d.score!, 0) / half;
    const diff = lastAvg - firstAvg;
    if (diff > 5) return { label: "Improving", arrow: "↑", color: "#2dec29" };
    if (diff < -5) return { label: "Declining", arrow: "↓", color: "#ef4444" };
    return { label: "Stable", arrow: "→", color: "#f59e0b" };
  })();

  const step = data.length <= 6 ? 1 : data.length <= 12 ? 2 : 4;

  return (
    <div>
      {trend && (
        <div
          className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full mb-4"
          style={{ background: trend.color + "20", color: trend.color }}
        >
          <span>{trend.arrow}</span>
          <span>{trend.label}</span>
        </div>
      )}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 180 }}
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        {/* Horizontal grid lines + Y-axis labels */}
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={pad.left}
              y1={toY(v)}
              x2={W - pad.right}
              y2={toY(v)}
              stroke="#e5e7eb"
              strokeWidth="1"
              strokeDasharray={v === 0 ? undefined : "3,3"}
            />
            <text
              x={pad.left - 6}
              y={toY(v) + 4}
              textAnchor="end"
              fontSize="9"
              fill="#9ca3af"
            >
              {v}%
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaPath} fill="#2dec29" fillOpacity="0.1" />

        {/* Line */}
        <path
          d={linePath}
          stroke="#2dec29"
          strokeWidth="2.5"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Score labels above dots (only when few sessions) */}
        {data.length <= 10 &&
          pts.map((p, i) => (
            <text
              key={i}
              x={p.x}
              y={p.y - 8}
              textAnchor="middle"
              fontSize="9"
              fontWeight="600"
              fill="#374151"
            >
              {data[i].score}%
            </text>
          ))}

        {/* Dots */}
        {pts.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={data.length > 12 ? 2.5 : 4}
            fill="#2dec29"
          />
        ))}

        {/* X-axis date labels */}
        {data.map((s, i) => {
          if (i !== 0 && i !== data.length - 1 && i % step !== 0) return null;
          const date = new Date(s.completed_at ?? s.started_at);
          const label = date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          });
          return (
            <text
              key={i}
              x={toX(i)}
              y={H - 6}
              textAnchor="middle"
              fontSize="8.5"
              fill="#9ca3af"
            >
              {label}
            </text>
          );
        })}
      </svg>
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

  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, type, topic, status, started_at, completed_at, score, feedback")
    .eq("user_id", user.id)
    .eq("type", "ai")
    .order("started_at", { ascending: false })
    .limit(50);

  const sessionList: Session[] = sessions ?? [];
  const completed = sessionList.filter((s) => s.status === "completed");
  const streak = calcStreak(sessionList);

  // Performance score stats
  const scoresWithValue = completed.filter((s) => s.score !== null);
  const avgScore =
    scoresWithValue.length > 0
      ? Math.round(
          scoresWithValue.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            scoresWithValue.length
        )
      : null;
  const bestScore =
    scoresWithValue.length > 0
      ? Math.max(...scoresWithValue.map((s) => s.score ?? 0))
      : null;

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
      label: "Avg Score",
      value: avgScore !== null ? `${avgScore}%` : "—",
      icon: TrendingUp,
      color: "#f59e0b",
      sub: avgScore !== null ? "AI performance score" : "Complete a session",
    },
    {
      label: "Practice Streak",
      value: streak > 0 ? `${streak} day${streak !== 1 ? "s" : ""}` : "0 days",
      icon: Flame,
      color: "#ef4444",
      sub: streak > 0 ? "Keep the fire going!" : "Start today",
    },
    {
      label: "Best Score",
      value: bestScore !== null ? `${bestScore}%` : "—",
      icon: BarChart3,
      color: "#06b6d4",
      sub: bestScore !== null ? "Personal best" : "Complete a session",
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: "linear-gradient(135deg, #071a09 0%, #0d2410 100%)" }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -top-10 right-0 w-48 h-48 rounded-full blur-3xl opacity-[0.12]"
          style={{ background: "#2dec29" }}
        />
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <TrendingUp className="w-3.5 h-3.5" style={{ color: "rgba(45,236,41,0.7)" }} />
              <span
                className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: "rgba(45,236,41,0.7)" }}
              >
                Progress Tracker
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white">Your Progress</h1>
            <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.42)" }}>
              {completed.length > 0
                ? `${completed.length} session${completed.length !== 1 ? "s" : ""} completed · keep the momentum going`
                : "Complete your first session to start tracking improvement"}
            </p>
          </div>
          <Link
            href="/app/practice"
            className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 hover:brightness-110 active:scale-[0.97]"
            style={{ background: "#2dec29", color: "#071a09" }}
          >
            <Sparkles className="w-4 h-4" />
            Practice Now
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div
            key={label}
            className="glass-card rounded-2xl p-5"
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
        {/* Performance Trend Line Chart */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-secondary mb-1">Performance Trend</h2>
          <p className="text-xs text-neutral-400 mb-4">AI score across all sessions</p>
          <PerformanceTrendLineChart sessions={scoresWithValue} />
        </div>

        {/* Recent sessions bar chart */}
        <div className="glass-card rounded-2xl p-6">
          <h2 className="font-semibold text-secondary mb-1">Recent Sessions</h2>
          <p className="text-xs text-neutral-400 mb-4">Last 8 scored sessions</p>
          {scoresWithValue.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <Calendar className="w-8 h-8 text-neutral-300 mb-3" />
              <p className="text-sm text-neutral-400">
                Your performance scores will appear here after completing sessions.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {scoresWithValue.slice(0, 8).reverse().map((s, i) => {
                const { date } = parseSession(s);
                const pct = s.score ?? 0;
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-neutral-400 w-20 shrink-0">{date}</span>
                    <div className="flex-1 bg-neutral-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{ width: `${pct}%`, background: "#2dec29" }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-secondary w-8 text-right">
                      {s.score}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Session History */}
      <div className="glass-card rounded-2xl overflow-hidden">
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
              className="inline-flex items-center gap-2 mt-4 px-5 py-2.5 rounded-2xl text-sm font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
              style={{ background: "#2dec29", color: "#112715" }}
            >
              Start Practicing <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-neutral-50 max-h-96 overflow-y-auto">
            {sessionList.map((s) => {
              const { category, question, date } = parseSession(s);
              const accentColor = COMPETENCY_COLORS[category] ?? "#6b7280";
              const scoreColor =
                s.score === null ? "#6b7280"
                : s.score >= 80 ? "#2dec29"
                : s.score >= 60 ? "#f59e0b"
                : "#ef4444";
              return (
                <div
                  key={s.id}
                  className="flex items-start gap-4 px-6 py-4 hover:bg-neutral-50/70 transition-colors duration-150"
                >
                  {/* Color-coded left dot */}
                  <div className="flex flex-col items-center gap-1 shrink-0 mt-1.5">
                    <div
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: accentColor }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: accentColor }}
                      >
                        {COMPETENCY_LABELS[category] ?? category}
                      </span>
                      {s.status === "completed" ? (
                        <span
                          className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                          style={{ background: "#f0fdf4", color: "#16a34a" }}
                        >
                          Done
                        </span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-400 font-semibold">
                          In progress
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-medium text-secondary truncate max-w-sm leading-snug">
                      {question}
                    </p>
                    <p className="text-[11px] text-neutral-400 mt-0.5">{date}</p>
                  </div>
                  {s.score !== null && (
                    <div className="text-right shrink-0">
                      <span
                        className="text-base font-black tabular-nums"
                        style={{ color: scoreColor }}
                      >
                        {s.score}%
                      </span>
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
