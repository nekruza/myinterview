"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui";
import { track } from "@/lib/mixpanel";

export const HeroSection: FC = () => {
  const router = useRouter();

  return (
    <section
      id="hero-section"
      aria-label="Hero — Practice the Interview You're Actually About to Take"
      className="min-h-screen flex items-start pt-28 md:pt-32 px-4 sm:px-6 lg:px-8 animated-gradient overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="flex justify-center items-start text-center">
          <div id="hero-content" className="animate-fade-in">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-neutral-200">
              <span className="relative flex h-3 w-3 mr-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-secondary">
                AI that reads your resume &amp; job description
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-secondary">
              Practice the Interview
              <span className="block">You&apos;re Actually About to Take</span>
            </h1>
            <p className="text-xl text-neutral-800 mb-8 leading-relaxed">
              Get AI mock interviews tailored to your exact role —{" "}
              <strong className="font-semibold text-secondary">
                real voice, real feedback, zero judgment.
              </strong>
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-neutral-600">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-secondary mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-secondary">
                  Resume-tailored questions
                </span>
              </div>
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-secondary mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-secondary">
                  Instant feedback reports
                </span>
              </div>
            </div>
          </div>


        </div>
      </div>
    </section>
  );
};
