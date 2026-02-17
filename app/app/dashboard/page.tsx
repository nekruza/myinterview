import { createClient } from "@/lib/supabase/server";
import {
  BarChart3,
  Users,
  Flame,
  Calendar,
  ArrowRight,
  Sparkles,
  Brain,
  MessageSquare,
  Clock,
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
    icon: Users,
    title: "Peer Matching",
    description: "Get matched with an engineer at your level for structured 45-min practice sessions.",
    eta: "Coming Q2 2026",
  },
  {
    icon: Brain,
    title: "AI Practice Partner",
    description: "On-demand AI mock interviews available 24/7 with framework-aware feedback.",
    eta: "Coming Q2 2026",
  },
  {
    icon: MessageSquare,
    title: "Community",
    description: "Connect with other engineers preparing for interviews. Share stories, get support.",
    eta: "Coming Q3 2026",
  },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "there";

  const stats = [
    {
      label: "Sessions Completed",
      value: "0",
      icon: BarChart3,
      sub: "Start your first session",
      color: "#2dec29",
    },
    {
      label: "Confidence Score",
      value: "—",
      icon: Zap,
      sub: "Tracked after sessions",
      color: "#48e57c",
    },
    {
      label: "Practice Streak",
      value: "0 days",
      icon: Flame,
      sub: "Keep the momentum going",
      color: "#f59e0b",
    },
    {
      label: "Next Match",
      value: "Not set",
      icon: Calendar,
      sub: "Request a partner above",
      color: "#8b5cf6",
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
        {stats.map(({ label, value, icon: Icon, sub, color }) => (
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

      {/* CTA: Find a partner */}
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
              Peer Practice
            </span>
          </div>
          <h2 className="text-white text-lg font-bold">
            Find a Practice Partner
          </h2>
          <p className="text-white/60 text-sm mt-1">
            Get matched with an engineer at your experience level for a structured 45-minute behavioral interview session.
          </p>
        </div>
        <button
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm shrink-0 transition-opacity hover:opacity-90"
          style={{ background: "#2dec29", color: "#112715" }}
          disabled
        >
          Coming Soon
          <Clock className="w-4 h-4" />
        </button>
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
            <div
              key={name}
              className="bg-white rounded-2xl p-5 border border-neutral-100 shadow-sm hover:shadow-md transition-shadow"
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
            </div>
          ))}
        </div>
      </div>

      {/* Recent Sessions */}
      <div>
        <h2 className="text-lg font-bold text-secondary mb-4">Recent Sessions</h2>
        <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm">
          <div className="flex flex-col items-center justify-center py-16 text-center px-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: "#f4fdf3" }}
            >
              <BarChart3 className="w-7 h-7 text-neutral-400" />
            </div>
            <p className="font-semibold text-secondary">No sessions yet</p>
            <p className="text-sm text-neutral-400 mt-1 max-w-xs">
              Your completed practice sessions will appear here. Find a peer partner or use AI practice to get started.
            </p>
          </div>
        </div>
      </div>

      {/* Upcoming features */}
      <div>
        <h2 className="text-lg font-bold text-secondary mb-1">What&apos;s Coming</h2>
        <p className="text-sm text-neutral-500 mb-4">
          We&apos;re building the features you need most. Here&apos;s what&apos;s on the roadmap.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
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
