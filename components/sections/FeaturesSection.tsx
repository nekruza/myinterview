"use client";

import { FC } from "react";
import Link from "next/link";
import { Badge } from "../ui";
import { track } from "@/lib/mixpanel";
import { Sparkles, ChevronRight } from "lucide-react";

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
            Our Solution
          </p>
          <h2
            id="features-heading"
            className="text-5xl font-black mb-6 text-secondary"
          >
            Everything You Need to Land the Offer
          </h2>
          <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
            Resume-tailored questions + real voice AI + instant feedback reports + progress tracking
          </p>
        </div>

        <div className="space-y-12">
          {/* Feature 1: AI & Peer Practice */}
          <div className="relative">
            {/* Bento Grid Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Large Card: AI Practice */}
              <Link
                href="/app/practice"
                onClick={() => track("landing_practice_now_clicked")}
                className="lg:col-span-2 group relative rounded-3xl overflow-hidden flex flex-col justify-between p-7 transition-all duration-300 hover:scale-[1.005] hover:shadow-2xl"
                style={{
                  background: "linear-gradient(160deg, #071a09 0%, #112914 50%, #0a2010 100%)",
                  minHeight: "288px",
                }}
              >
                {/* Glows */}
                <div className="pointer-events-none absolute -top-20 right-10 w-72 h-72 rounded-full blur-3xl opacity-[0.08]" style={{ background: "#2dec29" }} />
                <div className="pointer-events-none absolute bottom-0 left-0 w-56 h-56 rounded-full blur-3xl opacity-[0.07]" style={{ background: "#2dec29" }} />

                {/* Avatar */}
                <div className="absolute inset-y-0 right-0 w-[48%] pointer-events-none select-none">
                  <img
                    src="/image.png"
                    alt="AI Coach"
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    style={{ mixBlendMode: "multiply", filter: "contrast(1.05) brightness(1.5)" }}
                  />
                </div>


                {/* Top: badge + headline */}
                <div className="relative z-10 flex flex-col gap-3 max-w-[56%]">
                  <div
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit"
                    style={{ background: "#2dec2914", border: "1px solid #2dec2935" }}
                  >
                    <Sparkles className="w-3 h-3" style={{ color: "#2dec29" }} />
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#2dec29" }}>
                      AI Coach · 24/7
                    </span>
                  </div>
                  <h3 className="text-white font-extrabold leading-[1.1]" style={{ fontSize: "2rem" }}>
                    Practice<br />Now
                  </h3>
                  <p className="text-white/45 text-sm leading-relaxed">
                    No scheduling needed
                  </p>
                </div>

                {/* Desktop only: original absolute-centered annotation */}
                <div
                  className="absolute z-20 pointer-events-none flex-col items-start gap-1.5 hidden lg:flex"
                  style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
                >
                  <svg width="90" height="36" viewBox="0 0 90 36" fill="none" className="opacity-70 ml-14">
                    <path d="M4 30 C18 24, 44 14, 74 6" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M68 2 L76 6 L70 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span
                    className="text-white/85 whitespace-nowrap px-3 py-1.5 rounded-lg ml-1"
                    style={{
                      fontFamily: "Georgia, 'Times New Roman', serif",
                      fontSize: "0.95rem",
                      fontStyle: "italic",
                      fontWeight: 400,
                      letterSpacing: "0.01em",
                      transform: "rotate(-2deg)",
                      display: "inline-block",
                      background: "rgba(255,255,255,0.07)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }}
                  >
                    you&apos;ll be practicing with him
                  </span>
                </div>

                {/* Bottom: features + CTA */}
                <div className="relative z-10 flex flex-col gap-4 max-w-[56%]">
                  <ul className="flex flex-col gap-1.5">
                    {["Instant AI feedback", "R-STAR framework"].map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="flex-shrink-0">
                          <circle cx="6" cy="6" r="5.5" stroke="#2dec29" strokeOpacity="0.4"/>
                          <path d="M3.5 6l1.8 1.8L8.5 4.5" stroke="#2dec29" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                        <span className="text-white/55 text-xs">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="flex items-end gap-2.5">
                    <div
                      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold w-fit transition-all duration-200 group-hover:brightness-110 group-hover:gap-3 shrink-0"
                      style={{ background: "#2dec29", color: "#071a09" }}
                    >
                      Start session
                      <ChevronRight className="w-4 h-4" />
                    </div>
                    {/* Mobile only: annotation next to button */}
                    <div className="pointer-events-none flex flex-col items-start mb-0.5 lg:hidden">
                      <svg width="50" height="28" viewBox="0 0 50 28" fill="none" className="opacity-65 ml-2">
                        <path d="M4 24 C14 16, 28 8, 42 3" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                        <path d="M36 2 L43 3 L39 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      <span
                        className="text-white/85 whitespace-nowrap px-2 py-1 rounded-lg ml-1"
                        style={{
                          fontFamily: "Georgia, 'Times New Roman', serif",
                          fontSize: "0.7rem",
                          fontStyle: "italic",
                          fontWeight: 400,
                          letterSpacing: "0.01em",
                          background: "rgba(255,255,255,0.07)",
                          border: "1px solid rgba(255,255,255,0.15)",
                        }}
                      >
                        you&apos;ll be practicing with him
                      </span>
                    </div>
                  </div>
                </div>
              </Link>

              {/* Tailored Questions Card */}
              <div className="bg-cream rounded-3xl p-6 border-2 border-neutral-200 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-bold text-lg text-secondary">Tailored to you</h4>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-bold">Personalised</span>
                  </div>
                  <p className="text-sm text-neutral-600 mb-4">Questions tailored to your resume and the exact job you&apos;re applying for.</p>
                  <div className="space-y-3">
                    {[
                      { label: "Resume", desc: "Upload your CV" },
                      { label: "Job Description", desc: "Paste or link the role" },
                      { label: "AI Questions", desc: "Get role-specific practice" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white rounded-xl p-3 border border-neutral-200">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                        <div>
                          <p className="text-xs font-bold text-secondary">{item.label}</p>
                          <p className="text-xs text-neutral-500">{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <Link href="/signup" className="mt-6 block w-full bg-primary text-white py-2.5 rounded-xl text-sm font-semibold text-center hover:bg-secondary transition" onClick={() => track("CTA Clicked", { button: "Try it free", location: "features" })}>
                  Try it free →
                </Link>
              </div>

              {/* Interview Types Cards */}
              <div className="bg-primary/5 rounded-3xl p-6 border-2 border-primary/20">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-lg text-secondary">
                    Behavioral
                  </h4>
                </div>
                <p className="text-sm text-neutral-700 mb-4">
                  Master storytelling with the STAR method for behavioral
                  questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Leadership", "Conflict", "Impact"].map((tag) => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-white rounded-full text-xs font-semibold text-secondary border border-neutral-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technical Card */}
              <div className="lg:col-span-2 bg-cream rounded-3xl p-6 border-2 border-neutral-200">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-secondary rounded-xl flex items-center justify-center">
                    <svg
                      className="w-7 h-7 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                      />
                    </svg>
                  </div>
                  <h4 className="font-bold text-lg text-secondary">
                    Technical Problem-Solving
                  </h4>
                </div>
                <p className="text-sm text-neutral-700 mb-4">
                  Practice coding, system design, and problem-solving with
                  real-time feedback
                </p>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { title: "Data", subtitle: "Structures" },
                    { title: "Algo", subtitle: "rithms" },
                    { title: "System", subtitle: "Design" },
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white rounded-lg p-3 border border-neutral-200 text-center"
                    >
                      <p className="font-bold text-secondary text-lg mb-1">
                        {item.title}
                      </p>
                      <p className="text-xs text-neutral-600">
                        {item.subtitle}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {/* Feature 3: Progress Tracking */}
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div className="order-2 lg:order-1">
              <Badge variant="success" className="mb-6">
                PROGRESS TRACKING
              </Badge>
              <h3 className="text-4xl font-black mb-6 text-secondary">
                See Your Confidence Grow
              </h3>
              <p className="text-xl text-neutral-600 mb-8 leading-relaxed">
                Engineers are measurement-oriented. Track your improvement with
                confidence scores, competency radar charts, and milestone
                celebrations.
              </p>
              <div className="bg-green-50 rounded-2xl p-6 border border-green-200">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-4xl font-black text-green-600 mb-1">
                      55-60%
                    </p>
                    <p className="text-sm text-neutral-600">
                      Performance Improvement
                    </p>
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-black text-green-600 mb-1">
                      40%
                    </p>
                    <p className="text-sm text-neutral-600">
                      Confidence Affects Hiring
                    </p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 text-center">
                  Research shows 55-60% improvement with consistent mock
                  interview practice
                </p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <div className="bg-green-50 rounded-3xl p-8 shadow-2xl">
                <div className="bg-white rounded-2xl p-6">
                  <h4 className="font-bold text-xl mb-6 text-secondary">
                    Your Progress Dashboard
                  </h4>
                  <div className="space-y-6">
                    {[
                      { label: "Leadership", percent: 85, color: "bg-green-500" },
                      { label: "Conflict Resolution", percent: 72, color: "bg-blue-500" },
                      { label: "Ownership", percent: 91, color: "bg-purple-500" },
                      { label: "Failure Stories", percent: 68, color: "bg-orange-500" },
                    ].map((skill, i) => (
                      <div key={i}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-neutral-700">
                            {skill.label}
                          </span>
                          <span className="text-sm font-bold text-green-600">
                            {skill.percent}%
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 rounded-full h-3">
                          <div
                            className={`${skill.color} h-3 rounded-full`}
                            style={{ width: `${skill.percent}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-6 border-t border-neutral-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-2xl font-black text-secondary">18</p>
                        <p className="text-sm text-neutral-600">
                          Sessions Completed
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-green-600">
                          +57%
                        </p>
                        <p className="text-sm text-neutral-600">
                          Performance Gain
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-black text-purple-600">
                          93%
                        </p>
                        <p className="text-sm text-neutral-600">Had Anxiety</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
