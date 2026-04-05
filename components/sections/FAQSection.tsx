"use client";

import { FC, useState } from "react";
import { WaitlistModal } from "@/components/WaitlistModal";
import { track } from "@/lib/mixpanel";

const FAQS = [
  {
    q: "Why is the internship unpaid?",
    a: "Real companies can't pay someone with no track record to contribute to their codebase. Paid internships go to people who already have experience — which is the catch-22 you're trying to escape. The unpaid placement is the mechanism that breaks that cycle: you ship real work, get code-reviewed by engineers, and build 3 months of genuine git history. That's worth infinitely more than another side project no one verifies.",
  },
  {
    q: "How does the £359 + £499 pricing work?",
    a: "£359 covers your place in the cohort and everything that comes with it — the internship placement, the CV rewrite, and the mock interview sessions. The £499 placement fee is charged only after you accept a paid job offer. If you don't land a job, you don't pay the £499. We only win when you win.",
  },
  {
    q: "What if I don't get a job at the end?",
    a: "You keep everything: the internship on your CV, the code you shipped, the improved resume, and all the practice sessions. The £499 success fee simply doesn't apply. We take the same risk you do — we don't get paid unless we deliver the outcome.",
  },
  {
    q: "What kinds of companies are the partner companies?",
    a: "Early-stage and scaling tech startups — the kind that genuinely need engineers but can't compete with Amazon salaries for experienced hires. Your work ships to real users. You'll contribute to features, attend code reviews, and deploy to production. Not busy-work, not tutorial repos.",
  },
  {
    q: "Do I need to be a CS graduate?",
    a: "No. The only requirement is that you can code. Bootcamp graduates, self-taught developers, and CS graduates all qualify. If you can build things and you can reason about code, you're eligible for Cohort 1.",
  },
  {
    q: "When does Cohort 1 start?",
    a: "We're forming the cohort now. Places are limited to keep the quality of placement and support high. Join the waitlist to lock your spot — you'll be contacted when the start date is confirmed.",
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
            The unpaid internship and pay-on-placement model are intentional — here&apos;s exactly how they work.
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
              Join the waitlist and we&apos;ll answer anything before you commit.
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
