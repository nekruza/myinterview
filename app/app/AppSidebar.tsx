"use client";

import { FC, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  MessageSquare,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

const navItems = [
  { href: "/app/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/app/practice", label: "Practice", icon: Users },
  { href: "/app/frameworks", label: "Frameworks", icon: BookOpen },
  { href: "/app/community", label: "Community", icon: MessageSquare },
  { href: "/app/settings", label: "Settings", icon: Settings },
];

interface AppSidebarProps {
  userEmail: string;
}

export const AppSidebar: FC<AppSidebarProps> = ({ userEmail }) => {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

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
