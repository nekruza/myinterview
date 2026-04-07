"use client";

import { useState } from "react";
import { fireConversion } from "@/lib/conversion";
import { Sparkles, X, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { SESSION_PACKS } from "@/lib/session-limits";
import type { PackSize } from "@/lib/session-limits";

type Reason = "practice_limit" | "peer_limit" | "pro_required";

const CONTENT: Record<Reason, { title: string; description: string }> = {
  practice_limit: {
    title: "You've used all your sessions",
    description: "Buy a session pack to keep practising.",
  },
  peer_limit: {
    title: "No sessions remaining",
    description: "Buy a session pack to continue.",
  },
  pro_required: {
    title: "Sessions required",
    description: "You need sessions to use this feature.",
  },
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
  const [selected, setSelected] = useState<PackSize>(20);
  const content = CONTENT[reason];

  async function handleBuy() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessions: selected }),
      });
      if (!res.ok) throw new Error("Checkout failed");
      const data = await res.json();
      if (data.url) {
        fireConversion();
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }

  const selectedPack = SESSION_PACKS.find((p) => p.sessions === selected)!;

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
          {/* Pack selector */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wider">Choose a pack</p>
            <div className="grid grid-cols-3 gap-2">
              {SESSION_PACKS.map((pack) => {
                const perSession = (pack.priceGbp / pack.sessions).toFixed(2);
                const isSelected = selected === pack.sessions;
                return (
                  <button
                    key={pack.sessions}
                    onClick={() => setSelected(pack.sessions)}
                    className="flex flex-col items-center rounded-xl px-2 py-3 border transition-all"
                    style={{
                      background: isSelected ? "#f4fdf3" : "transparent",
                      borderColor: isSelected ? "#2dec29" : "#e5e7eb",
                    }}
                  >
                    <span className="text-lg font-black text-secondary">{pack.sessions}</span>
                    <span className="text-[10px] text-neutral-500 leading-tight">sessions</span>
                    <span className="text-sm font-bold text-secondary mt-1">£{pack.priceGbp}</span>
                    <span className="text-[10px] text-neutral-400">£{perSession}/ea</span>
                    {pack.label && (
                      <span className="text-[9px] font-bold mt-1 px-1.5 py-0.5 rounded-full" style={{ background: "#2dec29", color: "#112715" }}>
                        {pack.label}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Features */}
          <ul className="space-y-2">
            {["Resume-tailored questions", "Instant AI feedback reports", "Credits never expire"].map((f) => (
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
          </ul>

          {/* Pricing note */}
          <div className="rounded-xl px-4 py-3 border border-[#2dec29] bg-[#f4fdf3]">
            <p className="text-xs text-neutral-500 font-medium">One-time payment · no subscription</p>
            <p className="text-secondary font-bold text-sm">
              {selected} sessions — £{selectedPack.priceGbp}
            </p>
            <p className="text-xs text-neutral-400">≈ ${selectedPack.priceUsd} USD</p>
          </div>

          {/* CTA */}
          <button
            onClick={handleBuy}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
            style={{ background: "#2dec29", color: "#112715" }}
          >
            <Sparkles className="w-4 h-4" />
            {loading ? "Redirecting…" : `Buy ${selected} sessions — £${selectedPack.priceGbp}`}
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
