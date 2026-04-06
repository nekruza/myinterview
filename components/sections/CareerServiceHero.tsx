"use client";

import { FC } from "react";
import Link from "next/link";
import { track } from "@/lib/mixpanel";

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export const CareerServiceHero: FC = () => {
  return (
    <section
      id="hero-section"
      aria-label="Career Service — Land Your First Engineering Job"
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
      <div className="relative z-10 max-w-[1200px] mx-auto w-full px-5 sm:px-8 pt-32 pb-20">
        <div className="flex flex-col lg:flex-row lg:items-center gap-16 lg:gap-12">

          {/* ── LEFT: Text content ─────────────────────────────────────────── */}
          <div className="flex-1 max-w-[560px]">

            {/* Enrolling badge */}
            <div className="hero-stagger-1 inline-flex items-center gap-2 mb-7">
              <span
                className="relative flex h-2 w-2"
                aria-hidden="true"
              >
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
              style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", color: "rgba(255,255,255,0.95)" }}
            >
              Ace your next
              <br />
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
              <br />
              interview.
            </h1>

            {/* Sub-headline */}
            <p
              className="hero-stagger-3 text-lg leading-relaxed mb-9"
              style={{ color: "rgba(255,255,255,0.48)", maxWidth: 460 }}
            >
              Practice interviews with an AI that knows your CV. Get scored, get better,{" "}
              <strong style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                get hired.
              </strong>
            </p>

            {/* CTAs */}
            <div className="hero-stagger-4 flex flex-wrap items-center gap-3 mb-10">
              <Link
                href="/app/practice"
                onClick={() => track("CTA Clicked", { button: "Start free session", location: "hero" })}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{ background: "#2dec29", color: "#071a09" }}
              >
                Start free session
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Trust bullets */}
            <div className="hero-stagger-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2.5">
              {[
                "Resume-tailored questions",
                "Job description-tailored interview",
                "Instant feedback report",
                "Practice anytime, no booking",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 flex-shrink-0"
                    fill="none"
                    stroke="#2dec29"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2.5}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
                    {point}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* ── RIGHT: Video placeholder ───────────────────────────────────── */}
          <div className="hero-stagger-6 flex-1 relative flex justify-center lg:justify-end">
            <div
              className="w-full max-w-[480px] aspect-square rounded-2xl overflow-hidden relative select-none"
              style={{
                border: "1px solid rgba(255,255,255,0.10)",
                boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
              }}
            >
              <video
                src="/avatar_video.mp4"
                loop
                playsInline
                controls
                poster="/avatar_image.png"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {/* Annotation */}
              <div
                className="absolute z-20 pointer-events-none flex flex-col items-end gap-1"
                style={{ top: "4%", right: "6%" }}
              >
                <span
                  style={{
                    fontFamily: "Georgia, 'Times New Roman', serif",
                    fontSize: "clamp(0.75rem, 2.5vw, 1rem)",
                    fontStyle: "italic",
                    fontWeight: 700,
                    transform: "rotate(-2deg)",
                    display: "inline-block",
                    color: "rgba(255,255,255,0.95)",
                    background: "rgba(255,255,255,0.12)",
                    border: "1px solid rgba(255,255,255,0.28)",
                    padding: "8px 16px",
                    borderRadius: "10px",
                    whiteSpace: "nowrap",
                    backdropFilter: "blur(8px)",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
                  }}
                >
                  you&apos;ll be practicing with him
                </span>
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" style={{ opacity: 0.65, marginRight: "2rem" }}>
                  <path d="M28 6 Q10 10 8 28" stroke="white" strokeWidth="1.8" strokeLinecap="round" fill="none"/>
                  <path d="M8 28 L6 22 M8 28 L14 26" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
          </div>

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
