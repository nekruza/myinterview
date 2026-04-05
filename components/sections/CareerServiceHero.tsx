"use client";

import { FC, useState } from "react";
import { track } from "@/lib/mixpanel";
import { WaitlistModal } from "@/components/WaitlistModal";

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export const CareerServiceHero: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

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
                Now Enrolling &mdash; Cohort 1
              </span>
            </div>

            {/* Headline */}
            <h1
              className="hero-stagger-2 font-black leading-[1.05] tracking-tight mb-6"
              style={{ fontSize: "clamp(2.8rem, 6vw, 4.5rem)", color: "rgba(255,255,255,0.95)" }}
            >
              Land your first
              <br />
              <span
                style={{
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  backgroundImage: "linear-gradient(90deg, #2dec29 0%, #86efac 100%)",
                }}
              >
                engineering
              </span>
              <br />
              job.
            </h1>

            {/* Sub-headline */}
            <p
              className="hero-stagger-3 text-lg leading-relaxed mb-9"
              style={{ color: "rgba(255,255,255,0.48)", maxWidth: 460 }}
            >
              A complete programme for graduates who can code but can&apos;t get hired.
              Resume review, AI mock interviews, and a{" "}
              <strong style={{ color: "rgba(255,255,255,0.75)", fontWeight: 600 }}>
                real internship on your CV.
              </strong>
            </p>

            {/* CTAs */}
            <div className="hero-stagger-4 flex flex-wrap items-center gap-3 mb-10">
              <button
                onClick={() => {
                  track("CTA Clicked", { button: "Join the Waitlist", location: "hero" });
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
                style={{ background: "#2dec29", color: "#071a09" }}
              >
                Join the Waitlist
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Trust bullets */}
            <div className="hero-stagger-5 flex flex-col sm:flex-row sm:flex-wrap gap-x-6 gap-y-2.5">
              {[
                "Real internship on your CV",
                "AI-powered mock interviews",
                "Community support",
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
                src="/avatar-hero.mp4"
                loop
                playsInline
                controls
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
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

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};
