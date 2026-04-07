"use client";

import { FC, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  Users,
  Settings,
  LogOut,
  Bell,
  Check,
  UserPlus,
  UserCheck,
  UserX,
  BookOpen,
  LifeBuoy,
  MessageSquare,
  Star,
  CheckCircle,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/Badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useNotifications, useMarkNotificationsRead, useMarkAllNotificationsRead } from "@/lib/queries/notifications";
import type { Notification } from "@/lib/queries/notifications";
import { useProfile } from "@/lib/queries/profile";

const navItems = [
  { href: "/app/dashboard", label: "Home", icon: LayoutDashboard },
  { href: "/app/practice", label: "AI Practice", icon: Sparkles },
  // { href: "/app/peer-practice", label: "Peer Practice", icon: Users },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/resources", label: "Resources", icon: BookOpen },
];

const notificationIcon = {
  join_request: UserPlus,
  join_accepted: UserCheck,
  join_rejected: UserX,
};

const notificationColor = {
  join_request: "#2dec29",
  join_accepted: "#2dec29",
  join_rejected: "#ef4444",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

// Shared glass active pill style — translucent green bubble
const glassActivePill = {
  background:
    "linear-gradient(145deg, rgba(45,236,41,0.38) 0%, rgba(45,236,41,0.18) 100%)",
  border: "1px solid rgba(255,255,255,0.55)",
  boxShadow:
    "inset 0 1.5px 0 rgba(255,255,255,0.65)",
  color: "#0d6e0c",
};

// Shared glass hover style
const glassHoverPill = {
  background: "rgba(255,255,255,0.52)",
  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.75)",
};

interface AppSidebarProps {
  userEmail: string;
  avatarUrl: string | null;
}

export const AppSidebar: FC<AppSidebarProps> = ({ userEmail, avatarUrl }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [popoverOpen, setPopoverOpen] = useState(false);

  // Feedback dialog state
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState(0);
  const [feedbackCategory, setFeedbackCategory] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  function openFeedback() {
    setFeedbackSubmitted(false);
    setFeedbackRating(0);
    setFeedbackMessage("");
    setFeedbackCategory("suggestion");
    setFeedbackOpen(true);
  }

  async function submitFeedback() {
    if (!feedbackMessage.trim() && feedbackRating === 0) return;
    setFeedbackSubmitting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("user_feedback").insert({
        user_id: user?.id ?? null,
        session_id: null,
        rating: feedbackRating || null,
        message: feedbackMessage.trim() || null,
        category: feedbackCategory,
      });
      setFeedbackSubmitted(true);
    } catch {
      // silent fail — toast not available here, but error won't break UI
    } finally {
      setFeedbackSubmitting(false);
    }
  }

  const { data: notificationsData } = useNotifications();
  const { data: profileData } = useProfile();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsData ?? [];
  const sessionCredits = profileData?.session_credits ?? 0;
  const unreadCount = notifications.filter((n) => !n.read).length;

  function handleMarkAllRead() {
    markAllRead.mutate();
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) {
      markRead.mutate([n.id]);
    }
    if (n.data.session_id) {
      setPopoverOpen(false);
      router.push(`/app/peer-practice/${n.data.session_id}`);
    }
  }

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = userEmail.split("@")[0].slice(0, 2).toUpperCase();

  return (
    <>
    {/* ── Desktop sidebar (hidden on mobile) ──────────────────── */}
    <aside className="hidden md:block shrink-0 h-screen py-3 pl-3" style={{ width: 76 }}>
      {/* ── Liquid glass pill ─────────────────────────────────── */}
      <div
        className="relative flex flex-col h-full items-center rounded-[28px] py-4 gap-1 overflow-hidden"
        style={{
          /* Multi-tone gradient — simulates light refracting through glass */
          background:
            "linear-gradient(160deg, rgba(255,255,255,0.62) 0%, rgba(255,255,255,0.28) 52%, rgba(255,255,255,0.44) 100%)",
          /* The core blur + saturation stack */
          backdropFilter: "blur(32px) saturate(2.2) brightness(1.06)",
          WebkitBackdropFilter: "blur(32px) saturate(2.2) brightness(1.06)",
          /* Crisp glass edge */
          border: "1px solid rgba(255,255,255,0.74)",
          /* Layered shadows: ambient depth + top specular edge + bottom rim */
          boxShadow: [
            "0 10px 48px rgba(0,0,0,0.10)",
            "0 2px 8px rgba(0,0,0,0.06)",
            "inset 0 1.5px 0 rgba(255,255,255,0.96)",
            "inset 0 -1px 0 rgba(0,0,0,0.05)",
            "inset 1px 0 0 rgba(255,255,255,0.52)",
          ].join(", "),
        }}
      >
        {/* Top specular shimmer — the "liquid glass" signature highlight */}
        <div
          className="absolute inset-x-0 top-0 h-24 pointer-events-none rounded-t-[28px]"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.52) 0%, rgba(255,255,255,0) 100%)",
          }}
        />

        {/* ── Logo ─────────────────────────────────────────────── */}
        <Link href="/app/dashboard" className="relative z-10 mb-1 shrink-0">
          <Image
            src="/logo.jpg"
            alt="MyInterview"
            width={32}
            height={32}
            className="rounded-xl"
            style={{
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.18))",
            }}
          />
        </Link>

        {/* Glass divider */}
        <div
          className="w-9 shrink-0 my-1"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 30%, rgba(0,0,0,0.07) 50%, rgba(255,255,255,0.7) 70%, transparent)",
          }}
        />

        {/* ── Nav items ────────────────────────────────────────── */}
        <nav className="relative z-10 flex flex-col items-center gap-1 flex-1 w-full px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Tooltip key={href}>
                <TooltipTrigger asChild>
                  <Link
                    href={href}
                    className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200"
                    style={
                      active
                        ? glassActivePill
                        : { color: "rgba(0,0,0,0.45)", border: "1px solid transparent" }
                    }
                    onMouseEnter={(e) => {
                      if (!active)
                        Object.assign(
                          (e.currentTarget as HTMLElement).style,
                          glassHoverPill
                        );
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "";
                        el.style.boxShadow = "";
                      }
                    }}
                  >
                    <Icon
                      className="w-5 h-5"
                      style={{
                        filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.12))",
                      }}
                    />
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>

        {/* ── Contact Us ───────────────────────────────────────── */}
        <div className="relative z-10 w-full px-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/app/contact"
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 mx-auto"
                style={
                  pathname === "/app/contact"
                    ? glassActivePill
                    : { color: "rgba(0,0,0,0.45)", border: "1px solid transparent" }
                }
                onMouseEnter={(e) => {
                  if (pathname !== "/app/contact")
                    Object.assign((e.currentTarget as HTMLElement).style, glassHoverPill);
                }}
                onMouseLeave={(e) => {
                  if (pathname !== "/app/contact") {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "";
                    el.style.boxShadow = "";
                  }
                }}
              >
                <LifeBuoy className="w-5 h-5" style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.12))" }} />
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Help & Contact</TooltipContent>
          </Tooltip>
        </div>

        {/* ── Give Feedback ─────────────────────────────────── */}
        <div className="relative z-10 w-full px-2 shrink-0">
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={openFeedback}
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 mx-auto"
                style={{ color: "rgba(0,0,0,0.45)", border: "1px solid transparent" }}
                onMouseEnter={(e) => Object.assign((e.currentTarget as HTMLElement).style, glassHoverPill)}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.background = "";
                  el.style.boxShadow = "";
                }}
              >
                <MessageSquare className="w-5 h-5" style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.12))" }} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">Give Feedback</TooltipContent>
          </Tooltip>
        </div>

        {/* ── Session credit warning indicator ──────────────────── */}
        {sessionCredits <= 5 && (
          <div className="relative z-10 w-full px-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/app/settings"
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 mx-auto relative"
                  style={{
                    color: sessionCredits <= 0
                      ? "#f59e0b"
                      : "rgba(0,0,0,0.45)",
                    border: "1px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    Object.assign((e.currentTarget as HTMLElement).style, glassHoverPill);
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.background = "";
                    el.style.boxShadow = "";
                  }}
                >
                  {/* Numeric credit badge */}
                  <span
                    className="text-[11px] font-black tabular-nums leading-none flex items-center justify-center w-6 h-6 rounded-lg"
                    style={{
                      background: sessionCredits <= 0 ? "rgba(245,158,11,0.18)" : "rgba(0,0,0,0.08)",
                      color: sessionCredits <= 0 ? "#f59e0b" : "inherit",
                    }}
                  >
                    {sessionCredits}
                  </span>
                  {sessionCredits <= 0 && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                      style={{ background: "#f59e0b" }}
                    />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="font-semibold text-xs mb-1">Sessions</p>
                <p className="text-xs">{sessionCredits} session{sessionCredits !== 1 ? "s" : ""} remaining</p>
              </TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* ── Notification bell ────────────────────────────────── */}
        {/* <div className="relative z-10 w-full px-2 shrink-0">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <Tooltip>
              <TooltipTrigger asChild>
                <PopoverTrigger asChild>
                  <button
                    className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 mx-auto relative"
                    style={{
                      color: popoverOpen
                        ? "#0d6e0c"
                        : "rgba(0,0,0,0.45)",
                      border: "1px solid transparent",
                      ...(popoverOpen ? glassActivePill : {}),
                    }}
                    onMouseEnter={(e) => {
                      if (!popoverOpen)
                        Object.assign(
                          (e.currentTarget as HTMLElement).style,
                          glassHoverPill
                        );
                    }}
                    onMouseLeave={(e) => {
                      if (!popoverOpen) {
                        const el = e.currentTarget as HTMLElement;
                        el.style.background = "";
                        el.style.boxShadow = "";
                      }
                    }}
                  >
                    <Bell
                      className="w-5 h-5"
                      style={{
                        filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.12))",
                      }}
                    />
                    {unreadCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                        style={{
                          background: "#ef4444",
                          color: "white",
                        }}
                      >
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </button>
                </PopoverTrigger>
              </TooltipTrigger>
              <TooltipContent side="right">Notifications</TooltipContent>
            </Tooltip>

            <PopoverContent
              side="right"
              align="end"
              sideOffset={12}
              className="w-80 p-0 rounded-xl shadow-xl"
            >
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <h3 className="font-semibold text-sm text-neutral-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="success"
                      className="text-[10px] px-2 py-0.5"
                    >
                      {unreadCount} new
                    </Badge>
                    <button
                      onClick={handleMarkAllRead}
                      className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-neutral-100 transition"
                      style={{ color: "#2dec29" }}
                    >
                      <Check className="w-3 h-3 inline mr-1" />
                      Mark all read
                    </button>
                  </div>
                )}
              </div>

              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                    <p className="text-neutral-400 text-sm">
                      No notifications yet
                    </p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((n) => {
                      const NIcon = notificationIcon[n.type] || Bell;
                      const iconColor =
                        notificationColor[n.type] || "#6b7280";
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-neutral-50 transition border-b border-neutral-50 last:border-0"
                          style={{
                            background: n.read ? "transparent" : "#f0fdf4",
                          }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{
                              background: `${iconColor}15`,
                              color: iconColor,
                            }}
                          >
                            <NIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-neutral-900 truncate">
                              {n.title}
                            </p>
                            {n.body && (
                              <p className="text-xs text-neutral-500 mt-0.5 line-clamp-2">
                                {n.body}
                              </p>
                            )}
                            <p className="text-[11px] text-neutral-400 mt-1">
                              {timeAgo(n.created_at)}
                            </p>
                          </div>
                          {!n.read && (
                            <div
                              className="w-2 h-2 rounded-full shrink-0 mt-2"
                              style={{ background: "#2dec29" }}
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </PopoverContent>
          </Popover>
        </div> */}

        {/* Glass divider */}
        <div
          className="w-9 shrink-0 my-1"
          style={{
            height: 1,
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.7) 30%, rgba(0,0,0,0.07) 50%, rgba(255,255,255,0.7) 70%, transparent)",
          }}
        />

        {/* ── User avatar ──────────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/app/settings"
              className="relative z-10 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 overflow-hidden transition-all duration-200"
              style={{
                background:
                  "linear-gradient(145deg, rgba(45,236,41,0.55) 0%, rgba(45,236,41,0.3) 100%)",
                border: "1.5px solid rgba(255,255,255,0.6)",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.65)",
                color: "#0d6e0c",
              }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile"
                  width={32}
                  height={32}
                  className="w-full h-full object-cover"
                />
              ) : (
                initials
              )}
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right">Settings</TooltipContent>
        </Tooltip>

        {/* ── Sign out ─────────────────────────────────────────── */}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={handleSignOut}
              className="relative z-10 flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 shrink-0"
              style={{
                color: "rgba(0,0,0,0.35)",
                border: "1px solid transparent",
              }}
              onMouseEnter={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background =
                  "linear-gradient(145deg, rgba(239,68,68,0.2) 0%, rgba(239,68,68,0.1) 100%)";
                el.style.border = "1px solid rgba(255,255,255,0.55)";
                el.style.boxShadow = "inset 0 1px 0 rgba(255,255,255,0.5)";
                el.style.color = "#dc2626";
              }}
              onMouseLeave={(e) => {
                const el = e.currentTarget as HTMLElement;
                el.style.background = "";
                el.style.border = "1px solid transparent";
                el.style.boxShadow = "";
                el.style.color = "rgba(0,0,0,0.35)";
              }}
            >
              <LogOut
                className="w-4 h-4"
                style={{
                  filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.10))",
                }}
              />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Sign out</TooltipContent>
        </Tooltip>
      </div>
    </aside>

    {/* ── Mobile bottom navigation (hidden on desktop) ─────────── */}
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-50"
      style={{
        background: "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(255,255,255,0.88) 100%)",
        backdropFilter: "blur(20px) saturate(1.8)",
        WebkitBackdropFilter: "blur(20px) saturate(1.8)",
        borderTop: "1px solid rgba(255,255,255,0.6)",
        boxShadow: "0 -4px 24px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="flex items-center justify-around px-2 py-2"
        style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
      >
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-all duration-200"
              style={
                active
                  ? {
                      background: "linear-gradient(145deg, rgba(45,236,41,0.25) 0%, rgba(45,236,41,0.12) 100%)",
                      color: "#0d6e0c",
                    }
                  : { color: "rgba(0,0,0,0.4)" }
              }
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-semibold leading-none mt-0.5">{label}</span>
            </Link>
          );
        })}
        <button
          onClick={openFeedback}
          className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-all duration-200"
          style={{ color: "rgba(0,0,0,0.4)" }}
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[9px] font-semibold leading-none mt-0.5">Feedback</span>
        </button>
      </div>
    </nav>
      {/* ── Feedback dialog ────────────────────────────────────── */}
      {feedbackOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setFeedbackOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            {feedbackSubmitted ? (
              <div className="text-center py-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <CheckCircle className="w-6 h-6" style={{ color: "#2dec29" }} />
                </div>
                <p className="font-bold text-secondary text-lg">Thanks for your feedback!</p>
                <p className="text-sm text-neutral-500">We read every submission and use it to improve.</p>
                <button
                  onClick={() => setFeedbackOpen(false)}
                  className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-secondary">Share your feedback</h2>
                  <button
                    onClick={() => setFeedbackOpen(false)}
                    className="text-neutral-300 hover:text-neutral-500 transition text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100"
                  >
                    &times;
                  </button>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                    How&apos;s the app?
                  </p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setFeedbackRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className="w-7 h-7 transition-colors"
                          style={{
                            color: star <= feedbackRating ? "#f59e0b" : "#e5e7eb",
                            fill: star <= feedbackRating ? "#f59e0b" : "none",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                    Type
                  </p>
                  <div className="flex gap-2">
                    {(["suggestion", "bug", "other"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setFeedbackCategory(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize"
                        style={{
                          border: feedbackCategory === c ? "1.5px solid #2dec29" : "1.5px solid transparent",
                          background: feedbackCategory === c
                            ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                            : "#f9fafb",
                          color: feedbackCategory === c ? "#112715" : "#6b7280",
                          boxShadow: feedbackCategory === c ? "0 0 0 3px rgba(45,236,41,0.08)" : "none",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                    Message
                  </p>
                  <textarea
                    value={feedbackMessage}
                    onChange={(e) => setFeedbackMessage(e.target.value)}
                    placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                  />
                </div>

                <button
                  onClick={submitFeedback}
                  disabled={feedbackSubmitting || (!feedbackMessage.trim() && feedbackRating === 0)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  {feedbackSubmitting ? "Submitting…" : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};
