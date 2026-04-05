"use client";

import { FC, useState } from "react";
import { track } from "@/lib/mixpanel";
import { WaitlistModal } from "@/components/WaitlistModal";

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
      className="w-[280px] sm:w-[300px] rounded-2xl overflow-hidden card-float"
      style={{
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.10)",
        backdropFilter: "blur(24px)",
        boxShadow: "0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
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

      <div className="flex items-center justify-center py-2.5">
        <div className="flex flex-col items-center gap-0.5">
          <div className="w-px h-3" style={{ background: "rgba(255,255,255,0.1)" }} />
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </div>
      </div>

      <div className="px-5 pb-5">
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

const PILLARS = [
  {
    number: "1",
    title: "Unpaid internship at a partner company — from day one",
    description: "The moment you join the cohort, you're matched to one of our partner companies. You ship real features, get code-reviewed, and build 3 months of genuine git history — unpaid, but the experience is what gets you hired.",
    outcome: "Real experience",
    highlight: true,
  },
  {
    number: "2",
    title: "Individual resume feedback from a specialist",
    description: "Our specialist works with you one-on-one to rewrite and tailor your CV around your internship work — so it gets past ATS and lands you interviews.",
    outcome: "Get shortlisted",
    highlight: false,
  },
  {
    number: "3",
    title: "Interview practice with AI and your cohort",
    description: "Practice with our AI voice interviewer and run mock sessions with other people in the cohort. Real questions, real feedback — until you feel ready.",
    outcome: "Ace the screen",
    highlight: false,
  },
];


export const CareerSolutionSection: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      aria-labelledby="solution-heading"
      className="py-24 px-4 sm:px-6"
      style={{ background: "linear-gradient(to bottom, #080c09 0%, #080c09 52%, #ffffff 68%)" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="scroll-reveal text-center mb-14">
          <p className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#2dec29" }}>
            3-Month Programme
          </p>
          <h2
            id="solution-heading"
            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
            style={{ color: "#ffffff" }}
          >
            Join the Cohort.<br className="hidden md:block" /> Land the Job.
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            From day one, you&apos;re placed at a partner company. Over 3 months, we work
            alongside you — improving your resume, preparing you for interviews, and giving
            you the proof of experience that gets you hired.{" "}
            <span className="font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>£359 upfront. £499 only when you land the job.</span>
          </p>
        </div>

        {/* Card — relative for floating stat cards */}
        <div className="relative px-0 md:px-16">

          {/* Floating stat card — top right */}
          <div
            className="hidden md:block absolute -top-5 right-0 z-10 rounded-2xl px-5 py-4 shadow-2xl min-w-[180px]"
            style={{ background: "linear-gradient(145deg, #071a09 0%, #0d2410 100%)", border: "1px solid rgba(45,236,41,0.25)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#2dec29" }}>Pricing</p>
            <div className="flex items-end gap-3">
              <div>
                <p className="text-white text-2xl font-black leading-none">£359</p>
                <p className="text-white/50 text-xs mt-0.5">to start</p>
              </div>
              <div>
                <p className="text-white text-2xl font-black leading-none">£499</p>
                <p className="text-white/50 text-xs mt-0.5">on placement</p>
              </div>
            </div>
          </div>

          {/* Floating stat card — bottom right */}
          <div
            className="hidden md:block absolute -bottom-5 right-0 z-10 rounded-2xl px-5 py-4 shadow-2xl min-w-[180px]"
            style={{ background: "linear-gradient(145deg, #071a09 0%, #0d2410 100%)", border: "1px solid rgba(45,236,41,0.25)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color: "#2dec29" }}>Cohort 1 Goal</p>
            <p className="text-3xl font-black leading-none" style={{ color: "#2dec29" }}>100%</p>
            <p className="text-white/50 text-xs mt-1">job placement</p>
          </div>

          {/* Main card */}
          <div
            className="scroll-reveal rounded-3xl overflow-hidden grid md:grid-cols-[2fr_3fr]"
            style={{ background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)", transitionDelay: "0.1s" }}
          >

            {/* Left panel — floating product cards */}
            <div
              className="p-8 md:p-10 flex items-center justify-center min-h-[420px] relative overflow-hidden"
              style={{ background: "rgba(45,236,41,0.04)", borderRight: "1px solid rgba(45,236,41,0.1)" }}
            >
              {/* Ambient glow */}
              <div
                className="pointer-events-none absolute -bottom-8 -left-8 w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ background: "#2dec29" }}
              />
              <div
                className="pointer-events-none absolute inset-0 rounded-3xl"
                style={{
                  background: "radial-gradient(ellipse at 60% 50%, rgba(45,236,41,0.06) 0%, transparent 70%)",
                }}
              />

              <div className="relative" style={{ width: 320, height: 460 }}>
                {/* Main internship card */}
                <div className="absolute left-0 top-10 hero-card-main">
                  <InternshipCard />
                </div>

                {/* Score card — bottom right */}
                <div
                  className="absolute hidden sm:block hero-card-tr"
                  style={{ bottom: 0, right: -16, zIndex: 10 }}
                >
                  <ScoreCard />
                </div>

                {/* Streak chip */}
                <div
                  className="absolute hidden sm:block hero-card-br"
                  style={{ bottom: 80, left: 8, zIndex: 10 }}
                >
                  <StreakChip />
                </div>

                {/* AI Mock Interview chip */}
                <div
                  className="absolute hero-card-bl"
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
              </div>
            </div>

            {/* Right panel — pillars + CTA */}
            <div className="p-8 md:p-12 flex flex-col justify-center">

              {/* Badge */}
              <div
                className="inline-flex items-center gap-2 rounded-full px-3 py-1 mb-5 self-start"
                style={{ background: "rgba(45,236,41,0.12)", border: "1px solid rgba(45,236,41,0.25)" }}
              >
                <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: "#2dec29" }} />
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: "#2dec29" }}>
                  Career Service · End to End
                </span>
              </div>

              <h3 className="text-3xl md:text-4xl font-black text-white mb-2">
                From Graduate to Hired
              </h3>
              <p className="mb-8 text-sm" style={{ color: "rgba(255,255,255,0.45)" }}>
                No more rejection for &ldquo;lack of experience&rdquo;. We fix that.
              </p>

              {/* Pillars with step connector */}
              <div className="relative mb-8">

                <div className="space-y-2.5">
                  {PILLARS.map((pillar) => (
                    <div
                      key={pillar.number}
                      className="flex items-start gap-4 rounded-xl p-4 transition-colors duration-150"
                      style={pillar.highlight
                        ? { background: "rgba(45,236,41,0.12)", border: "1px solid rgba(45,236,41,0.3)" }
                        : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }
                      }
                    >
                      {/* Number badge */}
                      <span
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-black relative z-10"
                        style={pillar.highlight
                          ? { background: "#2dec29", color: "#061508" }
                          : { background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.55)" }
                        }
                      >
                        {pillar.number}
                      </span>

                      <div className="flex-1 min-w-0">
                        {/* Title + outcome tag */}
                        <div className="flex items-center gap-2 flex-wrap mb-0.5">
                          <p
                            className="font-bold text-sm"
                            style={{ color: pillar.highlight ? "#2dec29" : "white" }}
                          >
                            {pillar.title}
                          </p>
                          <span
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                            style={pillar.highlight
                              ? { background: "rgba(45,236,41,0.2)", color: "rgba(45,236,41,0.8)" }
                              : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.35)" }
                            }
                          >
                            → {pillar.outcome}
                          </span>
                        </div>
                        <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                          {pillar.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA + micro-copy */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <button
                  onClick={() => {
                    setModalOpen(true);
                    track("CTA Clicked", { button: "Join the Waitlist", location: "solution_section" });
                  }}
                  className="self-start flex items-center gap-2 px-6 py-3 font-black text-base rounded-xl hover:brightness-110 active:brightness-90 transition-all shadow-lg"
                  style={{ background: "#2dec29", color: "#061508" }}
                >
                  Join the Waitlist
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
                  Free to join · £359 to start when ready
                </p>
              </div>

            </div>
          </div>
        </div>
      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};
