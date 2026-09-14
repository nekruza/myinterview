"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/mixpanel";
import { FOCUS_RING } from "@/components/landing/styles";

// Root-relative so the anchors also work from /privacy and /terms.
const navLinks = [
  { href: "/#how-it-works", label: "How it works" },
  { href: "/#features", label: "Features" },
  { href: "/#pricing", label: "Pricing" },
];
const pill = `inline-flex items-center justify-center whitespace-nowrap rounded-full bg-ink px-4 py-2 text-sm font-semibold tracking-[0.01em] text-cream transition-[transform,background-color] duration-200 hover:bg-ink/85 active:scale-[0.98] ${FOCUS_RING}`;

export function Navigation() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: currentUser } }) => setUser(currentUser));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-line/80 bg-cream/95 backdrop-blur-sm">
      <nav aria-label="Main" className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className={`flex items-center gap-2.5 rounded-lg ${FOCUS_RING}`}>
          <Image src="/logo.png" alt="" width={28} height={28} className="rounded-lg" />
          <span className="font-display fina-display text-xl font-semibold tracking-[-0.01em] text-ink">Fina</span>
        </Link>

        <ul className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`rounded text-sm font-medium text-sub transition-colors duration-200 hover:text-ink ${FOCUS_RING}`}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-5 md:flex">
          {user ? (
            <Link href="/app" className={pill}>
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={`rounded text-sm font-medium text-sub transition-colors duration-200 hover:text-ink ${FOCUS_RING}`}
                onClick={() => track("CTA Clicked", { button: "Log in", location: "nav_desktop" })}
              >
                Log in
              </Link>
              <Link
                href="/onboarding"
                className={pill}
                onClick={() => track("CTA Clicked", { button: "Get started", location: "nav_desktop" })}
              >
                Get started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          className={`flex h-10 w-10 items-center justify-center rounded-full text-ink md:hidden ${FOCUS_RING}`}
          onClick={() => setMenuOpen((v) => !v)}
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? "Close menu" : "Open menu"}
        >
          {menuOpen ? (
            <X aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" strokeWidth={1.75} className="h-5 w-5" />
          )}
        </button>
      </nav>

      <div id="mobile-menu" hidden={!menuOpen} className="border-t border-line bg-cream px-4 pb-6 sm:px-6 md:hidden">
        <ul className="flex flex-col py-2">
          {navLinks.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className={`block border-b border-line py-3.5 text-base font-medium text-ink ${FOCUS_RING}`}
                onClick={closeMenu}
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-col gap-3">
          {user ? (
            <Link href="/app" className={`${pill} py-3 text-base`} onClick={closeMenu}>
              Open app
            </Link>
          ) : (
            <>
              <Link
                href="/onboarding"
                className={`${pill} py-3 text-base`}
                onClick={() => {
                  track("CTA Clicked", { button: "Get started", location: "nav_mobile" });
                  closeMenu();
                }}
              >
                Get started
              </Link>
              <Link
                href="/login"
                className={`rounded-full py-3 text-center text-base font-medium text-ink ${FOCUS_RING}`}
                onClick={() => {
                  track("CTA Clicked", { button: "Log in", location: "nav_mobile" });
                  closeMenu();
                }}
              >
                Log in
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
