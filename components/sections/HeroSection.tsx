"use client";

import { FC, useEffect, useState } from "react";
import { Button } from "../ui";
import { useComingSoon } from "../ComingSoonProvider";

export const HeroSection: FC = () => {
  const { openModal } = useComingSoon();
  const [userCount, setUserCount] = useState(400);

  useEffect(() => {
    // Animate counter from 400 to 500
    const duration = 2000;
    const increment = 100 / (duration / 16);
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= 100) {
        setUserCount(500);
        clearInterval(timer);
      } else {
        setUserCount(Math.floor(400 + current));
      }
    }, 16);

    return () => clearInterval(timer);
  }, []);

  return (
    <section
      aria-label="Hero — Conquer Interview Anxiety"
      className="min-h-screen flex items-center pt-28 md:pt-32 px-4 sm:px-6 lg:px-8 animated-gradient overflow-hidden"
    >
      <div className="max-w-6xl mx-auto w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div className="animate-fade-in">
            <div className="inline-flex items-center bg-white/80 backdrop-blur-sm px-4 py-2 rounded-full text-sm font-semibold mb-6 border border-neutral-200">
              <span className="relative flex h-3 w-3 mr-2" aria-hidden="true">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
              </span>
              <span className="text-secondary">
                Join <span className="counter font-bold">{userCount}+</span> beta
                users practicing now
              </span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black leading-tight mb-6 text-secondary">
              Conquer Your
              <span className="block">Interview
              Anxiety
              </span>
            </h1>
            <p className="text-xl text-neutral-800 mb-8 leading-relaxed">
              Practice behavioral &amp; technical interviews with AI and peers.{" "}
              <strong className="font-semibold text-secondary">
                Become confident and fluent.
              </strong>
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
              <Button size="lg" className="group" onClick={openModal}>
                Start Practicing Free
                <svg
                  className="w-5 h-5 ml-2 group-hover:translate-x-1 transition"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Button>
            </div>
            <div className="flex items-center space-x-6 text-sm text-neutral-600">
              <div className="flex items-center">
                <svg
                  className="w-5 h-5 text-secondary mr-2"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-secondary">
                  Free forever plan
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
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="font-medium text-secondary">
                  Cancel anytime
                </span>
              </div>
            </div>
          </div>

          {/* Hero Visual */}
          <div className="relative animate-slide-up animate-float">
            <div className="video-overlay bg-cream-dark rounded-2xl p-1">
              <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Hero Video */}
                <div className="relative aspect-video bg-neutral-900">
                  <video
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                    poster="/hero-image.png"
                    aria-label="MyInterview platform demo showing a live AI mock interview session"
                  >
                    <source src="/hero-video.mp4" type="video/mp4" />
                    {/* Fallback for browsers that don't support video */}
                    <img
                      src="/hero-image.png"
                      alt="MyInterview platform showing an AI mock interview session with real-time feedback and progress tracking"
                      className="w-full h-full object-cover"
                    />
                  </video>
                </div>

                {/* Session Info Cards */}
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center text-white font-bold">
                        P
                      </div>
                      <div>
                        <p className="font-semibold text-secondary">
                          Mark&apos;s Practice Session
                        </p>
                        <p className="text-sm text-neutral-500">
                          Mock Interview • Anxiety Support
                        </p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-xs font-semibold flex items-center">
                      <span className="w-2 h-2 bg-primary rounded-full mr-2 animate-pulse-slow"></span>
                      Live
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-cream rounded-lg p-3 text-center border border-neutral-200">
                      <p className="text-2xl font-bold text-secondary">12</p>
                      <p className="text-xs text-neutral-600 mt-1">Sessions</p>
                    </div>
                    <div className="bg-cream rounded-lg p-3 text-center border border-neutral-200">
                      <p className="text-2xl font-bold text-secondary">+58%</p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Improvement
                      </p>
                    </div>
                    <div className="bg-cream rounded-lg p-3 text-center border border-neutral-200">
                      <p className="text-2xl font-bold text-secondary">93%</p>
                      <p className="text-xs text-neutral-600 mt-1">
                        Had Anxiety
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Stats Cards */}
            <div className="absolute -left-4 top-1/4 bg-white rounded-xl shadow-lg p-4 animate-fade-in hidden lg:block border border-neutral-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cream rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">+58%</p>
                  <p className="text-xs text-neutral-600">Performance Gain</p>
                </div>
              </div>
            </div>

            <div
              className="absolute -right-4 bottom-1/4 bg-white rounded-xl shadow-lg p-4 animate-fade-in hidden lg:block border border-neutral-200"
              style={{ animationDelay: "0.2s" }}
            >
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-cream rounded-lg flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-2xl font-bold text-secondary">24/7</p>
                  <p className="text-xs text-neutral-600">
                    AI Practice Available
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
