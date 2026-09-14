"use client";

import { FC } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useFeedbackDialog } from "@/components/FeedbackProvider";
import {
  Home,
  Mic,
  BookOpen,
  CalendarDays,
  TrendingUp,
  LogOut,
  MessageSquare,
  UserPlus,
} from "lucide-react";

const navItems = [
  { href: "/app", label: "Home", icon: Home },
  { href: "/app/roleplay", label: "Speak", icon: Mic },
  { href: "/app/vocabulary", label: "Words", icon: BookOpen },
  { href: "/app/study-plan", label: "Plan", icon: CalendarDays },
  { href: "/app/progress", label: "Progress", icon: TrendingUp },
];

function isActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(href + "/");
}

interface AppSidebarProps {
  userEmail: string | null;
  avatarUrl: string | null;
}

export const AppSidebar: FC<AppSidebarProps> = ({ userEmail, avatarUrl }) => {
  const isAuthed = !!userEmail;
  const pathname = usePathname();
  const router = useRouter();
  const feedbackDialog = useFeedbackDialog();

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const initials = userEmail ? userEmail.split("@")[0].slice(0, 2).toUpperCase() : "";

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ──────────────────── */}
      <aside className="hidden md:flex md:flex-col shrink-0 h-screen w-20 border-r border-line bg-surface py-4">
        <Link href="/app" className="flex justify-center mb-6">
          <Image src="/logo.png" alt="Fina" width={32} height={32} className="rounded-xl" />
        </Link>

        <nav className="flex flex-col items-center gap-1 flex-1 w-full px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                title={label}
                className="flex flex-col items-center justify-center w-16 h-14 rounded-xl gap-1 transition-colors"
                style={
                  active
                    ? { background: "rgba(46,94,62,0.1)", color: "#2E5E3E" }
                    : { color: "var(--fina-sub)" }
                }
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium leading-none">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col items-center gap-1 w-full px-2 pt-2 border-t border-line">
          <button
            onClick={feedbackDialog.open}
            title="Give feedback"
            className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-cream"
            style={{ color: "var(--fina-sub)" }}
          >
            <MessageSquare className="w-5 h-5" />
          </button>

          {isAuthed ? (
            <>
              <Link
                href="/app/settings"
                title="Settings"
                className="relative w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold overflow-hidden mt-1"
                style={{ background: "var(--fina-accent-soft)", color: "#2E5E3E" }}
              >
                {avatarUrl ? (
                  <Image src={avatarUrl} alt="Profile" width={36} height={36} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </Link>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="flex items-center justify-center w-10 h-10 rounded-xl transition-colors hover:bg-cream"
                style={{ color: "var(--fina-sub)" }}
              >
                <LogOut className="w-4 h-4" />
              </button>
            </>
          ) : (
            <Link
              href="/login"
              title="Sign in"
              className="flex items-center justify-center w-10 h-10 rounded-xl mt-1"
              style={{ background: "var(--fina-accent-soft)", color: "#2E5E3E" }}
            >
              <UserPlus className="w-4 h-4" />
            </Link>
          )}
        </div>
      </aside>

      {/* ── Mobile bottom navigation (hidden on desktop) ─────────── */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 bg-surface border-t border-line">
        <div
          className="flex items-center justify-around px-2 py-2"
          style={{ paddingBottom: "max(8px, env(safe-area-inset-bottom))" }}
        >
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px] transition-colors"
                style={active ? { background: "rgba(46,94,62,0.1)", color: "#2E5E3E" } : { color: "var(--fina-sub)" }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-semibold leading-none mt-0.5">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={feedbackDialog.open}
            className="flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl min-w-[44px]"
            style={{ color: "var(--fina-sub)" }}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="text-[9px] font-semibold leading-none mt-0.5">Feedback</span>
          </button>
        </div>
      </nav>
    </>
  );
};
