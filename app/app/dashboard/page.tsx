import { createClient } from "@/lib/supabase/server";
import {
  BarChart3,
  Flame,
  Calendar,
  ArrowRight,
  Sparkles,
  Brain,
  MessageSquare,
  TrendingUp,
  Zap,
} from "lucide-react";
import Link from "next/link";

const frameworks = [
  {
    name: "STAR",
    description: "Situation, Task, Action, Result — the foundation of behavioral storytelling.",
    color: "#2dec29",
    level: "All levels",
  },
  {
    name: "R-STAR",
    description: "Adds Reflection to STAR, showing growth mindset and self-awareness.",
    color: "#48e57c",
    level: "Mid → Senior",
  },
  {
    name: "Ownership Signals",
    description: "Demonstrates initiative, accountability, and end-to-end ownership.",
    color: "#112715",
    level: "Senior → Staff",
  },
];

const upcomingFeatures = [
  {
    icon: Brain,
    title: "Peer Matching",
    description: "Get matched with an engineer at your level for structured 45-min practice sessions.",
    eta: "Coming Q2 2026",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Connect with other engineers preparing for interviews. Share stories, get support.",
    eta: "Coming Q3 2026",
  },
];

function calcStreak(sessions: { status: string; completed_at: string | null; started_at: string }[]): number {
  if (!sessions.length) return 0;
  const dates = sessions
    .filter((s) => s.status === "completed")
    .map((s) =>
      new Date(s.completed_at ?? s.started_at).toDateString()
    )
    .filter((v, i, a) => a.indexOf(v) === i)
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (!dates.length) return 0;
  let streak = 0;
  let current = new Date();
  current.setHours(0, 0, 0, 0);
  for (const d of dates) {
    const date = new Date(d);
    const diff = (current.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
    if (diff <= 1) { streak++; current = date; } else break;
  }
  return streak;
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "there";

  // Fetch real stats
  const { data: sessions } = await supabase
    .from("interview_sessions")
    .select("id, status, started_at, completed_at, score")
    .eq("user_id", user!.id)
    .eq("type", "ai")
    .order("started_at", { ascending: false })
    .limit(50);

  const sessionList = sessions ?? [];
  const completed = sessionList.filter((s) => s.status === "completed");
  const streak = calcStreak(sessionList);
  const scoresWithValue = completed.filter((s) => s.score !== null);
  const avgConfidence =
    scoresWithValue.length > 0
      ? Math.round(
          scoresWithValue.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            scoresWithValue.length
        )
      : null;

  const stats = [
    {
      label: "Sessions Completed",
      value: completed.length.toString(),
      icon: BarChart3,
      sub: completed.length === 0 ? "Start your first session" : `${sessionList.length} total`,
      color: "#2dec29",
      href: "/app/progress",
    },
    {
      label: "Avg Confidence",
      value: avgConfidence !== null ? `${avgConfidence}/10` : "—",
      icon: Zap,
      sub: avgConfidence !== null ? "Post-session score" : "Tracked after sessions",
      color: "#48e57c",
      href: "/app/progress",
    },
    {
      label: "Practice Streak",
      value: streak > 0 ? `${streak} day${streak !== 1 ? "s" : ""}` : "0 days",
      icon: Flame,
      sub: streak > 0 ? "Keep the fire going!" : "Keep the momentum going",
      color: "#f59e0b",
      href: null,
    },
    {
      label: "Peer Match",
      value: "Coming soon",
      icon: Calendar,
      sub: "Q2 2026",
      color: "#8b5cf6",
      href: null,
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome */}
      <div>
        <h1 className="text-2xl font-bold text-secondary">
          Welcome back, {displayName} 👋
        </h1>
        <p className="text-neutral-500 mt-1">
          You&apos;re building towards your next great interview. Let&apos;s get some practice in.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, sub, color, href }) => {
          const card = (
            <div
              key={label}
              className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
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
          );
          return href ? (
            <Link key={label} href={href} className="block">
              {card}
            </Link>
          ) : (
            <div key={label}>{card}</div>
          );
        })}
      </div>

      {/* CTA: AI Practice */}
      <div
        className="rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4"
        style={{ background: "#112715" }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: "#2dec29" }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#2dec29" }}
            >
              AI Practice Partner
            </span>
          </div>
          <h2 className="text-white text-lg font-bold">
            Practice with Your AI Coach
          </h2>
          <p className="text-white/60 text-sm mt-1">
            On-demand behavioral interview practice with structured R-STAR feedback. Available 24/7, no scheduling required.
          </p>
        </div>
        <Link
          href="/app/practice"
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm shrink-0 transition-opacity hover:opacity-90"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          Start Practice
          <Sparkles className="w-4 h-4" />
        </Link>
      </div>

      {/* Quick links */}
      <div className="grid sm:grid-cols-2 gap-4">
        <Link
          href="/app/progress"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#f4fdf3" }}
          >
            <TrendingUp className="w-5 h-5" style={{ color: "#2dec29" }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary text-sm">View Progress</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              {completed.length > 0
                ? `${completed.length} session${completed.length !== 1 ? "s" : ""} completed`
                : "Track your improvement over time"}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
        </Link>
        <Link
          href="/app/settings"
          className="flex items-center gap-4 bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#f4fdf3" }}
          >
            <BarChart3 className="w-5 h-5 text-neutral-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-secondary text-sm">Complete Your Profile</p>
            <p className="text-xs text-neutral-400 mt-0.5">Set your experience level and target companies</p>
          </div>
          <ArrowRight className="w-4 h-4 text-neutral-400 shrink-0" />
        </Link>
      </div>

      {/* Frameworks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-secondary">Behavioral Frameworks</h2>
          <Link
            href="/app/frameworks"
            className="text-sm font-medium flex items-center gap-1 hover:opacity-80 transition"
            style={{ color: "#2dec29" }}
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          {frameworks.map(({ name, description, color, level }) => (
            <Link
              key={name}
              href="/app/practice"
              className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow block"
            >
              <div
                className="inline-flex items-center justify-center w-10 h-10 rounded-xl text-sm font-bold mb-3"
                style={{ background: color, color: color === "#112715" ? "#fff" : "#112715" }}
              >
                {name.slice(0, 1)}
              </div>
              <h3 className="font-bold text-secondary mb-1">{name}</h3>
              <p className="text-xs text-neutral-500 mb-3">{description}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-cream-dark text-secondary font-medium">
                {level}
              </span>
            </Link>
          ))}
        </div>
      </div>

      {/* Upcoming features */}
      <div>
        <h2 className="text-lg font-bold text-secondary mb-1">What&apos;s Coming</h2>
        <p className="text-sm text-neutral-500 mb-4">
          We&apos;re building the features you need most. Here&apos;s what&apos;s on the roadmap.
        </p>
        <div className="grid sm:grid-cols-2 gap-4">
          {upcomingFeatures.map(({ icon: Icon, title, description, eta }) => (
            <div
              key={title}
              className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm opacity-80"
            >
              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center mb-3"
                style={{ background: "#f4fdf3" }}
              >
                <Icon className="w-5 h-5 text-neutral-400" />
              </div>
              <h3 className="font-semibold text-secondary mb-1">{title}</h3>
              <p className="text-xs text-neutral-500 mb-3">{description}</p>
              <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 font-medium">
                {eta}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
