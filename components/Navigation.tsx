"use client";

import { FC, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui";
import { useComingSoon } from "./ComingSoonProvider";

export const Navigation: FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { openModal } = useComingSoon();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "#features", label: "Features" },
    { href: "#pricing", label: "Pricing" },
    { href: "/blog", label: "Blog" },
    { href: "#join-team", label: "Careers" },
    { href: "/contact", label: "Contact" },
  ];

  return (
    <nav className={`px-0 fixed w-full bg-cream/95 bg-transparent z-50 transition-all duration-300`}>
      <div className="max-w-[1220px] mx-auto backdrop-blur-sm z-50 transition-all duration-300 p-4 sm:px-6 lg:px-8 border m-2 border-neutral-200 m-4 rounded-3xl">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <Image
                src="/logo.jpg"
                alt="MyInterview logo"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-secondary">
                MyInterview
              </span>
            </Link>
          </div>

          {/* Desktop nav links */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-secondary hover:text-primary transition font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center space-x-4">
            <button className="text-secondary hover:text-primary transition font-medium" onClick={openModal}>
              Sign In
            </button>
            <Button size="md" onClick={openModal}>Join Free</Button>
          </div>

          {/* Mobile: hamburger */}
          <button
            className="md:hidden flex items-center justify-center w-10 h-10 rounded-lg text-secondary hover:bg-neutral-100 transition"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-cream border-t border-neutral-200 px-4 pb-6">
          <div className="flex flex-col space-y-1 pt-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-secondary hover:text-primary transition font-medium py-3 border-b border-neutral-100 last:border-0"
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="flex flex-col gap-3 mt-6">
            <button className="text-secondary hover:text-primary transition font-medium text-left py-2" onClick={openModal}>
              Sign In
            </button>
            <Button size="md" className="w-full justify-center" onClick={openModal}>Join Free</Button>
          </div>
        </div>
      )}
    </nav>
  );
};
