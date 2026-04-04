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
    features: ["30 AI practice sessions per month", "30 peer session joins per month", "Create & host peer meetings"],
  },
  peer_limit: {
    title: "You've used all 3 free peer joins",
    description: "Upgrade to join more peer practice sessions.",
    features: ["30 AI practice sessions per month", "30 peer session joins per month", "Create & host peer meetings"],
  },
  pro_required: {
    title: "Pro plan required",
    description: "Creating and hosting peer practice sessions is a Pro feature.",
    features: ["Host peer meetings", "30 AI practice sessions per month", "30 peer session joins per month"],
  },
};

const PLAN = {
  key: "pro" as const,
  label: "Pro",
  price: "£13",
  billingNote: "Billed £39 every 3 months",
  sessions: "30 sessions/mo",
};

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
  const content = CONTENT[reason];

  async function handleUpgrade() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: "pro",
          interval: "quarter",
        }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.url) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).gtag_report_conversion?.(data.url);
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

          {/* Plan info */}
          <div className="rounded-xl px-4 py-3 border border-[#2dec29] bg-[#f4fdf3]">
            <p className="text-xs text-neutral-500 font-medium">{PLAN.label}</p>
            <p className="text-secondary font-bold text-sm">
              {PLAN.price}/mo
            </p>
            <p className="text-xs text-neutral-400">{PLAN.billingNote} · {PLAN.sessions}</p>
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
              : `Upgrade to Pro — ${PLAN.price}/mo`}
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
