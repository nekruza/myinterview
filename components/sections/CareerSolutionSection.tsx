"use client";

import { FC, useState } from "react";
import { track } from "@/lib/mixpanel";
import { WaitlistModal } from "@/components/WaitlistModal";

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

const TERMINAL_LINES = [
  { prefix: "$", text: 'git commit -m "feat: add live user feed"', accent: false },
  { prefix: "✓", text: "Code review approved by senior engineer", accent: true },
  { prefix: "$", text: "git push origin main", accent: false },
  { prefix: "✓", text: "Deployed to production", accent: true },
  { prefix: "$", text: "npm run test -- --coverage", accent: false },
  { prefix: "✓", text: "All tests passing (94% coverage)", accent: true },
];

export const CareerSolutionSection: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      aria-labelledby="solution-heading"
      className="py-24 px-4 sm:px-6"
      style={{ background: "linear-gradient(to bottom, #080c09 0%, #ffffff 140px)" }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#2dec29" }}>
            3-Month Programme
          </p>
          <h2
            id="solution-heading"
            className="text-4xl md:text-5xl font-black mb-4 leading-tight"
            style={{ color: "#112715" }}
          >
            Join the Cohort.<br className="hidden md:block" /> Land the Job.
          </h2>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            From day one, you&apos;re placed at a partner company. Over 3 months, we work
            alongside you — improving your resume, preparing you for interviews, and giving
            you the proof of experience that gets you hired.{" "}
            <span className="font-semibold text-secondary">£199 upfront. £499 only when you land the job.</span>
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
                <p className="text-white text-2xl font-black leading-none">£199</p>
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
            className="rounded-3xl overflow-hidden grid md:grid-cols-[2fr_3fr]"
            style={{ background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)" }}
          >

            {/* Left panel — internship terminal visual */}
            <div
              className="p-8 md:p-10 flex flex-col justify-between min-h-[320px] relative"
              style={{ background: "rgba(45,236,41,0.04)", borderRight: "1px solid rgba(45,236,41,0.1)" }}
            >
              {/* Ambient glow */}
              <div
                className="pointer-events-none absolute -bottom-8 -left-8 w-48 h-48 rounded-full blur-3xl opacity-20"
                style={{ background: "#2dec29" }}
              />

              <div className="relative z-10 space-y-2.5">
                {/* Window chrome */}
                <div className="flex items-center gap-2 mb-5">
                  <span className="w-3 h-3 rounded-full bg-red-500/70" />
                  <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
                  <span className="w-3 h-3 rounded-full" style={{ background: "rgba(45,236,41,0.7)" }} />
                  <span className="ml-2 text-white/30 text-xs font-mono">internship-project</span>
                </div>

                {/* Terminal lines */}
                {TERMINAL_LINES.map((line, i) => (
                  <div key={i} className="flex items-start gap-2.5 font-mono text-sm">
                    <span
                      className="flex-shrink-0 font-semibold"
                      style={{ color: line.accent ? "#2dec29" : "rgba(255,255,255,0.35)" }}
                    >
                      {line.prefix}
                    </span>
                    <span style={{ color: line.accent ? "rgba(45,236,41,0.8)" : "rgba(255,255,255,0.45)" }}>
                      {line.text}
                    </span>
                  </div>
                ))}

                {/* Blinking cursor */}
                <div className="flex items-center gap-2.5 font-mono text-sm">
                  <span style={{ color: "rgba(255,255,255,0.35)" }}>$</span>
                  <span
                    className="inline-block w-1.5 h-4 rounded-sm animate-pulse"
                    style={{ background: "#2dec29", opacity: 0.6 }}
                  />
                </div>
              </div>

              {/* CV line */}
              <div
                className="relative z-10 mt-8 pt-5"
                style={{ borderTop: "1px solid rgba(45,236,41,0.15)" }}
              >
                <p className="text-[10px] font-mono uppercase tracking-widest mb-1.5" style={{ color: "rgba(45,236,41,0.5)" }}>
                  CV line
                </p>
                <p className="text-white/80 font-medium text-sm leading-relaxed">
                  &ldquo;Software Engineer Intern — contributed to a live social platform with real users&rdquo;
                </p>
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
                  Free to join · £199 to start when ready
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
