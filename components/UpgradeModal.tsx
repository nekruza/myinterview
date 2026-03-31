"use client";

import { useState } from "react";
import { Sparkles, X, Zap, Infinity } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";

type Reason = "practice_limit" | "peer_limit" | "pro_required";

const CONTENT: Record<Reason, { title: string; description: string; features: string[] }> = {
  practice_limit: {
    title: "You've used all 3 free sessions",
    description: "Upgrade to keep practicing with AI interview sessions.",
    features: ["Unlimited AI practice sessions", "Unlimited peer session joins", "Create & host peer meetings"],
  },
  peer_limit: {
    title: "You've used all 3 free peer joins",
    description: "Upgrade to join unlimited peer practice sessions.",
    features: ["Unlimited AI practice sessions", "Unlimited peer session joins", "Create & host peer meetings"],
  },
  pro_required: {
    title: "Pro plan required",
    description: "Creating and hosting peer practice sessions is a Pro feature.",
    features: ["Host unlimited peer meetings", "Unlimited AI practice sessions", "Unlimited peer session joins"],
  },
};

const PLANS = [
  {
    key: "pro" as const,
    label: "Pro",
    monthlyPrice: "$19",
    yearlyPrice: "$9.50",
    yearlyTotal: "$114",
    sessions: "30 sessions/mo",
  },
  {
    key: "max" as const,
    label: "Max",
    monthlyPrice: "$49",
    yearlyPrice: "$24.50",
    yearlyTotal: "$294",
    sessions: "100 sessions/mo",
  },
];

export function UpgradeModal({
  open,
  onClose,
  reason,
}: {
  open: boolean;
  onClose: () => void;
  reason: Reason;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "max">("pro");
  const [billing, setBilling] = useState<"monthly" | "yearly">("monthly");
  const content = CONTENT[reason];
  const plan = PLANS.find((p) => p.key === selectedPlan)!;
  const displayPrice = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
          interval: billing === "yearly" ? "year" : "month",
        }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl p-0 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4" style={{ background: "#112715" }}>
          <div className="flex items-start justify-between gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: "#2dec29" }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "#112715" }} />
            </div>
            <button
              onClick={onClose}
              className="text-white/40 hover:text-white/70 transition mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-white font-bold text-lg mt-4 leading-snug">
            {content.title}
          </h2>
          <p className="text-white/60 text-sm mt-1 leading-relaxed">
            {content.description}
          </p>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">
          {/* Features */}
          <ul className="space-y-2.5">
            {content.features.map((f) => (
              <li key={f} className="flex items-center gap-2.5 text-sm text-secondary">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: "#f4fdf3" }}
                >
                  <Zap className="w-3 h-3" style={{ color: "#2dec29" }} />
                </span>
                {f}
              </li>
            ))}
            <li className="flex items-center gap-2.5 text-sm text-secondary">
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ background: "#f4fdf3" }}
              >
                <Infinity className="w-3 h-3" style={{ color: "#2dec29" }} />
              </span>
              And much more
            </li>
          </ul>

          {/* Plan selector */}
          <div className="grid grid-cols-2 gap-2">
            {PLANS.map((p) => (
              <button
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                className={`rounded-xl px-3 py-3 text-left border transition-all ${
                  selectedPlan === p.key
                    ? "border-[#2dec29] bg-[#f4fdf3]"
                    : "border-neutral-200 bg-neutral-50 hover:border-neutral-300"
                }`}
              >
                <p className="text-xs text-neutral-500 font-medium">{p.label}</p>
                <p className="text-secondary font-bold text-sm">
                  {billing === "yearly" ? p.yearlyPrice : p.monthlyPrice}/mo
                </p>
                <p className="text-xs text-neutral-400">{p.sessions}</p>
              </button>
            ))}
          </div>

          {/* Billing toggle */}
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center bg-neutral-100 rounded-full p-0.5 gap-0.5 text-xs">
              <button
                onClick={() => setBilling("monthly")}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  billing === "monthly"
                    ? "bg-white text-secondary shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBilling("yearly")}
                className={`px-3 py-1.5 rounded-full font-semibold transition-all ${
                  billing === "yearly"
                    ? "bg-white text-secondary shadow-sm"
                    : "text-neutral-500"
                }`}
              >
                Yearly
              </button>
            </div>
            {billing === "yearly" && (
              <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                Save 50% — Billed {plan.yearlyTotal}/yr
              </span>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={handleUpgrade}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
            style={{ background: "#2dec29", color: "#112715" }}
          >
            <Sparkles className="w-4 h-4" />
            {loading
              ? "Redirecting…"
              : `Upgrade to ${plan.label} — ${displayPrice}/mo`}
          </button>

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-neutral-400 hover:text-neutral-600 transition py-1"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
