"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/mixpanel";
import { WaitlistModal } from "@/components/WaitlistModal";

const TIERS = [
  {
    name: "Free",
    label: null,
    price: "£0",
    billing: null,
    description: "Kick the tyres before you commit",
    features: [
      { text: "3 full mock interviews", strong: true },
      { text: "Resume-tailored questions" },
      { text: "Instant feedback reports" },
      { text: "Behavioral & technical question bank" },
      { text: "Progress dashboard" },
    ],
    cta: "Start Free",
    href: "/signup",
    highlight: false,
  },
  {
    name: "Pro",
    label: "Most popular",
    price: "£13",
    billing: "Billed £39 every 3 months",
    description: "For engineers actively job hunting",
    features: [
      { text: "30 full mock interviews / month", strong: true },
      { text: "Resume-tailored questions" },
      { text: "Instant feedback reports" },
      { text: "Behavioral & technical question bank" },
      { text: "Progress dashboard" },
      { text: "Priority support" },
    ],
    cta: "Start Pro Trial",
    href: "/signup",
    highlight: true,
  },
];

const MAX_FEATURES = [
  { text: "Everything in Pro" },
  { text: "3-month unpaid internship at a partner company", strong: true, orange: true },
  { text: "Real git history, code reviews & deployments" },
  { text: "1-on-1 resume rewrite from a specialist" },
  { text: "AI voice interview practice" },
  { text: "Peer mock interviews with cohort members" },
];

const Check: FC<{ bright?: boolean }> = ({ bright }) => (
  <svg
    className="w-4 h-4 flex-shrink-0 mt-0.5"
    fill="none"
    stroke={bright ? "#2dec29" : "rgba(45,236,41,0.45)"}
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    viewBox="0 0 24 24"
  >
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

export const PricingSection: FC = () => {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <section
      id="pricing"
      aria-labelledby="pricing-heading"
      className="py-24 px-4 sm:px-6 lg:px-8"
      style={{ background: "linear-gradient(to bottom, #080c09 0%, #050e06 100%)" }}
    >
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="scroll-reveal text-center mb-14">
          <p className="font-bold text-sm uppercase tracking-wider mb-3" style={{ color: "#2dec29" }}>
            Pricing
          </p>
          <h2
            id="pricing-heading"
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ color: "#ffffff" }}
          >
            One path. Three entry points.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Start with free mock interviews. Upgrade when you&apos;re ready to go all in.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch">

          {/* Free + Pro */}
          {TIERS.map((tier, i) => (
            <div
              key={tier.name}
              className="scroll-reveal relative flex flex-col rounded-2xl p-7 overflow-hidden"
              style={tier.highlight ? {
                transitionDelay: `${i * 0.13}s`,
                background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
                border: "1.5px solid rgba(45,236,41,0.35)",
                boxShadow: "0 0 40px rgba(45,236,41,0.06)",
              } : {
                transitionDelay: `${i * 0.13}s`,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Glow */}
              {tier.highlight && (
                <div
                  className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20"
                  style={{ background: "#2dec29" }}
                />
              )}

              {/* Label */}
              <div className="h-6 mb-4">
                {tier.label && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                    style={{ background: "rgba(45,236,41,0.14)", color: "#2dec29", border: "1px solid rgba(45,236,41,0.25)" }}
                  >
                    {tier.label}
                  </span>
                )}
              </div>

              {/* Tier name */}
              <p
                className="text-sm font-bold uppercase tracking-widest mb-2"
                style={{ color: "rgba(255,255,255,0.35)" }}
              >
                {tier.name}
              </p>

              {/* Price */}
              <div className="mb-1 flex items-end gap-1">
                <span
                  className="text-5xl font-black leading-none"
                  style={{ color: tier.highlight ? "#ffffff" : "rgba(255,255,255,0.75)" }}
                >
                  {tier.price}
                </span>
                {tier.price !== "£0" && (
                  <span className="text-base mb-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                    /mo
                  </span>
                )}
              </div>
              {tier.billing && (
                <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.28)" }}>
                  {tier.billing}
                </p>
              )}
              <p
                className="text-sm mb-6"
                style={{ color: "rgba(255,255,255,0.38)" }}
              >
                {tier.description}
              </p>

              {/* Divider */}
              <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {tier.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check bright={tier.highlight} />
                    <span
                      className={`text-sm ${f.strong ? "font-semibold" : ""}`}
                      style={{ color: tier.highlight ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.5)" }}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => {
                  track("CTA Clicked", { button: tier.cta, location: "pricing", plan: tier.name });
                  router.push(tier.href);
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.99]"
                style={tier.highlight
                  ? { background: "#2dec29", color: "#061508" }
                  : { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" }
                }
              >
                {tier.cta}
              </button>
            </div>
          ))}

          {/* Max — career service card */}
          <div
            className="scroll-reveal relative flex flex-col rounded-2xl p-7 overflow-hidden"
            style={{
              transitionDelay: "0.26s",
              background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
              border: "1px solid rgba(45,236,41,0.22)",
            }}
          >
            {/* Ambient glow */}
            <div
              className="pointer-events-none absolute -bottom-10 -left-10 w-40 h-40 rounded-full blur-3xl opacity-15"
              style={{ background: "#2dec29" }}
            />

            <div className="relative z-10 flex flex-col flex-1">

              {/* Label */}
              <div className="h-6 mb-4">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(45,236,41,0.10)", color: "rgba(45,236,41,0.7)", border: "1px solid rgba(45,236,41,0.18)" }}
                >
                  Career Service
                </span>
              </div>

              {/* Tier name */}
              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.45)" }}>
                Max
              </p>

              {/* Pricing */}
              <div className="mb-1">
                <div className="flex items-end gap-1.5">
                  <span className="text-5xl font-black leading-none text-white">£359</span>
                  <span className="text-sm mb-1.5" style={{ color: "rgba(255,255,255,0.4)" }}>upfront</span>
                </div>
                <p className="text-sm font-semibold mt-1" style={{ color: "#2dec29" }}>
                  + £499 only when you land the job
                </p>
              </div>
              <p className="text-xs mb-6" style={{ color: "rgba(255,255,255,0.35)" }}>
                3-month programme · Pay on placement
              </p>

              {/* Divider */}
              <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />

              {/* Features */}
              <ul className="space-y-3 flex-1 mb-8">
                {MAX_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check bright />
                    <span
                      className={`text-sm ${f.strong ? "font-semibold" : ""}`}
                      style={{ color: f.orange ? "#fb923c" : "rgba(255,255,255,0.72)" }}
                    >
                      {f.text}
                      {f.orange && (
                        <span
                          className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded align-middle"
                          style={{ background: "rgba(251,146,60,0.15)", color: "#fb923c", border: "1px solid rgba(251,146,60,0.25)" }}
                        >
                          Unpaid
                        </span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={() => {
                  setModalOpen(true);
                  track("CTA Clicked", { button: "Join the Waitlist", location: "pricing", plan: "cohort" });
                }}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.99]"
                style={{ background: "#2dec29", color: "#061508" }}
              >
                Join the Waitlist
              </button>

            </div>
          </div>

        </div>

        {/* Bottom trust line */}
        <p className="text-center text-sm mt-10" style={{ color: "rgba(255,255,255,0.25)" }}>
          No credit card required · Cancel anytime · £499 placement fee only on success
        </p>

      </div>

      <WaitlistModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </section>
  );
};
