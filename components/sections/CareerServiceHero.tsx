"use client";

import { FC, useState } from "react";
import { track } from "@/lib/mixpanel";
import { WaitlistModal } from "@/components/WaitlistModal";

export const CareerServiceHero: FC = () => {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="hero-section"
      aria-label="Career Service — Land Your First Engineering Job"
      className="min-h-screen flex items-start pt-28 md:pt-32 px-4 sm:px-6 lg:px-8 animated-gradient overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-center items-start text-center">
          <div id="hero-content" className="animate-fade-in max-w-2xl">

            {/* Badge */}
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-neutral-200">
              <span className="relative flex h-3 w-3 mr-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary" />
              </span>
              <span className="text-secondary">Now Enrolling — Cohort 1</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-secondary">
              Land Your First
              <span className="block">Engineering Job</span>
            </h1>

            {/* Subheadline */}
            <p className="text-xl text-neutral-800 mb-8 leading-relaxed">
              A complete programme for graduates who can code but can&apos;t get hired —
              resume review, AI mock interviews, and a{" "}
              <strong className="font-semibold text-secondary">real internship on your CV.</strong>
            </p>

            {/* Trust bullets */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-neutral-700 mb-10">
              {[
                "Real internship on your CV",
                "Resume review by the founder",
                "£199 to start — £499 when you land the job",
              ].map((point) => (
                <div key={point} className="flex items-center gap-2">
                  <svg className="w-5 h-5 text-secondary flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="font-medium text-secondary">{point}</span>
                </div>
              ))}
            </div>

            {/* CTA */}
            <button
              onClick={() => {
                track("CTA Clicked", { button: "Join the Waitlist", location: "hero" });
                setModalOpen(true);
              }}
              className="px-8 py-4 bg-secondary text-white font-black text-lg rounded-xl hover:brightness-95 active:brightness-90 transition-all shadow-lg"
            >
              Join the Waitlist
            </button>

            {/* Secondary link */}
            <p className="mt-6 text-sm text-neutral-500">
              Just want to practice interviews?{" "}
              <a href="/signup" className="text-secondary font-semibold hover:underline">
                Try the free tool →
              </a>
            </p>

          </div>
        </div>
      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};
