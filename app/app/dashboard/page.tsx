import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import type { Plan } from "@/lib/session-limits";
import { ChevronRight, PlayCircle, User, Sparkles, Zap } from "lucide-react";
import { FreeBanner } from "@/components/FreeBanner";
import { FeedbackCard } from "@/components/FeedbackCard";
import Image from "next/image";
import Link from "next/link";
import { posts } from "@/lib/blog";
import { Suspense } from "react";
import { SignupConversionTracker } from "@/components/SignupConversionTracker";


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

  const [{ data: sessions }, { data: subRow }, { data: profileRow }] = await Promise.all([
    supabase
      .from("interview_sessions")
      .select("id, status, started_at, completed_at, score")
      .eq("user_id", user!.id)
      .eq("type", "ai")
      .order("started_at", { ascending: false })
      .limit(50),
    supabase
      .from("subscriptions")
      .select("plan")
      .eq("user_id", user!.id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("practice_sessions_used")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  const plan = (subRow?.plan ?? "free") as Plan;
  const practiceUsed = profileRow?.practice_sessions_used ?? 0;

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-secondary leading-tight">
            {greeting}, {firstName}! 👋
          </h1>
          <p className="text-neutral-500 text-sm mt-1">
            Your daily interview workout is ready.
          </p>
        </div>
      </div>

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 2 ▸ FREE TIER USAGE BANNER (free users only)                          */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {plan === "free" && (
        <FreeBanner
          practiceLeft={Math.max(0, 3 - practiceUsed)}
        />
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 3 ▸ STREAK HERO (Duolingo-style)                                      */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {streak > 0 ? (
        <Link
          href="/app/progress"
          className="relative rounded-2xl overflow-hidden block hover:opacity-95 transition-opacity"
          style={{ background: "linear-gradient(135deg, #f97316 0%, #fb923c 35%, #fbbf24 100%)" }}
        >
          {/* Decorative blob */}
          <div className="pointer-events-none absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/15" />

          {/* Top: left streak info + right sparkline */}
          <div className="relative z-10 flex items-stretch gap-0 p-4 h-auto sm:h-[200px] justify-between">

            {/* Left: streak info — shrink-0 so it doesn't eat all flex space */}
            <div className="shrink-0 flex flex-col gap-2.5 pr-4">
              <div className="flex items-center gap-3 mb-4">
                {/* Circular milestone ring with flame inside */}
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
                {/* Count + label + message */}
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
                      : "Great start!"}
                  </p>
                </div>
              </div>
              {/* Week activity dots */}
              <div className="flex items-center gap-0.5 sm:gap-1 m-2">
                {weekActivity.map((day, i) => (
                  <div key={i} className="flex flex-col items-center gap-0.5">
                    <div
                      className={cn(
                        "w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[9px] font-black border",
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

            {/* Right: sparkline chart — hidden on small screens */}
            <div className="hidden sm:flex flex-1 min-w-0 mx-4 flex-col border-l border-white/20 pl-4 max-w-[700px] justify-end">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Score trend</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-semibold text-white/40">{weekRangeLabel}</span>
                  <span className="text-[10px] font-bold text-white/70 flex items-center gap-0.5">
                    Progress <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
              {scoreHistory.filter(Boolean).length >= 2 ? (
                <>
                  <SparklineChart data={scoreHistory} stroke="white" className="w-full h-14 flex-1" />
                  <div className="flex justify-between mt-1.5">
                    {weekActivity.map((day, i) => (
                      <span key={i} className="text-[12px] font-bold text-white/30">{day.label}</span>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center gap-1.5 py-2">
                  <span className="text-xl">📈</span>
                  <span className="text-[9px] text-white/40 text-center leading-tight">
                    Practice more<br />to see trends
                  </span>
                </div>
              )}
            </div>

          </div>
        </Link>
      ) : (
        /* Zero-streak state */
        <div className="glass-card relative rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
          <div className="pointer-events-none absolute -right-4 -top-4 w-28 h-28 rounded-full bg-primary/5" />
          <div className="relative z-10 p-5">
            <div className="flex items-center gap-4 mb-4">
              <span className="text-3xl">🌱</span>
              <div>
                <h2 className="font-bold text-secondary text-base">
                  {completed.length > 0 ? "Keep your streak going" : "Start your streak today"}
                </h2>
                <p className="text-neutral-500 text-xs mt-0.5">Practice daily to build interview confidence.</p>
              </div>
            </div>
            <Link
              href="/app/practice"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.98] mb-4"
              style={{ background: "#2dec29", color: "#112715" }}
            >
              <PlayCircle className="w-4 h-4" />
              {completed.length > 0 ? "Continue practicing" : "Begin your first session"}
            </Link>
          </div>

          <Link href="/app/progress" className="block border-t border-neutral-100">
            <div className="grid grid-cols-2 divide-x divide-neutral-100 px-2 py-3">
              <div className="flex flex-col items-center gap-0.5 px-3">
                <span className="text-lg font-black text-secondary tabular-nums leading-none">{completed.length}</span>
                <span className="text-[10px] font-semibold text-neutral-400 mt-0.5">Sessions</span>
              </div>
              <div className="flex flex-col items-center gap-0.5 px-3">
                <span className="text-lg font-black text-secondary tabular-nums leading-none">
                  {avgScore !== null ? `${avgScore}%` : "—"}
                </span>
                <span className="text-[10px] font-semibold text-neutral-400 mt-0.5">Avg score</span>
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 6 ▸ ACTION CARDS — AI + Peer                                         */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}


      <div className="grid gap-3" style={{ gridTemplateColumns: "3fr 2fr" }}>
        {/* ── AI Practice card */}
        <Link
          href="/app/practice"
          className="group relative rounded-2xl overflow-hidden flex flex-col justify-between p-7 transition-all duration-300 hover:scale-[1.005] hover:shadow-2xl"
          style={{
            background: "linear-gradient(160deg, #071a09 0%, #112914 50%, #0a2010 100%)",
            minHeight: "288px",
          }}
        >
          {/* ── Glows */}
          <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-[0.08]" style={{ background: "#2dec29" }} />
          <div className="pointer-events-none absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-[0.07]" style={{ background: "#2dec29" }} />

          {/* ── Avatar — right side, full bleed */}
          <div className="absolute inset-y-0 right-0 w-[48%] pointer-events-none select-none">
            {/* mix-blend-mode:multiply on dark bg makes white pixels invisible */}
            <img
              src="/image.png"
              alt="AI Coach"
              className="absolute inset-0 w-full h-full object-cover object-top"
              style={{
                mixBlendMode: "multiply",
                filter: "contrast(1.05) brightness(1.5)",
              }}
            />
          </div>

          {/* ── Top: badge + headline */}
          <div className="relative z-10 flex flex-col gap-3 max-w-[56%]">
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
              style={{ background: "#2dec2914", border: "1px solid #2dec2935" }}
            >
              <Sparkles className="w-3 h-3" style={{ color: "#2dec29" }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2dec29" }}>
                AI Coach · 24/7
              </span>
            </div>

            <h3 className="text-white font-extrabold leading-[1.1]" style={{ fontSize: "2rem" }}>
              Practice<br />Now
            </h3>
            <p className="text-white/45 text-sm leading-relaxed mb-4">
              No scheduling needed
            </p>
          </div>

          {/* ── Bottom: features + CTA */}
          <div className="relative z-10 flex flex-col gap-4 max-w-[56%]">
            <ul className="flex flex-col gap-1.5">
              {[
                "Instant AI feedback",
                "R-STAR framework",
              ].map((feat) => (
                <li key={feat} className="flex items-center gap-2">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                    <circle cx="6" cy="6" r="5.5" stroke="#2dec29" strokeOpacity="0.4"/>
                    <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="#2dec29" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-white/55 text-xs">{feat}</span>
                </li>
              ))}
            </ul>

            <button
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold w-fit transition-all duration-200 group-hover:brightness-110 group-hover:gap-3"
              style={{ background: "#2dec29", color: "#071a09" }}
            >
              Start session
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </Link>

        {/* ── Feedback card */}
        <FeedbackCard />

      </div>

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
            {posts.slice(0, 3).map((post) => (
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

      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {/* 8 ▸ QUICK LINKS ROW                                                   */}
      {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/app/progress"
          className="glass-card group flex items-center gap-3 rounded-2xl px-4 py-3.5 hover:shadow-sm transition-shadow"
        >
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: "#2dec2915" }}
          >
            <Zap className="w-4 h-4" style={{ color: "#2dec29" }} />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-secondary text-sm truncate">Progress</p>
            <p className="text-[12px] text-neutral-400 truncate">
              {completed.length > 0
                ? `${completed.length} sessions done`
                : "Track your growth"}
            </p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>

        <Link
          href="/app/settings"
          className="glass-card group flex items-center gap-3 rounded-2xl px-4 py-3.5 hover:shadow-sm transition-shadow"
        >
          <div className="w-8 h-8 rounded-xl bg-neutral-100 flex items-center justify-center shrink-0">
            <User className="w-4 h-4 text-neutral-500" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-secondary text-sm truncate">Profile</p>
            <p className="text-[12px] text-neutral-400 truncate">Set your goals</p>
          </div>
          <ChevronRight className="w-3.5 h-3.5 text-neutral-300 ml-auto shrink-0 transition-transform duration-200 group-hover:translate-x-0.5" />
        </Link>
      </div>

    </div>
  );
}
