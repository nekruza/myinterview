"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "../ui";
import { track } from "@/lib/mixpanel";

export const PricingSection: FC = () => {
  const router = useRouter();
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");

  const tiers = [
    {
      name: "Free",
      monthlyPrice: "$0",
      yearlyPrice: "$0",
      yearlyTotal: null,
      description: "Perfect to get started",
      features: [
        { text: "3 interviews to get started", bold: true },
        { text: "Behavioral & technical questions", bold: false },
        { text: "Progress dashboard", bold: false },
      ],
      cta: "Start Free",
      href: "/signup",
      variant: "outline" as const,
      popular: false,
    },
    {
      name: "Pro",
      monthlyPrice: "$19",
      yearlyPrice: "$9.50",
      yearlyTotal: "$114",
      description: "Serious about landing offers",
      features: [
        { text: "30 interviews per month", bold: true },
        { text: "Behavioral & technical questions", bold: false },
        { text: "Progress dashboard", bold: false },
        { text: "Priority support", bold: false },
        { text: "Interview prep resources", bold: false },
      ],
      cta: "Start Pro Trial",
      href: "/signup",
      variant: "primary" as const,
      popular: true,
    },
    {
      name: "Max",
      monthlyPrice: "$49",
      yearlyPrice: "$24.50",
      yearlyTotal: "$294",
      description: "For the most serious candidates",
      features: [
        { text: "100 interviews per month", bold: true },
        { text: "Behavioral & technical questions", bold: false },
        { text: "Progress dashboard", bold: false },
        { text: "Priority support", bold: false },
        { text: "Interview prep resources", bold: false },
      ],
      cta: "Get Max",
      href: "/signup",
      variant: "secondary" as const,
      popular: false,
    },
  ];

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="py-24 px-4 sm:px-6 lg:px-8 bg-neutral-50"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <p className="text-primary font-bold text-sm uppercase tracking-wider mb-3">
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="text-5xl font-black mb-6 text-secondary"
          >
            Start Free, Upgrade When Ready
          </h2>
          <p className="text-xl text-neutral-600 mb-8">
            Start with 3 free interviews. Upgrade for 30 per month.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center bg-neutral-200 rounded-full p-1 gap-1">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all ${
                billing === "monthly"
                  ? "bg-white text-secondary shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-semibold transition-all flex items-center gap-2 ${
                billing === "yearly"
                  ? "bg-white text-secondary shadow-sm"
                  : "text-neutral-500 hover:text-neutral-700"
              }`}
            >
              Yearly
              <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded-full">
                Save 50%
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {tiers.map((tier, index) => {
            const displayPrice =
              billing === "yearly" && tier.yearlyPrice !== tier.monthlyPrice
                ? tier.yearlyPrice
                : tier.monthlyPrice;
            const showYearlyLabel = billing === "yearly" && tier.yearlyTotal !== null;

            return (
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
                        {displayPrice}
                      </span>
                      {displayPrice !== "$0" && (
                        <span
                          className={`text-xl ${
                            tier.popular ? "text-white/80" : "text-neutral-600"
                          }`}
                        >
                          /mo
                        </span>
                      )}
                    </div>
                    {showYearlyLabel && (
                      <p
                        className={`text-sm font-medium ${
                          tier.popular ? "text-white/70" : "text-neutral-500"
                        }`}
                      >
                        Billed {tier.yearlyTotal}/yr
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
                        billing,
                      });
                      router.push(tier.href);
                    }}
                  >
                    {tier.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
