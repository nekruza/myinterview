"use client";

import { FC, useEffect, useState, use } from "react";
import Link from "next/link";
import { TECH_ROLES } from "@/lib/practice-data";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calendar,
  CalendarPlus,
  Check,
  Clock,
  ExternalLink,
  Hourglass,
  Loader2,
  Lock,
  MessageSquare,
  Star,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";

/* ─── types ─── */

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  experience_level?: string | null;
}

interface Participant {
  user_id: string;
  joined_at: string;
  status: "pending" | "accepted" | "rejected";
  profile: Profile;
}

interface PeerSession {
  id: string;
  host_id: string;
  title: string;
  scheduled_at: string;
  duration_minutes: number;
  meeting_link: string;
  type: string;
  status: string;
  notes: string | null;
  max_participants: number;
  is_featured: boolean;
  created_at: string;
  developer_type: string | null;
  interview_type: string | null;
  host: Profile;
  participants: Participant[];
}


/* ─── helpers ─── */

function getInitials(name: string | null, fallback?: string): string {
  if (name) {
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }
  return (fallback ?? "?").slice(0, 2).toUpperCase();
}

function getAvatarColor(id: string): string {
  const colors = [
    "#2dec29",
    "#8b5cf6",
    "#f59e0b",
    "#ec4899",
    "#06b6d4",
    "#f97316",
    "#14b8a6",
    "#6366f1",
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function formatFullDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = d.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const monthAbbr = d.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const monthFull = d.toLocaleDateString("en-US", { month: "long" });
  const dayNumber = d.getDate();
  const weekdayFull = d.toLocaleDateString("en-US", { weekday: "long" });
  const timeString = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  let relativeString: string;
  if (diffDays < 0) {
    relativeString = "This session has passed";
  } else if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) relativeString = "Starting now";
    else if (diffHours === 1) relativeString = "In 1 hour";
    else relativeString = `In ${diffHours} hours`;
  } else if (diffDays === 1) {
    relativeString = "Tomorrow";
  } else if (diffDays < 7) {
    relativeString = `In ${diffDays} days`;
  } else {
    relativeString = `In ${Math.floor(diffDays / 7)} week${diffDays >= 14 ? "s" : ""}`;
  }

  return { monthAbbr, monthFull, dayNumber, weekdayFull, timeString, relativeString };
}

function buildGoogleCalendarUrl(session: PeerSession): string {
  const start = new Date(session.scheduled_at);
  const end = new Date(start.getTime() + session.duration_minutes * 60000);
  const fmt = (d: Date) =>
    d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  return (
    `https://calendar.google.com/calendar/render?action=TEMPLATE` +
    `&text=${encodeURIComponent(session.title)}` +
    `&dates=${fmt(start)}/${fmt(end)}` +
    `&details=${encodeURIComponent("Peer practice session via MyInterview")}`
  );
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

/* ─── avatar component ─── */

const UserAvatar: FC<{
  profile: Profile | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}> = ({ profile, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
    xl: "w-14 h-14 text-lg",
  };

  if (profile?.avatar_url) {
    return (
      <img
        src={profile.avatar_url}
        alt={profile.full_name ?? "User"}
        className={`${sizeClasses[size]} rounded-full object-cover ring-2 ring-white ${className}`}
      />
    );
  }

  const color = getAvatarColor(profile?.id ?? "unknown");
  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold ring-2 ring-white shrink-0 ${className}`}
      style={{ background: color, color: "#fff" }}
    >
      {getInitials(profile?.full_name ?? null)}
    </div>
  );
};

/* ─── hero illustration ─── */

const HeroIllustration: FC = () => (
  <svg
    viewBox="0 0 280 220"
    fill="none"
    className="w-full h-full"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Video call window */}
    <rect x="40" y="20" width="200" height="140" rx="16" fill="rgba(45,236,41,0.08)" stroke="rgba(45,236,41,0.2)" strokeWidth="1.5" />
    <rect x="40" y="20" width="200" height="28" rx="16" fill="rgba(45,236,41,0.12)" />
    <circle cx="58" cy="34" r="5" fill="#ef4444" opacity="0.7" />
    <circle cx="74" cy="34" r="5" fill="#f59e0b" opacity="0.7" />
    <circle cx="90" cy="34" r="5" fill="#2dec29" opacity="0.7" />

    {/* Person 1 - left */}
    <rect x="55" y="60" width="80" height="85" rx="10" fill="rgba(45,236,41,0.06)" stroke="rgba(45,236,41,0.15)" strokeWidth="1" />
    <circle cx="95" cy="88" r="16" fill="#8b5cf6" opacity="0.8" />
    <text x="95" y="93" textAnchor="middle" fill="white" fontSize="12" fontWeight="bold">A</text>
    <rect x="75" y="112" width="40" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="82" y="120" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />

    {/* Person 2 - right */}
    <rect x="145" y="60" width="80" height="85" rx="10" fill="rgba(45,236,41,0.06)" stroke="rgba(45,236,41,0.15)" strokeWidth="1" />
    <circle cx="185" cy="88" r="16" fill="#2dec29" opacity="0.8" />
    <text x="185" y="93" textAnchor="middle" fill="#112715" fontSize="12" fontWeight="bold">B</text>
    <rect x="165" y="112" width="40" height="4" rx="2" fill="rgba(255,255,255,0.2)" />
    <rect x="172" y="120" width="26" height="3" rx="1.5" fill="rgba(255,255,255,0.1)" />

    {/* Speech bubble left */}
    <rect x="2" y="55" width="44" height="26" rx="8" fill="rgba(45,236,41,0.15)" stroke="rgba(45,236,41,0.3)" strokeWidth="1" />
    <rect x="10" y="63" width="28" height="3" rx="1.5" fill="rgba(45,236,41,0.4)" />
    <rect x="10" y="70" width="18" height="3" rx="1.5" fill="rgba(45,236,41,0.25)" />
    <polygon points="42,75 46,81 38,75" fill="rgba(45,236,41,0.15)" />

    {/* Speech bubble right */}
    <rect x="234" y="70" width="44" height="26" rx="8" fill="rgba(139,92,246,0.15)" stroke="rgba(139,92,246,0.3)" strokeWidth="1" />
    <rect x="242" y="78" width="28" height="3" rx="1.5" fill="rgba(139,92,246,0.4)" />
    <rect x="242" y="85" width="18" height="3" rx="1.5" fill="rgba(139,92,246,0.25)" />
    <polygon points="238,90 234,96 242,90" fill="rgba(139,92,246,0.15)" />

    {/* Connection dots */}
    <circle cx="140" cy="92" r="3" fill="#2dec29" opacity="0.6">
      <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
    </circle>
    <circle cx="140" cy="82" r="2" fill="#2dec29" opacity="0.4">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="0.5s" repeatCount="indefinite" />
    </circle>
    <circle cx="140" cy="102" r="2" fill="#2dec29" opacity="0.4">
      <animate attributeName="opacity" values="0.2;0.6;0.2" dur="2s" begin="1s" repeatCount="indefinite" />
    </circle>

    {/* Floating elements */}
    <circle cx="25" cy="170" r="8" fill="rgba(45,236,41,0.1)" stroke="rgba(45,236,41,0.2)" strokeWidth="1">
      <animate attributeName="cy" values="170;164;170" dur="3s" repeatCount="indefinite" />
    </circle>
    <text x="25" y="173" textAnchor="middle" fontSize="8" fill="rgba(45,236,41,0.5)">R</text>

    <circle cx="255" cy="175" r="8" fill="rgba(45,236,41,0.1)" stroke="rgba(45,236,41,0.2)" strokeWidth="1">
      <animate attributeName="cy" values="175;169;175" dur="3.5s" repeatCount="indefinite" />
    </circle>
    <text x="255" y="178" textAnchor="middle" fontSize="8" fill="rgba(45,236,41,0.5)">S</text>

    {/* Star badge */}
    <rect x="100" y="170" width="80" height="24" rx="12" fill="rgba(45,236,41,0.15)" stroke="rgba(45,236,41,0.3)" strokeWidth="1" />
    <text x="140" y="186" textAnchor="middle" fontSize="9" fill="rgba(45,236,41,0.8)" fontWeight="600">R-STAR Method</text>

    {/* Sparkle effects */}
    <path d="M60 180 L62 175 L64 180 L62 185Z" fill="rgba(45,236,41,0.3)">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="2.5s" repeatCount="indefinite" />
    </path>
    <path d="M220 165 L222 160 L224 165 L222 170Z" fill="rgba(45,236,41,0.3)">
      <animate attributeName="opacity" values="0.1;0.5;0.1" dur="3s" begin="1s" repeatCount="indefinite" />
    </path>
  </svg>
);

/* ─── practice tips illustration ─── */

const PracticeTipsBanner: FC = () => (
  <div
    className="relative rounded-2xl overflow-hidden p-5 sm:p-6"
    style={{ background: "linear-gradient(135deg, #f4fdf3 0%, #e3f5e6 100%)" }}
  >
    <div className="flex items-center gap-4 sm:gap-6">
      {/* Mini illustration */}
      <div className="shrink-0 hidden sm:block">
        <svg viewBox="0 0 80 80" fill="none" className="w-16 h-16" xmlns="http://www.w3.org/2000/svg">
          <circle cx="40" cy="40" r="36" fill="rgba(45,236,41,0.1)" stroke="rgba(45,236,41,0.2)" strokeWidth="1" />
          <circle cx="28" cy="34" r="10" fill="#2dec29" opacity="0.3" />
          <circle cx="28" cy="34" r="6" fill="#2dec29" opacity="0.6" />
          <text x="28" y="37" textAnchor="middle" fill="#112715" fontSize="7" fontWeight="bold">1</text>
          <circle cx="52" cy="34" r="10" fill="#8b5cf6" opacity="0.3" />
          <circle cx="52" cy="34" r="6" fill="#8b5cf6" opacity="0.6" />
          <text x="52" y="37" textAnchor="middle" fill="white" fontSize="7" fontWeight="bold">2</text>
          <path d="M34 46 Q40 54 46 46" stroke="rgba(45,236,41,0.4)" strokeWidth="2" fill="none" strokeLinecap="round" />
          <circle cx="40" cy="58" r="4" fill="rgba(45,236,41,0.3)" />
          <text x="40" y="60" textAnchor="middle" fill="#112715" fontSize="5" fontWeight="bold">AI</text>
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-bold text-secondary text-sm mb-1">
          Tips for a great session
        </h3>
        <div className="grid sm:grid-cols-3 gap-2 text-xs text-neutral-600">
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5" style={{ background: "#2dec29", color: "#112715" }}>1</span>
            <span>Use the <strong>STAR method</strong> to structure your answers</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5" style={{ background: "#2dec29", color: "#112715" }}>2</span>
            <span>Give <strong>honest feedback</strong> — it helps both of you grow</span>
          </div>
          <div className="flex items-start gap-1.5">
            <span className="shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold mt-0.5" style={{ background: "#2dec29", color: "#112715" }}>3</span>
            <span>Take turns as <strong>interviewer &amp; interviewee</strong></span>
          </div>
        </div>
      </div>
    </div>
  </div>
);

/* ─── loading skeleton ─── */

const DetailSkeleton: FC = () => (
  <div className="space-y-6 animate-pulse">
    <div className="h-56 rounded-2xl" style={{ background: "#112715" }} />
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <div className="glass-card rounded-2xl p-6">
          <div className="h-5 w-40 bg-neutral-100 rounded-lg mb-4" />
          <div className="space-y-2">
            <div className="h-3 w-full bg-neutral-100 rounded" />
            <div className="h-3 w-3/4 bg-neutral-100 rounded" />
          </div>
        </div>
        <div className="glass-card rounded-2xl p-6">
          <div className="h-5 w-36 bg-neutral-100 rounded-lg mb-4" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-9 h-9 rounded-full bg-neutral-100" />
              <div className="h-3 w-28 bg-neutral-100 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="space-y-4">
        <div className="glass-card rounded-2xl p-6 h-32" />
        <div className="glass-card rounded-2xl p-6 h-24" />
        <div className="h-12 bg-neutral-100 rounded-xl" />
      </div>
    </div>
  </div>
);

/* ─── not found state ─── */

const NotFoundState: FC = () => (
  <div className="text-center py-20">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
      style={{ background: "#f4fdf3" }}
    >
      <Users className="w-8 h-8 text-neutral-300" />
    </div>
    <h2 className="font-bold text-secondary text-xl mb-2">Session not found</h2>
    <p className="text-neutral-500 text-sm mb-6">
      This session may have ended or the link is no longer valid.
    </p>
    <Link
      href="/app/peer-practice"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
      style={{ background: "#2dec29", color: "#112715" }}
    >
      Browse open sessions
    </Link>
  </div>
);

/* ─── main page ─── */

export default function PeerSessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  const [session, setSession] = useState<PeerSession | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [joining, setJoining] = useState(false);
  const [responding, setResponding] = useState<string | null>(null); // user_id being responded to

  async function fetchSession() {
    try {
      const res = await fetch(`/api/peer-sessions/${id}`);
      if (res.status === 404) {
        setNotFound(true);
        return;
      }
      const data = await res.json();
      setSession(data.session);
      setUserId(data.userId ?? "");
    } catch {
      toast.error("Failed to load session");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function handleJoin() {
    if (!session) return;
    setJoining(true);
    try {
      const res = await fetch("/api/peer-sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send request");
      }
      toast.success("Join request sent! The host will review it.");
      fetchSession();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to send request");
    } finally {
      setJoining(false);
    }
  }

  async function handleRespond(targetUserId: string, action: "accept" | "reject") {
    if (!session) return;
    setResponding(targetUserId);
    try {
      const res = await fetch("/api/peer-sessions/join/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          user_id: targetUserId,
          action,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || `Failed to ${action}`);
      }
      toast.success(action === "accept" ? "Request accepted!" : "Request declined.");
      fetchSession();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : `Failed to ${action}`);
    } finally {
      setResponding(null);
    }
  }

  async function handleLeave() {
    if (!session) return;
    try {
      const res = await fetch("/api/peer-sessions/join", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: session.id }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to leave");
      }
      toast.success("You've left the session.");
      fetchSession();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to leave session");
    }
  }

  if (loading) return <DetailSkeleton />;
  if (notFound || !session) return <NotFoundState />;

  const isHost = session.host_id === userId;
  const myParticipation = session.participants.find((p) => p.user_id === userId);
  const isPending = myParticipation?.status === "pending";
  const isAccepted = myParticipation?.status === "accepted";
  const acceptedParticipants = session.participants.filter((p) => p.status === "accepted");
  const pendingParticipants = session.participants.filter((p) => p.status === "pending");
  const spotsTaken = acceptedParticipants.length + 1; // +1 for host
  const spotsFree = session.max_participants - spotsTaken;
  const isFull = spotsFree <= 0;
  const dateInfo = formatFullDate(session.scheduled_at);
  const calendarUrl = buildGoogleCalendarUrl(session);
  const fillPct = Math.min(100, (spotsTaken / session.max_participants) * 100);

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Link
        href="/app/peer-practice"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-secondary transition group"
      >
        <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
        All sessions
      </Link>

      {/* ───────── Hero Header ───────── */}
      <div
        className="relative rounded-2xl overflow-hidden animate-fade-in"
        style={{ background: "#112715" }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 animate-blob"
          style={{ background: "#2dec29", filter: "blur(80px)" }}
        />
        <div
          className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full opacity-15 animate-blob-delay-2"
          style={{ background: "#48e57c", filter: "blur(60px)" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full opacity-5"
          style={{ background: "#2dec29", filter: "blur(120px)" }}
        />

        {/* Content */}
        <div className="relative z-10 p-8 sm:p-10 flex items-center gap-6">
          {/* Left: text content */}
          <div className="flex-1 min-w-0">
            {/* Badges */}
            <div className="flex flex-wrap items-center gap-2 mb-5">
              {session.is_featured && (
                <span
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  Weekly Group Session
                </span>
              )}
              <span
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border"
                style={{ borderColor: "rgba(45,236,41,0.3)", color: "rgba(45,236,41,0.9)" }}
              >
                <Video className="w-3 h-3" />
                Live Video Practice
              </span>
              {session.interview_type && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                  session.interview_type === "behavioral"
                    ? "bg-blue-500/20 text-blue-200 border-blue-400/30"
                    : "bg-amber-500/20 text-amber-200 border-amber-400/30"
                }`}>
                  {session.interview_type === "behavioral" ? "Behavioral" : "Technical"}
                </span>
              )}
              {session.developer_type && (() => {
                const dt = TECH_ROLES.find((d) => d.value === session.developer_type);
                const label = dt ? dt.label : session.developer_type;
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-violet-500/20 text-violet-200 border border-violet-400/30">
                    {label}
                  </span>
                );
              })()}
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white leading-tight mb-4 max-w-2xl">
              {session.title}
            </h1>

            {/* Quick info row */}
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/60">
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" style={{ color: "#2dec29" }} />
                {dateInfo.weekdayFull}, {dateInfo.monthFull} {dateInfo.dayNumber}
                {" "}
                <span className="text-white/40">at</span> {dateInfo.timeString}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" style={{ color: "#2dec29" }} />
                {session.duration_minutes} min
              </span>
              <span className="flex items-center gap-1.5">
                <Users className="w-4 h-4" style={{ color: "#2dec29" }} />
                {isFull ? (
                  <span className="text-amber-400">Full</span>
                ) : (
                  <>{spotsFree} spot{spotsFree !== 1 ? "s" : ""} left</>
                )}
              </span>
            </div>
          </div>

          {/* Right: illustration */}
          <div className="hidden lg:block w-64 shrink-0 opacity-90">
            <HeroIllustration />
          </div>
        </div>
      </div>

      {/* ───────── Body: 2-column layout ───────── */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-4">
          {/* About */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up">
            <h2 className="font-bold text-secondary text-lg mb-3">About this session</h2>
            {session.notes ? (
              <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line">
                {session.notes}
              </p>
            ) : (
              <p className="text-neutral-400 text-sm italic">
                No description provided by the host.
              </p>
            )}

            {/* Metadata chips */}
            <div className="flex flex-wrap gap-2 mt-5">
              {[
                { icon: Clock, label: `${session.duration_minutes} min session` },
                { icon: Video, label: "Video call" },
              ].map(({ icon: Icon, label }) => (
                <span
                  key={label}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium"
                  style={{ background: "#f4fdf3", color: "#112715" }}
                >
                  <Icon className="w-3.5 h-3.5" style={{ color: "#2dec29" }} />
                  {label}
                </span>
              ))}
              {session.interview_type && (
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
                  session.interview_type === "behavioral"
                    ? "bg-blue-50 text-blue-700"
                    : "bg-amber-50 text-amber-700"
                }`}>
                  {session.interview_type === "behavioral" ? "Behavioral" : "Technical"}
                </span>
              )}
              {session.developer_type && (() => {
                const dt = TECH_ROLES.find((d) => d.value === session.developer_type);
                const label = dt ? dt.label : session.developer_type;
                return (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-violet-50 text-violet-700">
                    {label}
                  </span>
                );
              })()}
            </div>
          </div>

          {/* Practice tips */}
          <PracticeTipsBanner />

          {/* Attendees */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-secondary text-lg">
                Who&apos;s attending
                <span className="text-neutral-400 font-normal text-sm ml-2">
                  {spotsTaken}/{session.max_participants}
                </span>
              </h2>
              {/* Capacity bar */}
              <div className="h-2 w-28 rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${fillPct}%`,
                    background: isFull ? "#f59e0b" : "#2dec29",
                  }}
                />
              </div>
            </div>

            {/* Host row */}
            <div className="flex items-center gap-3 py-3.5 border-b border-neutral-50">
              <UserAvatar profile={session.host} size="md" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-secondary text-sm">
                  {session.host?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-neutral-400 capitalize mt-0.5">
                  {session.host?.experience_level
                    ? `${session.host.experience_level} level`
                    : "Engineer"}
                </p>
              </div>
              <span
                className="text-[10px] px-2.5 py-1 rounded-full font-bold uppercase tracking-wide"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                Host
              </span>
            </div>

            {/* Accepted participant rows */}
            {acceptedParticipants.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 py-3.5 border-b border-neutral-50 last:border-0"
              >
                <UserAvatar profile={p.profile} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary text-sm">
                    {p.profile?.full_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Joined {formatRelativeTime(p.joined_at)}
                  </p>
                </div>
                <span
                  className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: "#f4fdf3", color: "#2dec29" }}
                >
                  <UserCheck className="w-3 h-3 inline mr-0.5" />
                  Joined
                </span>
              </div>
            ))}

            {/* Pending participant rows (visible to host) */}
            {isHost && pendingParticipants.map((p) => (
              <div
                key={p.user_id}
                className="flex items-center gap-3 py-3.5 border-b border-neutral-50 last:border-0"
                style={{ background: "#fffbeb" }}
              >
                <UserAvatar profile={p.profile} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-secondary text-sm">
                    {p.profile?.full_name || "Anonymous"}
                  </p>
                  <p className="text-xs text-amber-500 mt-0.5">
                    Pending request
                  </p>
                </div>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-600">
                  <Hourglass className="w-3 h-3 inline mr-0.5" />
                  Pending
                </span>
              </div>
            ))}

            {/* Empty spot placeholders */}
            {Array.from({ length: Math.max(0, spotsFree) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex items-center gap-3 py-3.5 border-b border-neutral-50 last:border-0"
              >
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-neutral-200 flex items-center justify-center shrink-0">
                  <UserPlus className="w-4 h-4 text-neutral-300" />
                </div>
                <span className="text-sm text-neutral-300 italic">Open spot</span>
              </div>
            ))}
          </div>
        </div>

        {/* ───────── Right column (sticky) ───────── */}
        <div className="space-y-4 lg:sticky lg:top-8 lg:self-start">
          {/* Date/time card */}
          <div className="glass-card rounded-2xl p-6 animate-slide-up">
            <div className="flex items-start gap-4">
              {/* Mini calendar block */}
              <div className="rounded-xl overflow-hidden border border-neutral-100 shrink-0 w-14 text-center shadow-sm">
                <div
                  className="py-1 text-[10px] font-bold uppercase tracking-wider"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {dateInfo.monthAbbr}
                </div>
                <div className="py-2.5 text-2xl font-bold text-secondary leading-none">
                  {dateInfo.dayNumber}
                </div>
              </div>
              <div>
                <p className="font-semibold text-secondary text-sm">
                  {dateInfo.weekdayFull}, {dateInfo.monthFull} {dateInfo.dayNumber}
                </p>
                <p className="text-sm text-neutral-500 mt-0.5">
                  {dateInfo.timeString} · {session.duration_minutes} min
                </p>
                <p className="text-xs text-neutral-400 mt-1">{dateInfo.relativeString}</p>
              </div>
            </div>

            {/* Add to calendar */}
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 flex items-center gap-1.5 text-xs font-medium transition hover:opacity-70"
              style={{ color: "#112715" }}
            >
              <CalendarPlus className="w-3.5 h-3.5" style={{ color: "#2dec29" }} />
              Add to Google Calendar
            </a>
          </div>

          {/* Host card */}
          <div className="glass-card relative rounded-2xl p-6 overflow-hidden">
            {/* Subtle decorative corner */}
            <div
              className="absolute -top-6 -right-6 w-20 h-20 rounded-full opacity-[0.07]"
              style={{ background: "#2dec29" }}
            />
            <h3 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3 relative">
              Hosted by
            </h3>
            <div className="flex items-center gap-3 relative">
              <UserAvatar profile={session.host} size="lg" />
              <div>
                <p className="font-bold text-secondary">
                  {session.host?.full_name || "Anonymous"}
                </p>
                <p className="text-xs text-neutral-500 capitalize mt-0.5">
                  {session.host?.experience_level
                    ? `${session.host.experience_level} engineer`
                    : "Engineer"}
                </p>
              </div>
            </div>
          </div>

          {/* Host: Pending requests panel */}
          {isHost && pendingParticipants.length > 0 && (
            <div className="glass-card rounded-2xl border border-amber-300/50 p-5 animate-slide-up">
              <h3 className="text-sm font-bold text-secondary mb-3 flex items-center gap-2">
                <Hourglass className="w-4 h-4 text-amber-500" />
                Pending Requests
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-600 font-bold">
                  {pendingParticipants.length}
                </span>
              </h3>
              <div className="space-y-3">
                {pendingParticipants.map((p) => (
                  <div
                    key={p.user_id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-neutral-50"
                  >
                    <UserAvatar profile={p.profile} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-secondary text-sm truncate">
                        {p.profile?.full_name || "Anonymous"}
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleRespond(p.user_id, "accept")}
                        disabled={responding === p.user_id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all duration-100 shadow-[3px_3px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-0.5 active:shadow-[1px_1px_0px_0px_#1A1A1A] disabled:opacity-50 disabled:shadow-none disabled:translate-y-0"
                        style={{ background: "#2dec29", color: "#112715" }}
                      >
                        {responding === p.user_id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <Check className="w-3 h-3" />
                        )}
                        Accept
                      </button>
                      <button
                        onClick={() => handleRespond(p.user_id, "reject")}
                        disabled={responding === p.user_id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold border border-neutral-200 text-neutral-500 hover:bg-neutral-100 transition disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="space-y-2">
            {isHost ? (
              <>
                <a
                  href={session.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  <Video className="w-4 h-4" />
                  Open Your Meeting Room
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <p className="text-center text-xs text-neutral-400">
                  You&apos;re the host of this session
                </p>
              </>
            ) : isAccepted ? (
              <>
                <a
                  href={session.meeting_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  <Video className="w-4 h-4" />
                  Join the Meeting
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
                <button
                  onClick={handleLeave}
                  className="w-full py-2.5 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition"
                >
                  Leave this session
                </button>
              </>
            ) : isPending ? (
              <>
                <button
                  disabled
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl font-semibold text-sm cursor-not-allowed"
                  style={{ background: "#fef3c7", color: "#92400e" }}
                >
                  <Hourglass className="w-4 h-4" />
                  Request Pending
                </button>
                <button
                  onClick={handleLeave}
                  className="w-full py-2.5 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition"
                >
                  Cancel request
                </button>
                <p className="text-center text-xs text-neutral-400">
                  Waiting for the host to accept your request
                </p>
              </>
            ) : isFull ? (
              <>
                <button
                  disabled
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-xl font-semibold text-sm bg-neutral-100 text-neutral-400 cursor-not-allowed"
                >
                  <Lock className="w-4 h-4" />
                  Session Full
                </button>
                <p className="text-center text-xs text-neutral-400">
                  Check back — spots may open up
                </p>
              </>
            ) : (
              <>
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="flex items-center justify-center gap-2 w-full px-5 py-3.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {joining ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <UserPlus className="w-4 h-4" />
                  )}
                  {joining ? "Sending request..." : "Request to Join"}
                </button>
                <p className="text-center text-xs text-neutral-400">
                  Free · The host will review your request
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
