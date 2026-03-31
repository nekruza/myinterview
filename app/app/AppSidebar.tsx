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
  Zap,
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
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/resources", label: "Resources", icon: BookOpen },
  // { href: "/app/settings", label: "Profile", icon: Settings },
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

  const { data: notificationsData } = useNotifications();
  const { data: profileData } = useProfile();
  const markRead = useMarkNotificationsRead();
  const markAllRead = useMarkAllNotificationsRead();

  const notifications = notificationsData ?? [];
  const plan = profileData?.plan ?? null;
  const practiceUsed = profileData?.practice_sessions_used ?? 0;
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

        {/* ── Free tier usage indicator (free users only) ──────── */}
        {plan === "free" && (
          <div className="relative z-10 w-full px-2 shrink-0">
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/app/settings"
                  className="flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-200 mx-auto relative"
                  style={{
                    color: practiceUsed >= 3
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
                  <Zap
                    className="w-5 h-5"
                    style={{ filter: "drop-shadow(0 1px 1.5px rgba(0,0,0,0.12))" }}
                  />
                  {practiceUsed >= 3 && (
                    <span
                      className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full animate-pulse"
                      style={{ background: "#f59e0b" }}
                    />
                  )}
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="max-w-[200px]">
                <p className="font-semibold text-xs mb-1">Free Plan</p>
                <p className="text-xs">{Math.max(0, 3 - practiceUsed)}/3 AI sessions left</p>
                <p className="text-xs mt-1 opacity-70">Click to upgrade →</p>
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
      </div>
    </nav>
    </>
  );
};
