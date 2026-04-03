"use client";

import { FC } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui";
import { track } from "@/lib/mixpanel";

export const PricingSection: FC = () => {
  const router = useRouter();

  const tiers = [
    {
      name: "Free",
      price: "£0",
      billingNote: null,
      description: "Try it before you commit",
      features: [
        { text: "3 full mock interviews", bold: true },
        { text: "Resume-tailored questions", bold: false },
        { text: "Instant feedback reports", bold: false },
        { text: "Behavioral & technical question bank", bold: false },
        { text: "Progress dashboard", bold: false },
      ],
      cta: "Start Free",
      href: "/signup",
      variant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      price: "£13",
      billingNote: "Billed £39 every 3 months",
      description: "For engineers actively job hunting",
      features: [
        { text: "30 full mock interviews per month", bold: true },
        { text: "Resume-tailored questions", bold: false },
        { text: "Instant feedback reports", bold: false },
        { text: "Behavioral & technical question bank", bold: false },
        { text: "Progress dashboard", bold: false },
        { text: "Priority support", bold: false },
      ],
      cta: "Start Pro Trial",
      href: "/signup",
      variant: "primary" as const,
      popular: true,
    },
  ];

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50"
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="text-5xl font-black mb-6 text-secondary"
          >
            Start Free. Interview Smarter.
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            Start with 3 free full mock interviews — resume-tailored, voice-powered, with instant feedback.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {tiers.map((tier, index) => (
            <div
              key={index}
              className={`relative ${
                tier.popular
                  ? "bg-secondary text-white rounded-3xl p-8 shadow-2xl md:transform md:scale-105 border-2 border-primary"
                  : "shadow-lg rounded-2xl border border-primary-200 p-8 "
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-5 left-1/2 transform -translate-x-1/2 bg-black text-white px-6 py-2 rounded-full text-sm font-black shadow-lg">
                  MOST POPULAR
                </div>
              )}
              <div
                className={
                  tier.popular
                    ? "[background:none] [border:none] shadow-none p-0"
                    : ""
                }
              >
                <div className="text-center mb-8">
                  <h3
                    className={`text-2xl font-bold mb-4 ${
                      tier.popular ? "text-white" : "text-secondary"
                    }`}
                  >
                    {tier.name}
                  </h3>
                  <div className="mb-1">
                    <span
                      className={`text-6xl font-black ${
                        tier.popular ? "text-white" : "text-secondary"
                      }`}
                    >
                      {tier.price}
                    </span>
                    {tier.price !== "£0" && (
                      <span
                        className={`text-xl ${
                          tier.popular ? "text-white/80" : "text-neutral-600"
                        }`}
                      >
                        /mo
                      </span>
                    )}
                  </div>
                  {tier.billingNote && (
                    <p
                      className={`text-sm font-medium ${
                        tier.popular ? "text-white/70" : "text-neutral-500"
                      }`}
                    >
                      {tier.billingNote}
                    </p>
                  )}
                  <p
                    className={`mt-2 ${
                      tier.popular ? "text-white/80" : "text-neutral-600"
                    }`}
                  >
                    {tier.description}
                  </p>
                </div>
                <ul className="space-y-4 mb-8">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start">
                      <svg
                        className={`w-6 h-6 ${
                          tier.popular ? "text-white" : "text-green-500"
                        } mr-3 flex-shrink-0 mt-0.5`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span
                        className={`${
                          tier.popular ? "text-white" : "text-neutral-700"
                        } ${feature.bold ? "font-bold" : ""}`}
                      >
                        {feature.text}
                      </span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={tier.variant}
                  className={`w-full py-4 text-lg ${
                    tier.popular ? "bg-white text-black hover:bg-neutral-100" : ""
                  }`}
                  onClick={() => {
                    track("CTA Clicked", {
                      button: tier.cta,
                      location: "pricing",
                      plan: tier.name,
                    });
                    router.push(tier.href);
                  }}
                >
                  {tier.cta}
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
