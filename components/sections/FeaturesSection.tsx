"use client";

import { FC } from "react";
import Link from "next/link";

import { track } from "@/lib/mixpanel";
import { Sparkles, ChevronRight, CornerDownLeft } from "lucide-react";

export const FeaturesSection: FC = () => {
  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-white"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-20">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            For all engineers
          </p>
          <h2
            id="features-heading"
            className="text-5xl font-black mb-6 text-secondary"
          >
            Practive Interview with our AI Coach
          </h2>
          <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
            Resume-tailored questions + real voice AI + instant feedback reports + progress tracking
          </p>
        </div>

        <div className="space-y-12">
          {/* Full-width Practice Card */}
          <div
            className="relative rounded-3xl"
            style={{
              background: "#071a09",
              minHeight: "560px",
            }}
          >
            {/* Subtle right-side glow */}
            <div className="pointer-events-none absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl opacity-[0.06]" style={{ background: "#2dec29" }} />
            <div className="pointer-events-none absolute bottom-0 right-1/3 w-64 h-64 rounded-full blur-3xl opacity-[0.04]" style={{ background: "#2dec29" }} />

            {/* Video — left side */}
            <div className="relative h-90 md:h-72 select-none lg:absolute lg:inset-y-0 lg:left-0 lg:right-[56%] lg:h-auto overflow-hidden rounded-l-3xl rounded-r-3xl lg:rounded-r-none">
              <video
                src="/avatar_video.mp4"
                autoPlay
                loop
                playsInline
                controls
                className="absolute inset-0 w-full h-full object-cover object-top"
              />
              {/* Desktop right fade — wide and smooth */}
              <div className="absolute inset-y-0 right-0 w-48 pointer-events-none hidden lg:block" style={{ background: "linear-gradient(to left, #071a09 0%, rgba(7,26,9,0.8) 40%, transparent 100%)" }} />
            </div>

            {/* Annotation — sits inside video area, above the face */}
            <div
              className="absolute z-20 pointer-events-none flex-col items-end gap-1 hidden lg:flex"
              style={{ top: "10%", left: "28%" }}
            >
              <span
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: "0.85rem",
                  fontStyle: "italic",
                  fontWeight: 400,
                  transform: "rotate(-2deg)",
                  display: "inline-block",
                  color: "rgba(255,255,255,0.75)",
                  background: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  whiteSpace: "nowrap",
                }}
              >
                you&apos;ll be practicing with him
              </span>
              <CornerDownLeft className="w-12 h-12 opacity-50 mr-8 font-thin relative -left-12" style={{ color: "white" }} />
            </div>

            {/* Floating Behavioral/Technical card — bottom right, 3D lift */}
            <div
              className="absolute z-30 hidden lg:block"
              style={{ bottom: "-24px", right: "-24px" }}
            >
              <div
                className="rounded-2xl px-4 py-3"
                style={{
                  background: "rgba(10,30,12,0.85)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
                  transform: "perspective(600px) rotateX(-2deg) rotateY(-2deg)",
                }}
              >
                <p className="text-[8px] uppercase tracking-[0.2em] mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>Question Types</p>
                <div className="flex gap-3">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: "#2dec29" }}>
                        <svg className="w-2.5 h-2.5" fill="none" stroke="#071a09" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-white">Behavioral</span>
                    </div>
                    <div className="flex gap-1">
                      {["Leadership", "Conflict"].map(tag => <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{tag}</span>)}
                    </div>
                  </div>
                  <div className="w-px" style={{ background: "rgba(255,255,255,0.08)" }} />
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ background: "rgba(255,255,255,0.12)" }}>
                        <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /></svg>
                      </div>
                      <span className="text-[10px] font-semibold text-white">Technical</span>
                    </div>
                    <div className="flex gap-1">
                      {["Data", "Algo", "System"].map(tag => <span key={tag} className="text-[8px] px-1.5 py-0.5 rounded-full" style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.4)", border: "1px solid rgba(255,255,255,0.08)" }}>{tag}</span>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating stats card — top right, 3D lift */}
            <div
              className="absolute z-30 hidden lg:block"
              style={{ top: "-28px", right: "-28px" }}
            >
              <div
                className="rounded-2xl px-5 py-4"
                style={{
                  background: "rgba(10,30,12,0.85)",
                  border: "1px solid rgba(45,236,41,0.15)",
                  backdropFilter: "blur(16px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04), inset 0 1px 0 rgba(255,255,255,0.06)",
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
            </div>

            {/* Right: all content */}
            <div className="relative z-10 lg:absolute lg:right-0 lg:top-0 lg:bottom-0 lg:left-[46%] flex flex-col justify-center px-6 py-6 pb-8 lg:px-12 lg:py-10">
              <div className="flex flex-col gap-8 h-full justify-center">

                {/* Top: AI Coach badge + Practice Now heading */}
                <div className="flex flex-col gap-5">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full w-fit"
                    style={{ background: "rgba(45,236,41,0.08)", border: "1px solid rgba(45,236,41,0.2)" }}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: "#2dec29" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2dec29" }}>AI Coach · 24/7</span>
                  </div>
                  <div>
                    <h3 className="text-white font-extrabold leading-none mb-2" style={{ fontSize: "2.5rem" }}>Practice Now</h3>
                    <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>No scheduling. Start instantly.</p>
                  </div>
                </div>

                {/* Middle: Tailored to you */}
                <div className="flex flex-col gap-4">
                  <div>
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <p className="text-white font-bold text-sm">Tailored to you</p>
                      <span className="text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide" style={{ background: "rgba(45,236,41,0.1)", color: "#2dec29", border: "1px solid rgba(45,236,41,0.2)" }}>Personalised</span>
                    </div>
                    <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>Questions matched to your resume and exact role.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: "Resume", desc: "Upload your CV" },
                      { label: "Job Description", desc: "Paste or link the role" },
                      { label: "AI Questions", desc: "Get role-specific practice" },
                      { label: "Detailed Feedback", desc: "Instant report after each session" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                        <span className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0" style={{ background: "rgba(45,236,41,0.12)", color: "#2dec29" }}>{i + 1}</span>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: "rgba(255,255,255,0.85)" }}>{item.label}</p>
                          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.32)" }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom: CTA */}
                <div>
                  <Link
                    href="/app/practice"
                    onClick={() => track("landing_practice_now_clicked")}
                    className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold w-full lg:w-fit transition-all duration-200 hover:brightness-110 hover:gap-3 flex justify-center"
                    style={{ background: "#2dec29", color: "#071a09" }}
                  >
                    Start session
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
