"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Users,
  Plus,
  Calendar,
  Clock,
  Video,
  ExternalLink,
  Star,
  UserPlus,
  Hourglass,
  Loader2,
  Sparkles,
  LinkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TECH_ROLES } from "@/lib/practice-data";
import { UpgradeModal } from "@/components/UpgradeModal";
import { usePeerSessions, useJoinPeerSession, useLeavePeerSession, useCreatePeerSession } from "@/lib/queries/peer-sessions";
import { useProfile } from "@/lib/queries/profile";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";

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

function formatSessionDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  const timeStr = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (diffDays === 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    if (diffHours <= 0) return `Starting now · ${timeStr}`;
    if (diffHours === 1) return `In 1 hour · ${timeStr}`;
    return `In ${diffHours} hours · ${timeStr}`;
  }
  if (diffDays === 1) return `Tomorrow · ${timeStr}`;
  if (diffDays < 7) {
    const dayName = date.toLocaleDateString("en-US", { weekday: "long" });
    return `${dayName} · ${timeStr}`;
  }
  const dateFormatted = date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  return `${dateFormatted} · ${timeStr}`;
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

/* ─── avatar component ─── */

const UserAvatar: FC<{
  profile: Profile | null;
  size?: "sm" | "md" | "lg";
  className?: string;
}> = ({ profile, size = "md", className = "" }) => {
  const sizeClasses = {
    sm: "w-7 h-7 text-[10px]",
    md: "w-9 h-9 text-xs",
    lg: "w-11 h-11 text-sm",
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

/* ─── session card ─── */

const SessionCard: FC<{
  session: PeerSession;
  userId: string;
  onJoin: (sessionId: string) => Promise<void>;
  onLeave: (sessionId: string) => Promise<void>;
  joiningId: string | null;
}> = ({ session, userId, onJoin, onLeave, joiningId }) => {
  const isHost = session.host_id === userId;
  const myParticipation = session.participants.find((p) => p.user_id === userId);
  const isPending = myParticipation?.status === "pending";
  const isAccepted = myParticipation?.status === "accepted";
  const acceptedParticipants = session.participants.filter((p) => p.status === "accepted");
  const spotsTotal = session.max_participants;
  const spotsTaken = acceptedParticipants.length + 1; // +1 for host
  const spotsFree = spotsTotal - spotsTaken;
  const isFull = spotsFree <= 0;
  const isJoining = joiningId === session.id;

  return (
    <div
      className={`glass-card relative rounded-2xl hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer ${
        session.is_featured
          ? "border-primary/30 ring-1 ring-primary/10"
          : "border-neutral-100 hover:border-neutral-200"
      }`}
    >
      {/* Featured badge */}
      {session.is_featured && (
        <div
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold"
          style={{ background: "#112715", color: "#2dec29" }}
        >
          <Star className="w-3.5 h-3.5 fill-current" />
          Weekly Group Session — Hosted by MyInterview
        </div>
      )}

      <div className="p-5">
        {/* Header: title + status */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-secondary text-[15px] leading-snug truncate">
              {session.title}
            </h3>
            <div className="flex items-center gap-3 mt-1.5 text-xs text-neutral-500">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatSessionDate(session.scheduled_at)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {session.duration_minutes} min
              </span>
            </div>
          </div>

          {/* Spots indicator */}
          <div className="shrink-0 text-right">
            {isFull ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-neutral-100 text-neutral-500">
                Full
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
                style={{ background: "#f4fdf3", color: "#112715" }}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: "#2dec29" }}
                />
                {spotsFree} spot{spotsFree !== 1 ? "s" : ""} left
              </span>
            )}
          </div>
        </div>

        {/* Type badges */}
        {(session.developer_type || session.interview_type) && (
          <div className="flex flex-wrap gap-1.5 mb-2">
            {session.interview_type && (
              <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
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
                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-violet-50 text-violet-700">
                  {label}
                </span>
              );
            })()}
          </div>
        )}

        {/* Notes / description */}
        {session.notes && (
          <p className="text-sm text-neutral-500 mb-4 line-clamp-2">
            {session.notes}
          </p>
        )}

        {/* Host + participants */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center gap-2">
            <UserAvatar profile={session.host} size="sm" />
            <div>
              <p className="text-xs font-semibold text-secondary leading-none">
                {session.host?.full_name || "Anonymous"}
              </p>
              <p className="text-[10px] text-neutral-400 mt-0.5">Host</p>
            </div>
          </div>

          {acceptedParticipants.length > 0 && (
            <>
              <div className="w-px h-6 bg-neutral-100" />
              <div className="flex items-center">
                <div className="flex -space-x-2">
                  {acceptedParticipants.slice(0, 5).map((p) => (
                    <UserAvatar
                      key={p.user_id}
                      profile={p.profile}
                      size="sm"
                    />
                  ))}
                </div>
                {acceptedParticipants.length > 5 && (
                  <span className="ml-1.5 text-xs text-neutral-400">
                    +{acceptedParticipants.length - 5}
                  </span>
                )}
                <span className="ml-2 text-xs text-neutral-400">
                  joined
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions — stopPropagation so clicks don't trigger parent Link */}
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {isHost ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(session.meeting_link, "_blank", "noopener,noreferrer"); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                <Video className="w-4 h-4" />
                Open Meeting
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <span className="text-xs text-neutral-400 ml-1">
                You&apos;re hosting
              </span>
            </>
          ) : isAccepted ? (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); window.open(session.meeting_link, "_blank", "noopener,noreferrer"); }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-2xl text-sm font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                <Video className="w-4 h-4" />
                Join Meeting
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onLeave(session.id); }}
                className="px-3 py-2.5 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition"
              >
                Leave
              </button>
            </>
          ) : isPending ? (
            <>
              <button
                disabled
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-not-allowed"
                style={{ background: "#fef3c7", color: "#92400e" }}
              >
                <Hourglass className="w-4 h-4" />
                Request Sent
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onLeave(session.id); }}
                className="px-3 py-2.5 rounded-xl text-xs font-medium border border-neutral-200 text-neutral-500 hover:bg-neutral-50 transition"
              >
                Cancel
              </button>
            </>
          ) : isFull ? (
            <button
              disabled
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-neutral-100 text-neutral-400 cursor-not-allowed"
            >
              Session Full
            </button>
          ) : (
            <button
              onClick={(e) => { e.stopPropagation(); onJoin(session.id); }}
              disabled={isJoining}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all hover:opacity-90 disabled:opacity-60"
              style={{ background: "#112715", color: "#fff" }}
            >
              {isJoining ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {isJoining ? "Sending…" : "Request to Join"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/* ─── create session dialog ─── */

const CreateSessionDialog: FC<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  createMutation: ReturnType<typeof useCreatePeerSession>;
}> = ({ open, onOpenChange, createMutation }) => {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState("45");
  const [meetingLink, setMeetingLink] = useState("");
  const [notes, setNotes] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("2");
  const [developerType, setDeveloperType] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [interviewType, setInterviewType] = useState("");
  const [linkError, setLinkError] = useState("");

  function validateMeetingLink(url: string): string {
    if (!url.trim()) return "";
    try {
      const raw = url.trim();
      const parsed = new URL(/^https?:\/\//i.test(raw) ? raw : "https://" + raw);
      const ALLOWED = [
        "zoom.us", "us02web.zoom.us", "us04web.zoom.us",
        "meet.google.com",
        "teams.microsoft.com", "teams.live.com",
        "whereby.com",
        "meet.jit.si",
        "webex.com",
      ];
      const host = parsed.hostname.toLowerCase();
      if (!ALLOWED.some((d) => host === d || host.endsWith("." + d))) {
        return "Please use Zoom, Google Meet, Microsoft Teams, Whereby, Jitsi, or Webex";
      }
      return "";
    } catch {
      return "Please enter a valid URL (e.g. https://meet.google.com/...)";
    }
  }

  function handleCreate() {
    const linkErr = validateMeetingLink(meetingLink);
    if (linkErr) { setLinkError(linkErr); return; }
    if (!title.trim() || !date || !time || !meetingLink.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    const scheduled_at = new Date(`${date}T${time}`).toISOString();
    const body = {
      title: title.trim(),
      scheduled_at,
      duration_minutes: parseInt(duration),
      meeting_link: meetingLink.trim(),
      type: "peer",
      notes: notes.trim() || null,
      max_participants: parseInt(maxParticipants),
      developer_type: developerType === "other" ? (customRole.trim() || null) : (developerType || null),
      interview_type: interviewType || null,
    };

    createMutation.mutate(body, {
      onSuccess: () => {
        toast.success("Session created!");
        onOpenChange(false);
        setTitle("");
        setDate("");
        setTime("");
        setMeetingLink("");
        setNotes("");
        setDuration("45");
        setMaxParticipants("2");
        setDeveloperType("");
        setCustomRole("");
        setInterviewType("");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to create session");
      },
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-secondary">
            Create a Practice Session
          </DialogTitle>
          <DialogDescription>
            Share your Zoom or Google Meet link so others can practice with you.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-2">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Session Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder='e.g. "Behavioral interview practice - STAR method"'
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Developer Type
            </label>
            <select
              value={developerType}
              onChange={(e) => setDeveloperType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary bg-neutral-50 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition appearance-none cursor-pointer"
            >
              <option value="">Any / Not specified</option>
              {TECH_ROLES.map((dt) => (
                <option key={dt.value} value={dt.value}>{dt.label}</option>
              ))}
            </select>
            {developerType === "other" && (
              <input
                type="text"
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="e.g. Game Developer, AR/VR Engineer..."
                className="mt-3 w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition"
              />
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Interview Type
            </label>
            <select
              value={interviewType}
              onChange={(e) => setInterviewType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary bg-neutral-50 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition appearance-none cursor-pointer"
            >
              <option value="">Any / Not specified</option>
              <option value="behavioral">Behavioral</option>
              <option value="technical">Technical</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                min={new Date().toISOString().split("T")[0]}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Time *
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Duration
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
                Max Participants
              </label>
              <select
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
              >
                <option value="2">2 people (1:1)</option>
                <option value="4">4 people</option>
                <option value="6">6 people</option>
                <option value="10">10 people</option>
                <option value="20">20 people</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Meeting Link *
            </label>
            <div className="relative">
              <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => {
                  setMeetingLink(e.target.value);
                  setLinkError(validateMeetingLink(e.target.value));
                }}
                onBlur={(e) => setLinkError(validateMeetingLink(e.target.value))}
                placeholder="https://meet.google.com/... or https://zoom.us/..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm text-secondary outline-none transition ${
                  linkError ? "border-red-400 focus:border-red-400" : "border-neutral-200 focus:border-primary"
                }`}
              />
            </div>
            {linkError && (
              <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                {linkError}
              </p>
            )}
            {!linkError && meetingLink && !validateMeetingLink(meetingLink) && (
              <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
                ✓ Valid meeting link
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What topics do you want to practice? Any specific framework?"
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition resize-none"
            />
          </div>

          <button
            onClick={handleCreate}
            disabled={createMutation.isPending}
            className="flex items-center justify-center gap-2 w-full px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
            style={{ background: "#2dec29", color: "#112715" }}
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            {createMutation.isPending ? "Creating…" : "Create Session"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

/* ─── empty state ─── */

const EmptyState: FC<{ onCreateClick: () => void }> = ({ onCreateClick }) => (
  <div className="text-center py-16">
    <div
      className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
      style={{ background: "#f4fdf3" }}
    >
      <Users className="w-8 h-8" style={{ color: "#2dec29" }} />
    </div>
    <h3 className="font-bold text-secondary text-lg mb-1">
      No sessions yet
    </h3>
    <p className="text-sm text-neutral-500 mb-6 max-w-sm mx-auto">
      Be the first to create a practice session. Share your meeting link and
      practice behavioral interviews with a peer.
    </p>
    <button
      onClick={onCreateClick}
      className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
      style={{ background: "#2dec29", color: "#112715" }}
    >
      <Plus className="w-4 h-4" />
      Create First Session
    </button>
  </div>
);

/* ─── main page ─── */

const PeerPracticePage: FC = () => <PeerPracticeContent />;

const PeerPracticeContent: FC = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "weekly">("all");
  const upgradeReason = "peer_limit" as const;
  const [showUpgrade, setShowUpgrade] = useState(false);

  const { data: sessionsData, isLoading: sessionsLoading } = usePeerSessions();
  const { data: profileData, isLoading: profileLoading } = useProfile();
  const joinMutation = useJoinPeerSession();
  const leaveMutation = useLeavePeerSession();
  const createMutation = useCreatePeerSession();
  const queryClient = useQueryClient();

  const loading = sessionsLoading || profileLoading;
  const sessions = sessionsData?.sessions ?? [];
  const userId = sessionsData?.userId ?? "";
  const plan = profileData?.plan ?? "free";
  const isAdmin = profileData?.isAdmin ?? false;
  const joinsUsed = profileData?.peer_sessions_joined ?? 0;

  async function handleJoin(sessionId: string) {
    if (plan === "free" && joinsUsed >= 3) {
      setShowUpgrade(true);
      return;
    }
    setJoiningId(sessionId);
    joinMutation.mutate(sessionId, {
      onSuccess: () => {
        toast.success("Join request sent! The host will review it.");
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      },
      onError: (err: unknown) => {
        const error = err as Error & { status?: number; data?: { error?: string } };
        if (error.status === 403 && error.data?.error === "limit_reached") {
          setShowUpgrade(true);
          return;
        }
        toast.error(error.message || "Failed to join session");
      },
      onSettled: () => setJoiningId(null),
    });
  }

  async function handleLeave(sessionId: string) {
    leaveMutation.mutate(sessionId, {
      onSuccess: () => {
        toast.success("You have left the session.");
      },
      onError: (err: unknown) => {
        toast.error(err instanceof Error ? err.message : "Failed to leave session");
      },
    });
  }

  const weeklySessions = sessions.filter((s) => s.is_featured);
  const communitySessions = sessions.filter((s) => !s.is_featured);
  const displaySessions =
    activeTab === "weekly" ? weeklySessions : sessions;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5" style={{ color: "#2dec29" }} />
            <h1 className="text-2xl font-bold text-secondary">
              Peer Practice
            </h1>
          </div>
          <p className="text-neutral-500 text-sm">
            Practice behavioral interviews with real people. Join a session or
            create your own.
          </p>
        </div>
        <button
          onClick={() => isAdmin ? setDialogOpen(true) : setComingSoonOpen(true)}
          className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm shrink-0 transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          <Plus className="w-4 h-4" />
          Create Session
        </button>
      </div>

      {/* How it works banner */}
      <div
        className="rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4"
        style={{ background: "#112715" }}
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4" style={{ color: "#2dec29" }} />
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "#2dec29" }}
            >
              How it works
            </span>
          </div>
          <p className="text-white/80 text-sm leading-relaxed">
            Create a session with your Zoom or Google Meet link, or join an
            existing one. For our weekly group sessions, we&apos;ll pair you into
            breakout rooms for structured practice.
          </p>
        </div>
        <div className="flex gap-6 shrink-0">
          {[
            { step: "1", label: "Browse or create" },
            { step: "2", label: "Join the meeting" },
            { step: "3", label: "Practice together" },
          ].map(({ step, label }) => (
            <div key={step} className="text-center">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold mx-auto mb-1"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                {step}
              </div>
              <p className="text-white/60 text-[11px] whitespace-nowrap">
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl w-fit">
        {(
          [
            { id: "all", label: "All Sessions", count: sessions.length },
            {
              id: "weekly",
              label: "Weekly Sessions",
              count: weeklySessions.length,
            },
          ] as const
        ).map(({ id, label, count }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={{
              background: activeTab === id ? "#fff" : "transparent",
              color: activeTab === id ? "#112715" : "#6b7280",
              boxShadow:
                activeTab === id
                  ? "0 1px 2px rgba(0,0,0,0.06)"
                  : "none",
            }}
          >
            {label}
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                background:
                  activeTab === id ? "#f4fdf3" : "transparent",
                color: activeTab === id ? "#112715" : "#9ca3af",
              }}
            >
              {count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="glass-card rounded-2xl p-5 animate-pulse"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="h-5 w-48 bg-neutral-100 rounded-lg mb-2" />
                  <div className="h-3 w-64 bg-neutral-100 rounded-lg" />
                </div>
                <div className="h-6 w-20 bg-neutral-100 rounded-full" />
              </div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-7 h-7 rounded-full bg-neutral-100" />
                <div className="h-3 w-24 bg-neutral-100 rounded" />
              </div>
              <div className="h-10 w-32 bg-neutral-100 rounded-xl" />
            </div>
          ))}
        </div>
      ) : displaySessions.length === 0 ? (
        <EmptyState onCreateClick={() => isAdmin ? setDialogOpen(true) : setComingSoonOpen(true)} />
      ) : (
        <div className="space-y-4">
          {/* Weekly sessions section (only on "all" tab) */}
          {activeTab === "all" && weeklySessions.length > 0 && (
            <div className="space-y-3">
              {weeklySessions.map((session) => (
                <Link key={session.id} href={`/app/peer-practice/${session.id}`} className="block">
                  <SessionCard
                    session={session}
                    userId={userId}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    joiningId={joiningId}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Community sessions */}
          {activeTab === "all" && communitySessions.length > 0 && (
            <div className="space-y-3">
              {weeklySessions.length > 0 && (
                <div className="flex items-center gap-2 mt-6 mb-1">
                  <h2 className="text-sm font-semibold text-secondary">
                    Community Sessions
                  </h2>
                  <div className="flex-1 h-px bg-neutral-100" />
                </div>
              )}
              {communitySessions.map((session) => (
                <Link key={session.id} href={`/app/peer-practice/${session.id}`} className="block">
                  <SessionCard
                    session={session}
                    userId={userId}
                    onJoin={handleJoin}
                    onLeave={handleLeave}
                    joiningId={joiningId}
                  />
                </Link>
              ))}
            </div>
          )}

          {/* Weekly tab content */}
          {activeTab === "weekly" &&
            weeklySessions.map((session) => (
              <Link key={session.id} href={`/app/peer-practice/${session.id}`} className="block">
                <SessionCard
                  session={session}
                  userId={userId}
                  onJoin={handleJoin}
                  onLeave={handleLeave}
                  joiningId={joiningId}
                />
              </Link>
            ))}
          {activeTab === "weekly" && weeklySessions.length === 0 && (
            <div className="text-center py-12">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
                style={{ background: "#f4fdf3" }}
              >
                <Star
                  className="w-6 h-6"
                  style={{ color: "#2dec29" }}
                />
              </div>
              <h3 className="font-bold text-secondary mb-1">
                No weekly sessions scheduled
              </h3>
              <p className="text-sm text-neutral-500">
                Check back soon — we organize weekly group practice sessions.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Free tier join usage */}
      {plan === "free" && (
        <p className="text-xs text-neutral-400 text-center">
          {joinsUsed >= 3 ? (
            <span className="text-amber-600 font-medium">Free join limit reached — upgrade for unlimited peer sessions</span>
          ) : (
            <span>{3 - joinsUsed} free peer join{3 - joinsUsed !== 1 ? "s" : ""} remaining</span>
          )}
        </p>
      )}

      {/* Create dialog */}
      <CreateSessionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        createMutation={createMutation}
      />

      {/* Coming soon dialog for non-admin users */}
      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent className="sm:max-w-sm rounded-2xl text-center">
          <DialogHeader>
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3"
              style={{ background: "#f4fdf3" }}
            >
              <Sparkles className="w-7 h-7" style={{ color: "#2dec29" }} />
            </div>
            <DialogTitle className="text-secondary text-xl">
              Coming Soon
            </DialogTitle>
            <DialogDescription className="text-sm text-neutral-500 mt-2">
              User-created sessions are coming soon. For now, sessions are hosted
              by the MyInterview team — browse below and request to join one!
            </DialogDescription>
          </DialogHeader>
          <button
            onClick={() => setComingSoonOpen(false)}
            className="mt-4 w-full px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A]"
            style={{ background: "#2dec29", color: "#112715" }}
          >
            Browse Sessions
          </button>
        </DialogContent>
      </Dialog>

      <UpgradeModal
        open={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        reason={upgradeReason}
      />
    </div>
  );
};

export default PeerPracticePage;
