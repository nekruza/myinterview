import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { FreeBanner, FreeBannerInline } from "@/components/FreeBanner";
import Link from "next/link";
import { posts } from "@/lib/blog";
import { Suspense } from "react";
import { SignupConversionTracker } from "@/components/SignupConversionTracker";
import { InterviewerPicker } from "@/components/InterviewerPicker";


// ─── Helpers ─────────────────────────────────────────────────────────────────

function getGreeting(): string {
  const hour = new Date().getUTCHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

function calcStreak(
  sessions: { status: string; completed_at: string | null; started_at: string }[]
): number {
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
    const diff = (current.getTime() - date.getTime()) / 86_400_000;
    if (diff <= 1) { streak++; current = date; } else break;
  }
  return streak;
}

/** Returns Mon–Sun of the current week each with a short label + whether practiced */
function getWeekActivity(
  sessions: { status: string; completed_at: string | null; started_at: string }[]
): { label: string; active: boolean; isToday: boolean }[] {
  const DAY_LABELS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromMonday = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const active = sessions.some((s) => {
      if (s.status !== "completed") return false;
      const d = new Date(s.completed_at ?? s.started_at);
      return d >= dayStart && d < dayEnd;
    });
    return { label: DAY_LABELS[dayStart.getDay()], active, isToday: dayStart.getTime() === today.getTime() };
  });
}

/** Returns avg confidence score per day for Mon–Sun of the current week (null = no sessions that day) */
function getScoreHistory(
  sessions: { status: string; completed_at: string | null; started_at: string; score: number | null }[]
): (number | null)[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysFromMonday = (today.getDay() + 6) % 7;
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - daysFromMonday);
  return Array.from({ length: 7 }, (_, i) => {
    const dayStart = new Date(weekStart);
    dayStart.setDate(weekStart.getDate() + i);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayStart.getDate() + 1);
    const scored = sessions.filter((s) => {
      if (s.status !== "completed" || s.score === null) return false;
      const d = new Date(s.completed_at ?? s.started_at);
      return d >= dayStart && d < dayEnd;
    });
    if (!scored.length) return null;
    return scored.reduce((sum, s) => sum + (s.score ?? 0), 0) / scored.length;
  });
}

/** Pure-SVG sparkline — no dependencies, renders on the server */
function SparklineChart({
  data,
  stroke = "white",
  className = "",
}: {
  data: (number | null)[];
  stroke?: string;
  className?: string;
}) {
  const W = 160;
  const H = 52;

  // Map each value to an (x, y) point; skip nulls
  const pts = data
    .map((v, i) => {
      if (v === null) return null;
      return {
        x: parseFloat(((i / (data.length - 1)) * W).toFixed(2)),
        y: parseFloat((H - (v / 100) * (H * 0.8) - H * 0.1).toFixed(2)),
      };
    })
    .filter(Boolean) as { x: number; y: number }[];

  if (pts.length < 2) return null;

  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${pts.at(-1)!.x},${H} L${pts[0].x},${H} Z`;
  const gradId = `sg-${stroke.replace(/[^a-z]/gi, "")}`;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className={className}
      aria-hidden="true"
      preserveAspectRatio="none"
    >
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.35" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Area fill */}
      <path d={area} fill={`url(#${gradId})`} />
      {/* Line */}
      <path d={line} stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      {/* Dots — kept small so oval distortion from preserveAspectRatio="none" is negligible */}
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2" fill={stroke} />
      ))}
    </svg>
  );
}

/** Weekly bar chart (7 bars Mon–Sun) — server-renderable SVG, nulls render as ghost bars */
function BarChart({
  data,
  stroke = "white",
  className = "",
}: {
  data: (number | null)[];
  stroke?: string;
  className?: string;
}) {
  const W = 200;
  const H = 56;
  const count = data.length;
  const gap = 4;
  const barW = (W - gap * (count - 1)) / count;
  const maxVal = 100;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} aria-hidden="true" preserveAspectRatio="none">
      {data.map((v, i) => {
        const x = parseFloat((i * (barW + gap)).toFixed(2));
        const w = parseFloat(barW.toFixed(2));
        if (v === null) {
          // Ghost bar — short placeholder at the bottom
          return <rect key={i} x={x} y={H - 4} width={w} height={4} rx="2" fill={stroke} fillOpacity="0.15" />;
        }
        const barH = Math.max(4, (v / maxVal) * H * 0.9);
        const y = parseFloat((H - barH).toFixed(2));
        return <rect key={i} x={x} y={y} width={w} height={parseFloat(barH.toFixed(2))} rx="2" fill={stroke} fillOpacity="0.8" />;
      })}
    </svg>
  );
}

/** Circular arc progress toward the next streak milestone — server-renderable SVG */
function StreakRing({ streak, size = 72 }: { streak: number; size?: number }) {
  const milestone = streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : 100;
  const progress = Math.min(streak / milestone, 1);
  const sw = 4;
  const r = parseFloat((size / 2 - sw - 1).toFixed(2));
  const circ = parseFloat((2 * Math.PI * r).toFixed(2));
  const offset = parseFloat((circ * (1 - progress)).toFixed(2));
  const c = size / 2;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
      <circle cx={c} cy={c} r={r} fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth={sw} />
      <circle
        cx={c} cy={c} r={r}
        fill="none"
        stroke="rgba(255,255,255,0.9)"
        strokeWidth={sw}
        strokeLinecap="round"
        strokeDasharray={circ}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${c} ${c})`}
      />
    </svg>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split("@")[0] ??
    "there";
  const firstName = displayName.split(" ")[0];

  const [{ data: sessions }, { data: profileRow }] = await Promise.all([
    supabase
      .from("interview_sessions")
      .select("id, status, started_at, completed_at, score")
      .eq("user_id", user!.id)
      .eq("type", "ai")
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("session_credits")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  const sessionCredits = profileRow?.session_credits ?? 0;

  const sessionList = sessions ?? [];
  const completed = sessionList.filter((s) => s.status === "completed");
  const streak = calcStreak(sessionList);
  const scoresWithValue = completed.filter((s) => s.score !== null);
  const avgScore =
    scoresWithValue.length > 0
      ? Math.round(
          scoresWithValue.reduce((sum, s) => sum + (s.score ?? 0), 0) /
            scoresWithValue.length
        )
      : null;

  // ── Journey milestones ─────────────────────────────────────────────────────
  const journeyStep1Done = completed.length >= 1;
  const journeyStep2Done = streak >= 3;
  const journeyStep3Done = scoresWithValue.some((s) => (s.score ?? 0) >= 80);
  const journeyAllDone = journeyStep1Done && journeyStep2Done && journeyStep3Done;

  const greeting = getGreeting();
  const weekActivity = getWeekActivity(sessionList);
  const scoreHistory = getScoreHistory(sessionList);
  const _weekRangeStart = (() => {
    const d = new Date(); d.setHours(0,0,0,0);
    d.setDate(d.getDate() - (d.getDay() + 6) % 7);
    return d;
  })();
  const _weekRangeEnd = new Date(_weekRangeStart);
  _weekRangeEnd.setDate(_weekRangeStart.getDate() + 6);
  const weekRangeLabel = `${_weekRangeStart.getDate()}–${_weekRangeEnd.getDate()} ${_weekRangeEnd.toLocaleDateString("en-GB", { month: "short" })}`;

  return (
    <div className="space-y-5 pb-12 animate-fade-in">
      <Suspense><SignupConversionTracker /></Suspense>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 1 ▸ GREETING                                                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary leading-tight">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Your daily interview workout is ready.
          </p>
        </div>
        <FreeBannerInline sessionCredits={sessionCredits} />
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2 ▸ FREE TIER USAGE BANNER (free users only)                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <FreeBanner sessionCredits={sessionCredits} />

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3 ▸ MAIN GRID — Practice Now (left) + Day Streak (right)             */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-[3fr_2fr]">

        {/* ── LEFT: Interviewer picker card */}
        <div
          className="relative rounded-2xl overflow-hidden flex flex-col p-6"
          style={{
            background: "linear-gradient(160deg, #071a09 0%, #112914 50%, #0a2010 100%)",
            minHeight: "380px",
            border: "1px solid rgba(45,236,41,0.12)",
          }}
        >
          {/* ── Glows */}
          <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-[0.08]" style={{ background: "#2dec29" }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-[0.07]" style={{ background: "#2dec29" }} />

          {/* ── Badge + headline */}
          <div className="relative z-10 mb-5">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit mb-3"
              style={{ background: "#2dec2914", border: "1px solid #2dec2935" }}
            >
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2dec29" }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2dec29" }}>
                AI Coach · 24/7
              </span>
            </div>
            <h3 className="text-white font-extrabold leading-[1.15]" style={{ fontSize: "1.5rem" }}>
              Who&apos;s interviewing<br />you today?
            </h3>
            <p className="text-white/35 text-xs mt-1.5">
              Pick an interviewer to start · 10 min · instant feedback
            </p>
          </div>

          {/* ── 3 avatar cards */}
          <div className="relative z-10 flex-1">
            <InterviewerPicker />
          </div>
        </div>

        {/* ── RIGHT: Day Streak card */}
        <Link
          href="/app/progress"
          className="relative rounded-2xl overflow-hidden flex flex-col hover:opacity-95 transition-opacity"
          style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 35%, #fbbf24 100%)", minHeight: "380px" }}
        >
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/15" />

          <div className="relative z-10 flex flex-col p-5 flex-1 justify-between gap-4">

            {/* Top: streak ring + number */}
            <div className="flex items-center gap-3">
              <div className="relative shrink-0 flex flex-col items-center gap-0.5">
                <div className="relative" style={{ width: 68, height: 68 }}>
                  <StreakRing streak={streak} size={68} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[26px] leading-none">🔥</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold text-white/40 tabular-nums">
                  of&nbsp;{streak < 7 ? 7 : streak < 14 ? 14 : streak < 30 ? 30 : 100}d
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <div className="text-4xl font-black text-white leading-none tabular-nums">{streak}</div>
                <div className="text-white/80 font-bold text-sm leading-tight">Day Streak</div>
                <p className="text-white/55 text-[12px] leading-snug mt-1">
                  {streak >= 14
                    ? "Legendary! 🏆"
                    : streak >= 7
                    ? "One full week! 🔥"
                    : streak >= 3
                    ? "Building momentum!"
                    : streak > 0
                    ? "Great start!"
                    : "Start your streak today!"}
                </p>
              </div>
            </div>

            {/* Middle: session score bars */}
            <div className="flex flex-col flex-1 border-t border-white/20 pt-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Score trend</span>
                <span className="text-[10px] font-bold text-white/70 flex items-center gap-0.5">
                  Progress <ChevronRight className="w-3 h-3" />
                </span>
              </div>
              {scoreHistory.some((v) => v !== null) ? (
                <BarChart data={scoreHistory} stroke="white" className="w-full flex-1 min-h-[48px]" />
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2">
                  <span className="text-xl">📊</span>
                  <span className="text-[9px] text-white/40 text-center leading-tight">
                    Complete a session<br />to see your scores
                  </span>
                </div>
              )}
            </div>

            {/* Bottom: week activity dots */}
            <div className="flex items-center gap-1 border-t border-white/20 pt-4">
              {weekActivity.map((day, i) => (
                <div key={i} className="flex flex-col items-center gap-0.5 flex-1">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-[9px] font-black border",
                      day.active
                        ? "bg-white text-orange-500 border-white shadow-sm"
                        : day.isToday
                        ? "bg-white/20 text-white/70 border-white/30"
                        : "bg-white/10 border-transparent"
                    )}
                  >
                    {day.active ? "✓" : ""}
                  </div>
                  <span className="text-[12px] font-bold text-white/40">{day.label}</span>
                </div>
              ))}
            </div>

          </div>
        </Link>

      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 4 ▸ JOURNEY STRIP                                                     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {!journeyAllDone && (
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-3"
          style={{
            background: "linear-gradient(135deg, #071a09, #0a1a0b)",
            border: "1px solid rgba(45,236,41,0.22)",
          }}
        >
          <span className="text-[9px] font-bold uppercase tracking-[0.14em] shrink-0" style={{ color: "rgba(45,236,41,0.65)" }}>
            Your path
          </span>

          <div className="flex items-center gap-2 flex-1 overflow-x-auto">
            {/* Step 1 */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
              style={{
                background: journeyStep1Done ? "rgba(45,236,41,0.08)" : "rgba(45,236,41,0.12)",
                border: journeyStep1Done ? "1px solid rgba(45,236,41,0.2)" : "1px solid rgba(45,236,41,0.45)",
                opacity: journeyStep1Done ? 0.75 : 1,
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                style={{
                  background: journeyStep1Done ? "rgba(45,236,41,0.3)" : "#2dec29",
                  color: journeyStep1Done ? "#2dec29" : "#071a09",
                }}
              >
                {journeyStep1Done ? "✓" : "1"}
              </span>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: journeyStep1Done ? "rgba(255,255,255,0.55)" : "#2dec29" }}
              >
                {journeyStep1Done ? "First session" : "First session ← now"}
              </span>
            </div>

            <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.15)" }}>→</span>

            {/* Step 2 */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0 transition-all"
              style={{
                background: journeyStep2Done ? "rgba(45,236,41,0.08)" : "rgba(255,255,255,0.04)",
                border: journeyStep2Done ? "1px solid rgba(45,236,41,0.2)" : journeyStep1Done ? "1px solid rgba(45,236,41,0.45)" : "1px solid rgba(255,255,255,0.08)",
                opacity: journeyStep2Done ? 0.75 : journeyStep1Done ? 1 : 0.5,
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                style={{
                  background: journeyStep2Done ? "rgba(45,236,41,0.3)" : journeyStep1Done ? "#2dec29" : "rgba(255,255,255,0.08)",
                  color: journeyStep2Done ? "#2dec29" : journeyStep1Done ? "#071a09" : "rgba(255,255,255,0.3)",
                }}
              >
                {journeyStep2Done ? "✓" : "2"}
              </span>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: journeyStep2Done ? "rgba(255,255,255,0.55)" : journeyStep1Done ? "#2dec29" : "rgba(255,255,255,0.3)" }}
              >
                3-day streak 🔥
              </span>
            </div>

            <span className="text-[10px] shrink-0" style={{ color: "rgba(255,255,255,0.15)" }}>→</span>

            {/* Step 3 */}
            <div
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg shrink-0"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: journeyStep2Done ? "1px solid rgba(45,236,41,0.45)" : "1px solid rgba(255,255,255,0.08)",
                opacity: journeyStep2Done ? 1 : 0.4,
              }}
            >
              <span
                className="w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                style={{
                  background: journeyStep2Done ? "#2dec29" : "rgba(255,255,255,0.08)",
                  color: journeyStep2Done ? "#071a09" : "rgba(255,255,255,0.3)",
                }}
              >
                3
              </span>
              <span
                className="text-[10px] font-semibold whitespace-nowrap"
                style={{ color: journeyStep2Done ? "#2dec29" : "rgba(255,255,255,0.3)" }}
              >
                Score 80%+ 🏆
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 7 ▸ FROM THE BLOG                                                     */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-secondary text-base">From the Blog</h2>
          <Link
            href="/app/resources"
            className="flex items-center gap-0.5 text-xs font-bold transition-opacity hover:opacity-70"
            style={{ color: "#2dec29" }}
          >
            All articles <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto pb-2 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex gap-3 w-max">
            {posts.slice(0, 5).map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="glass-card group w-52 shrink-0 rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                <div className="h-2" style={{ background: "#2dec29" }} />
                <div className="p-4">
                  <div className="text-2xl mb-2">{post.coverEmoji}</div>
                  <h3 className="font-black text-secondary text-sm mb-1.5 line-clamp-2 leading-snug">
                    {post.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 leading-relaxed mb-3 line-clamp-2">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className="inline-block text-[10px] px-2.5 py-1 rounded-full font-bold"
                      style={{ background: "#2dec2920", color: "#0a5c09" }}
                    >
                      {post.category}
                    </span>
                    <span className="text-[10px] text-neutral-400">{post.readTime}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>


    </div>
  );
}
