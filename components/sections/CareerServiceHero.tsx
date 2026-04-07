"use client";

import { FC } from "react";
import Link from "next/link";
import { track } from "@/lib/mixpanel";

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export const CareerServiceHero: FC = () => {
  return (
    <section
      id="hero-section"
      aria-label="Career Service — Land Your Dream Job"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden"
      style={{ background: "#080c09" }}
    >
      {/* ── Ambient background glows ───────────────────────────────────────── */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        {/* Top-left warm glow */}
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(45,236,41,0.07) 0%, transparent 70%)",
          }}
        />
        {/* Bottom-right glow */}
        <div
          className="absolute -bottom-48 -right-48 w-[700px] h-[700px] rounded-full"
          style={{
            background:
              "radial-gradient(circle, rgba(45,236,41,0.05) 0%, transparent 70%)",
          }}
        />
        {/* Subtle grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.025]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* ── Main content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-[760px] mx-auto w-full px-5 sm:px-8 pt-20 pb-20 text-center">

          {/* Enrolling badge */}
          <div className="hero-stagger-1 inline-flex items-center gap-2 mb-7">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ background: "#2dec29" }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
                style={{ background: "#2dec29" }}
              />
            </span>
            <span
              className="text-xs font-bold uppercase tracking-[0.18em]"
              style={{ color: "rgba(255,255,255,0.55)" }}
            >
              AI Mock Interviews &middot; Available Now
            </span>
          </div>

          {/* Headline */}
          <h1
            className="hero-stagger-2 font-black leading-[1.05] tracking-tight mb-6"
            style={{ fontSize: "clamp(3rem, 7vw, 5rem)", color: "rgba(255,255,255,0.95)" }}
          >
            Ace your next{" "}
            <span
              style={{
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                backgroundImage: "linear-gradient(90deg, #2dec29 0%, #86efac 100%)",
              }}
            >
              dream
            </span>
            {" "}interview.
          </h1>

          {/* Sub-headline */}
          <p
            className="hero-stagger-3 text-lg leading-relaxed mb-9 mx-auto"
            style={{ color: "rgba(255,255,255,0.48)", maxWidth: 520 }}
          >
            Practice interviews with an AI that knows your CV. Get scored, get better,{" "}
            <strong style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
              get hired.
            </strong>
          </p>

          {/* CTA */}
          <div className="hero-stagger-4 flex justify-center mb-10">
            <Link
              href="/app/practice"
              onClick={() => track("CTA Clicked", { button: "Start free session", location: "hero" })}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl font-bold text-base transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
              style={{ background: "#2dec29", color: "#071a09" }}
            >
              Start free session
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>


      </div>


      {/* ── Bottom fade into next section ──────────────────────────────────── */}
      <div
        className="absolute bottom-0 inset-x-0 h-32 pointer-events-none"
        style={{
          background: "linear-gradient(to bottom, transparent, rgba(8,12,9,0.6))",
        }}
      />

    </section>
  );
};
