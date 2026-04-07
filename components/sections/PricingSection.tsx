"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/mixpanel";
import { SESSION_PACKS } from "@/lib/session-limits";
import type { PackSize } from "@/lib/session-limits";

const PACK_50_FEATURES = [
  { text: "50 full mock interviews", strong: true },
  { text: "Resume-tailored questions" },
  { text: "Job description-tailored interview" },
  { text: "Instant feedback reports" },
  { text: "Progress dashboard" },
  { text: "Credits never expire" },
  { text: "Save 42% vs starter pack" },
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
  const [selectedPack, setSelectedPack] = useState<PackSize>(20);
  const [buyLoading, setBuyLoading] = useState(false);

  async function handleBuyPack(sessions: PackSize) {
    setBuyLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions }),
      });
      if (res.status === 401) {
        router.push("/signup");
        return;
      }
      const data = await res.json();
      if (data.url) {
        track("CTA Clicked", { button: "Buy Sessions", location: "pricing", sessions });
        window.location.href = data.url;
      }
    } finally {
      setBuyLoading(false);
    }
  }

  const activePack = SESSION_PACKS.find((p) => p.sessions === selectedPack)!;
  const packTotal = activePack.priceGbp;
  const packPerSession = (activePack.priceGbp / activePack.sessions).toFixed(2);

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
            Pay only for what you use.
          </h2>
          <p className="text-lg max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
            Start with 3 free sessions. Top up whenever you need more — no subscriptions.
          </p>
        </div>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-5 items-stretch">

          {/* Free trial card */}
          <div
            className="scroll-reveal relative flex flex-col rounded-2xl p-7 overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div className="h-6 mb-4" />

            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              Free trial
            </p>

            <div className="mb-1 flex items-end gap-1">
              <span className="text-5xl font-black leading-none" style={{ color: "rgba(255,255,255,0.75)" }}>
                £0
              </span>
            </div>
            <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
              No credit card required
            </p>
            <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.38)" }}>
              Kick the tyres before you commit
            </p>

            <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />

            <ul className="space-y-3 flex-1 mb-8">
              {[
                { text: "3 full mock interviews", strong: true },
                { text: "Resume-tailored questions" },
                { text: "Instant feedback reports" },
                { text: "Progress dashboard" },
              ].map((f, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <Check />
                  <span className={`text-sm ${f.strong ? "font-semibold" : ""}`} style={{ color: "rgba(255,255,255,0.5)" }}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => {
                track("CTA Clicked", { button: "Start Free", location: "pricing" });
                router.push("/signup");
              }}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.99]"
              style={{ background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.75)", border: "1px solid rgba(255,255,255,0.1)" }}
            >
              Start Free
            </button>
          </div>

          {/* Session pack card */}
          <div
            className="scroll-reveal relative flex flex-col rounded-2xl p-7 overflow-hidden"
            style={{
              transitionDelay: "0.13s",
              background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
              border: "1.5px solid rgba(45,236,41,0.35)",
              boxShadow: "0 0 40px rgba(45,236,41,0.06)",
            }}
          >
            <div
              className="pointer-events-none absolute -top-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-20"
              style={{ background: "#2dec29" }}
            />

            <div className="h-6 mb-4">
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "rgba(45,236,41,0.14)", color: "#2dec29", border: "1px solid rgba(45,236,41,0.25)" }}
              >
                Most popular
              </span>
            </div>

            <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>
              Session credits
            </p>

            <div className="mb-1 flex items-end gap-1">
              <span className="text-5xl font-black leading-none text-white">
                £{SESSION_PACKS[0].priceGbp}
              </span>
            </div>
            <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.38)" }}>
              Top up whenever you need more practice
            </p>

            {/* Pack selector */}
            <div className="grid grid-cols-2 gap-2 mb-6">
              {SESSION_PACKS.filter((p) => p.sessions !== 50).map((pack) => {
                const isSelected = selectedPack === pack.sessions;
                return (
                  <button
                    key={pack.sessions}
                    onClick={() => setSelectedPack(pack.sessions)}
                    className="flex flex-col items-center rounded-xl px-1 py-2.5 border transition-all"
                    style={{
                      background: isSelected ? "rgba(45,236,41,0.15)" : "rgba(255,255,255,0.04)",
                      borderColor: isSelected ? "rgba(45,236,41,0.55)" : "rgba(255,255,255,0.1)",
                    }}
                  >
                    <span className="text-base font-black text-white">{pack.sessions}</span>
                    <span className="text-[9px] text-white/40">sessions</span>
                    <span className="text-xs font-bold text-white mt-0.5">£{pack.priceGbp}</span>
                    {pack.label && (
                      <span className="text-[8px] font-bold mt-1 px-1 py-0.5 rounded" style={{ background: "rgba(45,236,41,0.2)", color: "#2dec29" }}>
                        {pack.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />

            <ul className="space-y-3 flex-1 mb-8">
              {[
                { text: `${selectedPack} full mock interviews`, strong: true },
                { text: "Resume-tailored questions" },
                { text: "Job description-tailored interview" },
                { text: "Instant feedback reports" },
                { text: "Progress dashboard" },
                { text: "Credits never expire" },
              ].map((f, j) => (
                <li key={j} className="flex items-start gap-2.5">
                  <Check bright />
                  <span className={`text-sm ${f.strong ? "font-semibold" : ""}`} style={{ color: "rgba(255,255,255,0.75)" }}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => handleBuyPack(selectedPack)}
              disabled={buyLoading}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
              style={{ background: "#2dec29", color: "#061508" }}
            >
              {buyLoading ? "Redirecting…" : `Buy ${selectedPack} sessions — £${packTotal}`}
            </button>
          </div>


          {/* 50-session featured card */}
          <div
            className="scroll-reveal relative flex flex-col rounded-2xl p-7 overflow-hidden"
            style={{
              transitionDelay: "0.26s",
              background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
              border: "1.5px solid rgba(45,236,41,0.45)",
              boxShadow: "0 0 80px rgba(45,236,41,0.10), 0 8px 48px rgba(0,0,0,0.5)",
            }}
          >
            <div
              className="pointer-events-none absolute top-0 inset-x-0 h-px"
              style={{ background: "linear-gradient(90deg, transparent 5%, #2dec29 35%, #86efac 65%, transparent 95%)" }}
            />
            <div
              className="pointer-events-none absolute -bottom-12 -left-12 w-56 h-56 rounded-full blur-3xl opacity-25"
              style={{ background: "#2dec29" }}
            />
            <div
              className="pointer-events-none absolute -top-8 -right-8 w-32 h-32 rounded-full blur-3xl opacity-10"
              style={{ background: "#86efac" }}
            />

            <div className="relative z-10 flex flex-col flex-1">
              <div className="h-6 mb-4">
                <span
                  className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "rgba(45,236,41,0.16)", color: "#2dec29", border: "1px solid rgba(45,236,41,0.32)" }}
                >
                  Best value
                </span>
              </div>

              <p className="text-sm font-bold uppercase tracking-widest mb-2" style={{ color: "rgba(255,255,255,0.55)" }}>
                Full prep
              </p>

              <div className="mb-1 flex items-end gap-1.5">
                <span className="text-5xl font-black leading-none text-white">£29</span>
              </div>
              <p className="text-xs mt-0.5 mb-1" style={{ color: "rgba(255,255,255,0.4)" }}>
                ≈ $37 USD · one-time payment
              </p>
              <p className="text-sm font-semibold mt-1 mb-6" style={{ color: "#2dec29" }}>
                50 sessions · £0.58/session
              </p>

              <div className="h-px mb-6" style={{ background: "rgba(255,255,255,0.07)" }} />

              <ul className="space-y-3 flex-1 mb-8">
                {PACK_50_FEATURES.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <Check bright />
                    <span
                      className={`text-sm ${f.strong ? "font-semibold" : ""}`}
                      style={{ color: "rgba(255,255,255,0.72)" }}
                    >
                      {f.text}
                    </span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleBuyPack(50)}
                disabled={buyLoading}
                className="w-full py-3.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
                style={{ background: "#2dec29", color: "#061508" }}
              >
                {buyLoading ? "Redirecting…" : "Buy 50 sessions — £29"}
              </button>
            </div>
          </div>

        </div>

        {/* Bottom trust line */}
        <p className="text-center text-sm mt-10" style={{ color: "rgba(255,255,255,0.25)" }}>
          No subscription · Credits never expire · One-time payment
        </p>

      </div>
    </section>
  );
};
