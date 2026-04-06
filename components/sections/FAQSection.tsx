"use client";

import { FC, useState } from "react";
import { WaitlistModal } from "@/components/WaitlistModal";
import { track } from "@/lib/mixpanel";

const FAQS = [
  {
    q: "How does the AI mock interview work?",
    a: "You join a voice session with our AI interviewer, which asks you real interview questions and follows up based on your answers — just like a human interviewer would. After each session you get a detailed breakdown of your performance: communication, structure, content, and areas to improve.",
  },
  {
    q: "What kinds of interviews can I practice?",
    a: "Behavioral (competency-based), situational, and role-specific interviews across any industry. Whether you're going for a product manager role, a finance position, a sales job, or a tech role, the AI adapts its questions to the role and level you're targeting.",
  },
  {
    q: "How is this different from practicing in front of a mirror?",
    a: "The AI asks follow-up questions, pushes back on vague answers, and scores your responses in real time. It replicates the pressure of a real interview rather than letting you rehearse a script. You can't bluff your way through a follow-up.",
  },
  {
    q: "How realistic is the AI interviewer?",
    a: "It's trained on thousands of real interview transcripts and follows the same structured question frameworks used by hiring managers at top companies. Most users say the first session feels surprisingly close to the real thing.",
  },
  {
    q: "How many sessions do I get?",
    a: "That depends on your plan — details are in the pricing section above. You can practice as many times as you want within your plan, and each session is logged so you can track your improvement over time.",
  },
  {
    q: "When will I see results?",
    a: "Most users report noticeably more confident and structured answers within 3–5 sessions. The feedback after each session pinpoints exactly what to work on, so improvement is targeted rather than random.",
  },
];

export const FAQSection: FC = () => {
  const [open, setOpen] = useState<number | null>(0);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="faq"
      aria-labelledby="faq-heading"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(to bottom, #080c09 0%, #050e06 100%)" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="scroll-reveal mb-14 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
          <div>
            <p className="font-bold text-sm uppercase tracking-widest mb-3" style={{ color: "#2dec29" }}>
              FAQ
            </p>
            <h2
              id="faq-heading"
              className="text-4xl md:text-5xl font-black leading-tight"
              style={{ color: "#ffffff" }}
            >
              Questions you<br className="hidden md:block" /> probably have.
            </h2>
          </div>
          <p className="text-sm max-w-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
            Everything you need to know about how AI mock interviews work and what to expect.
          </p>
        </div>

        {/* Accordion */}
        <div
          className="scroll-reveal rounded-2xl overflow-hidden"
          style={{ border: "1px solid rgba(255,255,255,0.07)" }}
        >
          {FAQS.map((faq, i) => {
            const isOpen = open === i;
            return (
              <div
                key={i}
                style={{
                  borderBottom: i < FAQS.length - 1 ? "1px solid rgba(255,255,255,0.07)" : undefined,
                }}
              >
                <button
                  onClick={() => {
                    setOpen(isOpen ? null : i);
                    if (!isOpen) track("FAQ Opened", { question: faq.q });
                  }}
                  className="w-full flex items-start justify-between gap-6 px-6 py-5 text-left transition-colors duration-150"
                  style={{
                    background: isOpen
                      ? "rgba(45,236,41,0.04)"
                      : "rgba(255,255,255,0.02)",
                  }}
                  aria-expanded={isOpen}
                >
                  <span
                    className="text-sm font-semibold leading-snug"
                    style={{ color: isOpen ? "#ffffff" : "rgba(255,255,255,0.7)" }}
                  >
                    {faq.q}
                  </span>
                  <span
                    className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5 transition-all duration-200"
                    style={{
                      background: isOpen ? "#2dec29" : "rgba(255,255,255,0.08)",
                      transform: isOpen ? "rotate(45deg)" : "none",
                    }}
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke={isOpen ? "#071a09" : "rgba(255,255,255,0.5)"}
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                  </span>
                </button>

                {isOpen && (
                  <div
                    className="px-6 pb-5"
                    style={{ background: "rgba(45,236,41,0.04)" }}
                  >
                    <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.52)" }}>
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA strip */}
        <div
          className="scroll-reveal mt-10 rounded-2xl px-7 py-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-5"
          style={{
            transitionDelay: "0.15s",
            background: "linear-gradient(145deg, #0d2410 0%, #071a09 100%)",
            border: "1px solid rgba(45,236,41,0.18)",
          }}
        >
          <div>
            <p className="font-bold text-white text-base mb-1">Still have a question?</p>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
              Join the waitlist and we&apos;ll answer anything before your first session.
            </p>
          </div>
          <button
            onClick={() => {
              setModalOpen(true);
              track("CTA Clicked", { button: "Join the Waitlist", location: "faq_section" });
            }}
            className="flex-shrink-0 flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.98]"
            style={{ background: "#2dec29", color: "#071a09" }}
          >
            Join the Waitlist
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};
