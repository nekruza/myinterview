"use client";

import { FC } from "react";
import Link from "next/link";
import { Badge } from "../ui";
import { track } from "@/lib/mixpanel";

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
            Everything You Need to Succeed
          </h2>
          <p className="text-xl text-neutral-700 max-w-3xl mx-auto">
            AI practice + anxiety techniques + behavioral &amp; technical
            prep + progress tracking
          </p>
        </div>

        <div className="space-y-12">
          {/* Feature 1: AI & Peer Practice */}
          <div className="relative">
            {/* Bento Grid Layout */}
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Large Card: AI Practice */}
              <div className="lg:col-span-2 bg-secondary rounded-3xl p-8 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <div className="inline-flex items-center space-x-2 mb-6">
                    <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <span className="font-bold text-lg">AI Practice</span>
                    <span className="px-2 py-1 bg-green-500 text-white text-xs rounded-full font-bold">
                      INSTANT
                    </span>
                  </div>
                  <p className="text-xl mb-6 text-white/90">
                    Start practicing immediately with AI for behavioral &
                    technical questions. Available 24/7.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-3xl font-black mb-1">∞</p>
                      <p className="text-sm text-white/70">Practice Sessions</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-4 backdrop-blur-sm">
                      <p className="text-3xl font-black mb-1">24/7</p>
                      <p className="text-sm text-white/70">Available</p>
                    </div>
                  </div>
                </div>
              </div>

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
