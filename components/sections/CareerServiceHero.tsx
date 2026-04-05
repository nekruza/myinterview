"use client";

import { FC, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/mixpanel";
import { WaitlistModal } from "@/components/WaitlistModal";

/* ─── Product preview card: live AI session ──────────────────────────────── */
function InterviewSessionCard() {
  return (
    <div
      className="w-[300px] sm:w-[320px] rounded-2xl p-5 card-float"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Session header */}
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-sm"
          style={{ background: "linear-gradient(135deg, #2dec29 0%, #0a5c09 100%)" }}
        >
          🤖
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs font-semibold">AI Coach</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span
              className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0"
              style={{ background: "#2dec29" }}
            />
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Live session
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono tabular-nums" style={{ color: "rgba(255,255,255,0.25)" }}>
          02:41
        </span>
      </div>

      {/* Question bubble */}
      <div
        className="rounded-xl p-3.5 mb-3.5"
        style={{
          background: "rgba(45,236,41,0.06)",
          border: "1px solid rgba(45,236,41,0.14)",
        }}
      >
        <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.72)" }}>
          &ldquo;Tell me about a time you had to debug a production issue under pressure. Walk me through your process.&rdquo;
        </p>
      </div>

      {/* Waveform — candidate speaking */}
      <div className="flex items-center gap-[3px] h-7 mb-3.5">
        {[2, 5, 8, 5, 10, 7, 4, 9, 6, 8, 5, 7, 10, 6, 4, 8, 6, 9, 5, 7, 4, 6, 8, 5, 3].map(
          (h, i) => (
            <div
              key={i}
              className="w-[3px] rounded-full origin-center"
              style={{
                height: `${h * 2.6}px`,
                background: "#2dec29",
                opacity: 0.5 + (i % 4) * 0.12,
                animation: `waveform-bar ${0.4 + (i % 5) * 0.15}s ease-in-out ${i * 0.06}s infinite`,
              }}
            />
          )
        )}
      </div>

      {/* STAR hint chip */}
      <div className="flex items-center gap-2">
        <span
          className="text-[10px] px-2.5 py-1 rounded-full font-bold"
          style={{
            background: "rgba(45,236,41,0.14)",
            color: "#2dec29",
            border: "1px solid rgba(45,236,41,0.22)",
          }}
        >
          STAR
        </span>
        <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.28)" }}>
          Situation → Task → Action → Result
        </span>
      </div>
    </div>
  );
}

/* ─── Floating score card ────────────────────────────────────────────────── */
function ScoreCard() {
  const bars = [62, 71, 58, 80, 87];
  return (
    <div
      className="rounded-2xl px-5 py-4 card-float-alt"
      style={{
        background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(20px)",
        boxShadow: "0 20px 48px rgba(0,0,0,0.5)",
        minWidth: 160,
      }}
    >
      <p
        className="text-[9px] font-bold uppercase tracking-[0.18em] mb-2.5"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        Session Score
      </p>
      <div className="flex items-end gap-1.5 mb-3">
        <span className="text-4xl font-black leading-none" style={{ color: "#2dec29" }}>
          87
        </span>
        <span className="text-lg font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.2)" }}>
          /100
        </span>
      </div>
      {/* Mini bar chart — last 5 sessions */}
      <div className="flex items-end gap-1 h-7">
        {bars.map((v, i) => (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all"
            style={{
              height: `${(v / 100) * 100}%`,
              background:
                i === bars.length - 1
                  ? "#2dec29"
                  : `rgba(45,236,41,${0.15 + i * 0.06})`,
            }}
          />
        ))}
      </div>
      <p
        className="text-[9px] mt-1.5"
        style={{ color: "rgba(255,255,255,0.2)" }}
      >
        +25 pts vs first session
      </p>
    </div>
  );
}

/* ─── Main internship card ───────────────────────────────────────────────── */
function InternshipCard() {
  return (
    <div
      className="w-[300px] sm:w-[320px] rounded-2xl overflow-hidden card-float"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {/* Top: internship origin */}
      <div
        className="px-5 pt-4 pb-3 flex items-center gap-3"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 font-black text-xs"
          style={{ background: "rgba(45,236,41,0.12)", color: "#2dec29", border: "1px solid rgba(45,236,41,0.22)" }}
        >
          PC
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.55)" }}>3-month internship</p>
            <span
              className="text-[9px] font-bold px-1.5 py-0.5 rounded"
              style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" }}
            >
              Unpaid
            </span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#2dec29" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
            <p className="text-[10px] font-semibold" style={{ color: "#2dec29" }}>Completed · Added to CV</p>
          </div>
        </div>
      </div>

      {/* Middle: outcome arrow */}
      <div className="flex items-center justify-center py-2.5">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>

      {/* Bottom: job offer outcome */}
      <div className="px-5 pb-5">
        {/* "You're hired" banner */}
        <div
          className="rounded-xl px-4 py-3 mb-4"
          style={{ background: "rgba(45,236,41,0.08)", border: "1px solid rgba(45,236,41,0.18)" }}
        >
          <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={{ color: "rgba(45,236,41,0.6)" }}>
            Job Offer Received
          </p>
          <p className="text-white font-black text-base leading-tight">Software Engineer</p>
          <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>Full-time · £58,000 / yr</p>
        </div>

        {/* What got them there */}
        <div className="space-y-2">
          {[
            "Real experience on CV opened the door",
            "Mock interviews meant they were ready",
          ].map((point) => (
            <div key={point} className="flex items-start gap-2">
              <svg className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#2dec29" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              <p className="text-[11px] leading-snug" style={{ color: "rgba(255,255,255,0.42)" }}>{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── Floating streak chip ───────────────────────────────────────────────── */
function StreakChip() {
  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3 card-float"
      style={{
        background: "linear-gradient(135deg, #ea580c 0%, #f97316 50%, #fb923c 100%)",
        boxShadow: "0 16px 40px rgba(234,88,12,0.35)",
        animationDelay: "0.8s",
      }}
    >
      <span className="text-2xl leading-none select-none">🔥</span>
      <div>
        <p className="text-white font-black text-xl leading-none tabular-nums">12</p>
        <p className="text-white/70 text-[10px] font-semibold mt-0.5">day streak</p>
      </div>
    </div>
  );
}

/* ─── Hero ───────────────────────────────────────────────────────────────── */
export const CareerServiceHero: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="hero-section"
      aria-label="Career Service — Land Your First Engineering Job"
      className="relative min-h-screen flex flex-col justify-center overflow-hidden animated-gradient"
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
                "Resume reviewed by the founder",
                "£199 to start — £499 on placement",
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

          {/* ── RIGHT: Product preview ─────────────────────────────────────── */}
          <div className="hero-stagger-6 flex-1 relative flex justify-center lg:justify-end">
            {/* Layout container for overlapping cards */}
            <div className="relative" style={{ width: 360, height: 500 }}>

              {/* Main internship card — centerpiece */}
              <div className="absolute left-0 top-10">
                <InternshipCard />
              </div>

              {/* Score card — top right, floating accent */}
              <div
                className="absolute hidden sm:block"
                style={{ top: 0, right: -16, zIndex: 10 }}
              >
                <ScoreCard />
              </div>

              {/* Streak chip — bottom right accent */}
              <div
                className="absolute hidden sm:block"
                style={{ bottom: 20, right: -8, zIndex: 10 }}
              >
                <StreakChip />
              </div>

              {/* Interview session chip — bottom left accent */}
              <div
                className="absolute"
                style={{ bottom: 0, left: 8, zIndex: 10 }}
              >
                <div
                  className="rounded-2xl px-4 py-3 flex items-center gap-3 card-float"
                  style={{
                    background: "rgba(255,255,255,0.05)",
                    border: "1px solid rgba(255,255,255,0.10)",
                    backdropFilter: "blur(20px)",
                    boxShadow: "0 16px 40px rgba(0,0,0,0.5)",
                    animationDelay: "0.6s",
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: "linear-gradient(135deg, #2dec29 0%, #0a5c09 100%)" }}
                  >
                    <span className="text-sm">🤖</span>
                  </div>
                  <div>
                    <p className="text-white text-xs font-bold leading-none">AI Mock Interview</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2dec29" }} />
                      <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.35)" }}>Ready to practice</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Connecting glow between cards */}
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background:
                    "radial-gradient(ellipse at 60% 50%, rgba(45,236,41,0.06) 0%, transparent 70%)",
                }}
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
