"use client";

import { FC, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Button } from "./ui";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/mixpanel";
import type { User } from "@supabase/supabase-js";

export const Navigation: FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => {
      setUser(currentUser);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => setUser(session?.user ?? null)
    );

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className="fixed w-full z-50 transition-all duration-300" style={{ top: 0 }}>
      <div
        className="max-w-[1200px] mx-auto m-3 rounded-2xl transition-all duration-300"
        style={scrolled ? {
          background: "rgba(7,26,9,0.92)",
          backdropFilter: "blur(20px) saturate(1.4)",
          WebkitBackdropFilter: "blur(20px) saturate(1.4)",
          border: "1px solid rgba(45,236,41,0.12)",
          boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
        } : {
          background: "rgba(8,12,9,0.4)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <div className="flex justify-between items-center px-5 py-3">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/logo.jpg"
              alt="MyInterview logo"
              width={28}
              height={28}
              className="rounded-lg"
            />
            <span
              className="text-base font-bold tracking-tight transition-colors duration-300"
              style={{ color: "rgba(255,255,255,0.92)" }}
            >
              MyInterview
            </span>
          </Link>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium transition-colors duration-200 hover:opacity-100"
                style={{ color: scrolled ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.55)" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = scrolled ? "rgba(255,255,255,0.65)" : "rgba(255,255,255,0.55)")}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-4">
            {user ? (
              <>
                <Link
                  href="/app/dashboard"
                  className="text-sm font-semibold transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.85)" }}
                >
                  Dashboard
                </Link>
                <button
                  onClick={handleSignOut}
                  className="text-sm transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium transition-colors duration-200"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onClick={() => track("CTA Clicked", { button: "Sign In", location: "nav_desktop" })}
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    track("CTA Clicked", { button: "Join Free", location: "nav_desktop" });
                    router.push("/signup");
                  }}
                  className="text-sm font-bold px-4 py-2 rounded-xl transition-all duration-200 hover:brightness-110"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  Join Free
                </button>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-9 h-9 rounded-lg transition-colors"
            style={{ color: "rgba(255,255,255,0.8)" }}
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div
          className="md:hidden mx-3 rounded-2xl overflow-hidden"
          style={{
            background: "rgba(8,12,9,0.96)",
            backdropFilter: "blur(20px)",
            border: "1px solid rgba(255,255,255,0.08)",
            marginTop: "-4px",
          }}
        >
          <div className="flex flex-col px-5 py-4 gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="py-3 text-sm font-medium border-b"
                style={{ color: "rgba(255,255,255,0.6)", borderColor: "rgba(255,255,255,0.06)" }}
                onClick={() => setMenuOpen(false)}
                onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.95)")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 px-5 pb-5 pt-2">
            {user ? (
              <>
                <Link
                  href="/app/dashboard"
                  className="text-sm font-semibold py-2"
                  style={{ color: "rgba(255,255,255,0.8)" }}
                  onClick={() => setMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => { handleSignOut(); setMenuOpen(false); }}
                  className="text-sm text-left py-2"
                  style={{ color: "rgba(255,255,255,0.4)" }}
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium py-2"
                  style={{ color: "rgba(255,255,255,0.6)" }}
                  onClick={() => {
                    track("CTA Clicked", { button: "Sign In", location: "nav_mobile" });
                    setMenuOpen(false);
                  }}
                >
                  Sign In
                </Link>
                <button
                  onClick={() => {
                    track("CTA Clicked", { button: "Join Free", location: "nav_mobile" });
                    setMenuOpen(false);
                    router.push("/signup");
                  }}
                  className="w-full py-3 text-sm font-bold rounded-xl"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  Join Free
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
