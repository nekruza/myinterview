"use client";

import { FC } from "react";
import Link from "next/link";
import { track } from "@/lib/mixpanel";
import { Sparkles, ChevronRight, CornerDownLeft } from "lucide-react";

const FEATURE_PILLS = [
  {
    icon: (
      <svg width="14" height="14" fill="none" stroke="#2dec29" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    title: "Resume-tailored questions",
    desc: "Every question is built from your CV and the exact role you're applying for.",
  },
  {
    icon: (
      <svg width="14" height="14" fill="none" stroke="#2dec29" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
      </svg>
    ),
    title: "Job description-tailored interview",
    desc: "Paste the job description and the AI adapts every question to match that specific role.",
  },
  {
    icon: (
      <svg width="14" height="14" fill="none" stroke="#2dec29" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
        <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: "Instant feedback reports",
    desc: "After each session, see exactly what landed, what didn't, and what to fix next.",
  },
];

export const FeaturesSection: FC = () => {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(to bottom, #ffffff 0%, #f4fcf4 100%)" }}
    >
      <div className="max-w-6xl mx-auto">
        <div className="scroll-reveal text-center mb-14">
          <p className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: "#2dec29" }}>
            AI Practice Tool
          </p>
          <h2
            id="features-heading"
            className="text-4xl md:text-5xl font-black mb-4 text-secondary"
          >
            Your interview coach.<br className="hidden md:block" /> Available 24/7.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "#6b7280" }}>
            Practice out loud with a voice AI that knows your CV. Get scored. Repeat until you&apos;re ready.
          </p>
        </div>

        <div className="space-y-5">
          {/* Main AI coach card */}
          <div
            className="scroll-reveal relative rounded-3xl overflow-hidden"
            style={{ background: "#071a09", minHeight: "520px", transitionDelay: "0.08s" }}
          >
            {/* Glows */}
            <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "#2dec29" }} />
            <div className="pointer-events-none absolute bottom-0 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-[0.04]" style={{ background: "#2dec29" }} />

            {/* Video — left side */}
            <div className="relative h-72 md:h-80 select-none lg:absolute lg:inset-y-0 lg:left-0 lg:right-[56%] lg:h-auto overflow-hidden rounded-t-3xl rounded-b-none lg:rounded-l-3xl lg:rounded-r-none lg:rounded-b-3xl">
              <video
                src="/avatar_video.mp4"
                loop
                playsInline
                controls
                poster="/avatar_image.png"
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              <div className="absolute inset-y-0 right-0 w-48 pointer-events-none hidden lg:block" style={{ background: "linear-gradient(to left, #071a09 0%, rgba(7,26,9,0.8) 40%, transparent 100%)" }} />
            </div>

            {/* Annotation */}
            <div
              className="absolute z-20 pointer-events-none flex flex-col items-end gap-1 top-3 right-3 lg:top-[10%] lg:left-[28%] lg:right-auto"
            >
              <span
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "clamp(0.75rem, 2.2vw, 0.95rem)",
                  fontStyle: "italic",
                  fontWeight: 700,
                  transform: "rotate(-2deg)",
                  display: "inline-block",
                  color: "rgba(255,255,255,0.95)",
                  background: "rgba(255,255,255,0.12)",
                  border: "1px solid rgba(255,255,255,0.28)",
                  backdropFilter: "blur(8px)",
                  padding: "7px 14px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                you&apos;ll be practicing with him
              </span>
              <CornerDownLeft className="w-12 h-12 opacity-50 mr-8 font-thin relative -left-12 hidden lg:block" style={{ color: "white" }} />
            </div>

            {/* Floating question types card */}
            {/* <div className="absolute z-30 hidden lg:block" style={{ bottom: "-24px", right: "-24px" }}>
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(10,30,12,0.85)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  transform: "perspective(600px) rotateX(-2deg) rotateY(-2deg)",
                }}
              >
                <p className="text-[8px] uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>Question Types</p>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "#2dec29" }}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="#071a09" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-white">Behavioral</span>
                    </div>
                    <div className="flex gap-1">
                      {["Leadership", "Conflict"].map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{t}</span>)}
                    </div>
                  </div>
                  <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-white">Technical</span>
                    </div>
                    <div className="flex gap-1">
                      {["Data", "Algo", "System"].map(t => <span key={t} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{t}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Floating stats card */}
            {/* <div className="absolute z-30 hidden lg:block" style={{ top: "-28px", right: "-28px" }}>
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(10,30,12,0.85)",
                  border: "1px solid rgba(45,236,41,0.15)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
                  transform: "perspective(600px) rotateX(2deg) rotateY(-2deg)",
                }}
              >
                <p className="text-[8px] uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>See Your Confidence Grow</p>
                <div className="flex items-center gap-5">
                  <div>
                    <p className="text-2xl font-black leading-none" style={{ color: "#2dec29" }}>55–60%</p>
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Performance gain</p>
                  </div>
                  <div className="w-px h-7" style={{ background: "rgba(255,255,255,0.1)" }} />
                  <div>
                    <p className="text-2xl font-black leading-none" style={{ color: "#2dec29" }}>40%</p>
                    <p className="text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>Confidence impact</p>
                  </div>
                </div>
              </div>
            </div> */}

            {/* Right: content */}
            <div className="relative z-10 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:left-[46%] flex flex-col justify-center px-6 py-6 pb-8 lg:px-12 lg:py-10">
              <div className="flex flex-col gap-7 h-full justify-center">

                <div className="flex flex-col gap-4">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit"
                    style={{ background: "rgba(45,236,41,0.08)", border: "1px solid rgba(45,236,41,0.2)" }}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: "#2dec29" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2dec29" }}>AI Coach · 24/7</span>
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold leading-none mb-2" style={{ fontSize: "2.4rem" }}>
                      Practice Now
                    </h3>
                    <p className="text-sm" style={{ color: "rgba(255,255,255,0.35)" }}>
                      No scheduling. Start in under 60 seconds.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <p className="text-white font-semibold text-sm mb-1">How it works</p>
                  {[
                    { n: "1", label: "Upload your CV", sub: "Paste the role you're targeting" },
                    { n: "2", label: "Practice out loud", sub: "Voice AI asks the real questions" },
                    { n: "3", label: "Read your report", sub: "See exactly what to fix" },
                  ].map((step) => (
                    <div key={step.n} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <span className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0" style={{ background: "rgba(45,236,41,0.14)", color: "#2dec29" }}>{step.n}</span>
                      <div>
                        <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{step.label}</p>
                        <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.3)" }}>{step.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <Link
                  href="/app/practice"
                  onClick={() => track("landing_practice_now_clicked")}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-sm font-bold w-full lg:w-fit transition-all hover:brightness-110 hover:gap-3"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  Start free session
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>

          {/* Feature pills row */}
          <div className="grid md:grid-cols-3 gap-4">
            {FEATURE_PILLS.map((pill, i) => (
              <div
                key={pill.title}
                className="scroll-reveal flex items-start gap-4 rounded-2xl px-5 py-4"
                style={{
                  transitionDelay: `${i * 0.1}s`,
                  background: "linear-gradient(145deg, #071a09 0%, #0c1e0e 100%)",
                  border: "1px solid rgba(45,236,41,0.12)",
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: "rgba(45,236,41,0.10)", border: "1px solid rgba(45,236,41,0.2)" }}
                >
                  {pill.icon}
                </div>
                <div>
                  <p className="text-sm font-bold mb-0.5" style={{ color: "rgba(255,255,255,0.85)" }}>{pill.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{pill.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
