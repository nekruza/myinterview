"use client";

import { FC } from "react";
import Link from "next/link";
import Image from "next/image";

export const Footer: FC = () => {
  const footerLinks = {
    resources: [
      { name: "Features", href: "#features" },
      { name: "Pricing", href: "#pricing" },
      { name: "Blog", href: "/blog" },
      { name: "Interview Tips", href: "/blog" },
      { name: "Anxiety Guide", href: "/blog/how-to-stop-mind-going-blank-interview" },
    ],
    company: [
      { name: "Contact", href: "/contact" },
      { name: "Privacy", href: "/privacy" },
      { name: "Terms", href: "/terms" },
    ],
  };

  return (
    <footer
      className="relative overflow-hidden"
      style={{ background: "linear-gradient(160deg, #071a09 0%, #0d2410 55%, #061508 100%)" }}
    >
      {/* Dot grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(45,236,41,0.05) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(45,236,41,0.04)" }}
      />

      {/* ── Pre-footer CTA ── */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div
          className="rounded-3xl px-8 py-12 text-center relative overflow-hidden mb-20"
          style={{
            background: "rgba(45,236,41,0.04)",
            border: "1px solid rgba(45,236,41,0.12)",
          }}
        >
          {/* inner glow */}
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-32 rounded-full blur-3xl pointer-events-none"
            style={{ background: "rgba(45,236,41,0.06)" }}
          />
          <div className="relative z-10">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-4"
              style={{ color: "rgba(45,236,41,0.6)" }}
            >
              Cohort 1 · Now Forming
            </p>
            <h2 className="text-4xl sm:text-5xl font-black text-white mb-4 leading-tight">
              Stop getting rejected.{" "}
              <span
                style={{
                  background: "linear-gradient(90deg, #2dec29 0%, #86efac 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Start getting hired.
              </span>
            </h2>
            <p
              className="text-base mb-8 max-w-md mx-auto leading-relaxed"
              style={{ color: "rgba(255,255,255,0.45)" }}
            >
              Real internship. Real CV line. Real offer. £359 to start — £499 only when you land the job.
            </p>
            <Link
              href="#hero-section"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 hover:gap-3"
              style={{ background: "#2dec29", color: "#071a09" }}
            >
              Join the Waitlist
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── Footer links ── */}
        <div className="grid md:grid-cols-3 gap-10 mb-14">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/logo.jpg"
                alt="MyInterview logo"
                width={36}
                height={36}
                className="rounded-lg"
              />
              <span className="text-xl font-bold text-white">MyInterview</span>
            </div>
            <p
              className="text-sm leading-relaxed mb-6 max-w-[240px]"
              style={{ color: "rgba(255,255,255,0.38)" }}
            >
              Helping graduates land their first engineering job — real internship experience, AI mock interviews, and a career service that only wins when you do.
            </p>
            <Link
              href="https://www.linkedin.com/company/myinterview-me/"
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.5)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.12)";
                e.currentTarget.style.color = "rgba(255,255,255,0.85)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                e.currentTarget.style.color = "rgba(255,255,255,0.5)";
              }}
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
              </svg>
            </Link>
          </div>

          {/* Resources */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Resources
            </h4>
            <ul className="space-y-3">
              {footerLinks.resources.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.48)")}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4
              className="text-xs font-bold uppercase tracking-widest mb-5"
              style={{ color: "rgba(255,255,255,0.3)" }}
            >
              Company
            </h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm"
                    style={{ color: "rgba(255,255,255,0.48)" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.85)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.48)")}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ── */}
        <div
          className="pt-8 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
        >
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            &copy; 2026 MyInterview. All rights reserved.
          </p>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.25)" }}>
            Built for engineers who deserve better
          </p>
        </div>
      </div>
    </footer>
  );
};
