"use client";

import { FC, useState, useEffect, useCallback } from "react";
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
  ChevronLeft,
  ChevronRight,
  Bell,
  Check,
  UserPlus,
  UserCheck,
  UserX,
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/Badge";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/practice", label: "AI Practice", icon: Sparkles },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
  { href: "/app/peer-practice", label: "Peer Practice", icon: Users },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

interface Notification {
  id: string;
  type: "join_request" | "join_accepted" | "join_rejected";
  title: string;
  body: string | null;
  data: {
    session_id?: string;
    session_title?: string;
    requester_id?: string;
    requester_name?: string;
  };
  read: boolean;
  created_at: string;
}

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

interface AppSidebarProps {
  userEmail: string;
}

export const AppSidebar: FC<AppSidebarProps> = ({ userEmail }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const fetchNotifications = useCallback(async () => {
    const res = await fetch("/api/notifications");
    if (res.ok) {
      const data = await res.json();
      setNotifications(data.notifications || []);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  async function markAllRead() {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all: true }),
    });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function handleNotificationClick(n: Notification) {
    if (!n.read) {
      fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: [n.id] }),
      });
      setNotifications((prev) =>
        prev.map((notif) => (notif.id === n.id ? { ...notif, read: true } : notif))
      );
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

  const initials = userEmail
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside
      className="flex flex-col h-screen transition-all duration-300 shrink-0"
      style={{
        width: collapsed ? 72 : 240,
        background: "#112715",
      }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-white/10">
        <Link href="/" className="shrink-0">
          <Image
            src="/logo.jpg"
            alt="MyInterview"
            width={32}
            height={32}
            className="rounded-lg"
          />
        </Link>
        {!collapsed && (
          <span className="text-white font-bold text-lg truncate">
            MyInterview
          </span>
        )}
        <button
          onClick={() => setCollapsed((v) => !v)}
          className="ml-auto text-white/50 hover:text-white transition shrink-0"
          aria-label="Toggle sidebar"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-4 py-3 mx-2 rounded-xl transition-all duration-150 group"
              style={{
                background: active ? "#2dec29" : "transparent",
                color: active ? "#112715" : "rgba(255,255,255,0.75)",
              }}
              onMouseEnter={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background =
                    "rgba(255,255,255,0.08)";
              }}
              onMouseLeave={(e) => {
                if (!active)
                  (e.currentTarget as HTMLElement).style.background =
                    "transparent";
              }}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && (
                <span className="text-sm font-medium truncate">{label}</span>
              )}
            </Link>
          );
        })}

        {/* Notification bell — shadcn Popover (portaled, never clipped) */}
        <div className="mx-2 mt-2">
          <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
            <PopoverTrigger asChild>
              <button
                className="flex items-center gap-3 px-4 py-3 w-full rounded-xl transition-all duration-150 hover:bg-white/[0.08] relative"
                style={{ color: popoverOpen ? "#2dec29" : "rgba(255,255,255,0.75)" }}
                title={collapsed ? "Notifications" : undefined}
              >
                <div className="relative shrink-0">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span
                      className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-bold px-1"
                      style={{ background: "#ef4444", color: "white" }}
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </div>
                {!collapsed && (
                  <span className="text-sm font-medium truncate">Notifications</span>
                )}
              </button>
            </PopoverTrigger>

            <PopoverContent
              side="right"
              align="start"
              sideOffset={12}
              className="w-80 p-0 rounded-xl shadow-xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-100">
                <h3 className="font-semibold text-sm text-neutral-900">
                  Notifications
                </h3>
                {unreadCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-[10px] px-2 py-0.5">
                      {unreadCount} new
                    </Badge>
                    <button
                      onClick={markAllRead}
                      className="text-xs font-medium px-2 py-1 rounded-lg hover:bg-neutral-100 transition"
                      style={{ color: "#2dec29" }}
                    >
                      <Check className="w-3 h-3 inline mr-1" />
                      Mark all read
                    </button>
                  </div>
                )}
              </div>

              {/* Notification list */}
              <ScrollArea className="max-h-80">
                {notifications.length === 0 ? (
                  <div className="py-10 text-center">
                    <Bell className="w-8 h-8 text-neutral-200 mx-auto mb-2" />
                    <p className="text-neutral-400 text-sm">No notifications yet</p>
                  </div>
                ) : (
                  <div>
                    {notifications.map((n) => {
                      const NIcon = notificationIcon[n.type] || Bell;
                      const iconColor = notificationColor[n.type] || "#6b7280";
                      return (
                        <button
                          key={n.id}
                          onClick={() => handleNotificationClick(n)}
                          className="flex items-start gap-3 px-4 py-3 w-full text-left hover:bg-neutral-50 transition border-b border-neutral-50 last:border-0"
                          style={{ background: n.read ? "transparent" : "#f0fdf4" }}
                        >
                          <div
                            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                            style={{ background: `${iconColor}15`, color: iconColor }}
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
        </div>
      </nav>

      {/* User + Sign out */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-1 py-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
            style={{ background: "#2dec29", color: "#112715" }}
          >
            {initials}
          </div>
          {!collapsed && (
            <span className="text-white/70 text-xs truncate flex-1">
              {userEmail}
            </span>
          )}
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 w-full px-2 py-2 rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition mt-1"
          title={collapsed ? "Sign out" : undefined}
        >
          <LogOut className="w-4 h-4 shrink-0" />
          {!collapsed && <span className="text-sm">Sign out</span>}
        </button>
      </div>
    </aside>
  );
};
