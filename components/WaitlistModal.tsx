"use client";

import { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { track } from "@/lib/mixpanel";
import { fireSignupConversion } from "@/lib/conversion";

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

const VALUE_PROPS = [
  { icon: "🏢", label: "Real internship on your CV" },
  { icon: "📄", label: "1-on-1 CV rewrite" },
  { icon: "🤖", label: "AI mock interview practice" },
];

export const WaitlistModal: FC<WaitlistModalProps> = ({ open, onClose }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleOpenChange(isOpen: boolean) {
    if (!isOpen) {
      setName("");
      setEmail("");
      setPhone("");
      setLoading(false);
      setSubmitted(false);
      setError(null);
      onClose();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.");
        return;
      }

      track("Waitlist Joined", { location: "waitlist_modal" });
      fireSignupConversion();
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="sm:max-w-md border-0 p-0 overflow-hidden"
        style={{
          background: "linear-gradient(145deg, #0d2410 0%, #071a09 60%, #061508 100%)",
          border: "1px solid rgba(45,236,41,0.22)",
          boxShadow: "0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(45,236,41,0.08)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl opacity-20"
          style={{ background: "#2dec29" }}
        />
        <div
          className="pointer-events-none absolute -bottom-12 -left-12 w-40 h-40 rounded-full blur-3xl opacity-10"
          style={{ background: "#2dec29" }}
        />

        <div className="relative z-10 p-7">
          {submitted ? (
            /* ── Success state ─────────────────────────────────────── */
            <div className="py-4 text-center">
              {/* Animated checkmark ring */}
              <div className="relative mx-auto mb-6 w-20 h-20">
                <div
                  className="absolute inset-0 rounded-full animate-ping opacity-20"
                  style={{ background: "#2dec29" }}
                />
                <div
                  className="relative w-20 h-20 rounded-full flex items-center justify-center"
                  style={{
                    background: "rgba(45,236,41,0.12)",
                    border: "2px solid rgba(45,236,41,0.4)",
                  }}
                >
                  <svg className="w-9 h-9" fill="none" stroke="#2dec29" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                </div>
              </div>

              <p className="text-2xl font-black text-white mb-2">You&apos;re on the list.</p>
              <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.45)" }}>
                We&apos;ll be in touch within 48 hours to confirm your place in Cohort 1.
              </p>

              {/* What to expect */}
              <div
                className="rounded-xl px-4 py-4 text-left space-y-2.5"
                style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: "rgba(255,255,255,0.3)" }}>
                  What happens next
                </p>
                {[
                  "We review your application",
                  "You get a confirmation call",
                  "Cohort placement confirmed",
                ].map((step, i) => (
                  <div key={step} className="flex items-center gap-3">
                    <span
                      className="w-5 h-5 rounded-full text-[9px] font-black flex items-center justify-center flex-shrink-0"
                      style={{ background: "rgba(45,236,41,0.15)", color: "#2dec29" }}
                    >
                      {i + 1}
                    </span>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.55)" }}>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* ── Form state ────────────────────────────────────────── */
            <>
              {/* Header */}
              <DialogHeader className="mb-5">
                {/* Cohort badge */}
                <div className="flex items-center gap-2 mb-4">
                  <div
                    className="inline-flex items-center gap-2 rounded-full px-3 py-1"
                    style={{ background: "rgba(45,236,41,0.1)", border: "1px solid rgba(45,236,41,0.22)" }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: "#2dec29" }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "#2dec29" }}>
                      Cohort 1 · Limited Places
                    </span>
                  </div>
                </div>

                <DialogTitle className="text-2xl font-black text-white leading-tight">
                  Reserve your spot.
                </DialogTitle>
                <DialogDescription className="text-sm mt-1.5" style={{ color: "rgba(255,255,255,0.42)" }}>
                  We&apos;ll be in touch within 48 hours to confirm.
                </DialogDescription>
              </DialogHeader>

              {/* Value props row */}
              <div className="flex gap-2 mb-5">
                {VALUE_PROPS.map((v) => (
                  <div
                    key={v.label}
                    className="flex-1 rounded-xl px-2.5 py-2.5 text-center"
                    style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                  >
                    <span className="text-base block mb-1">{v.icon}</span>
                    <p className="text-[9px] leading-tight" style={{ color: "rgba(255,255,255,0.42)" }}>{v.label}</p>
                  </div>
                ))}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="flex flex-col gap-2.5">
                {[
                  { type: "text", placeholder: "Full Name", value: name, onChange: (v: string) => setName(v), label: "Full Name" },
                  { type: "email", placeholder: "Email Address", value: email, onChange: (v: string) => setEmail(v), label: "Email Address" },
                  { type: "tel", placeholder: "Phone Number", value: phone, onChange: (v: string) => setPhone(v), label: "Phone Number" },
                ].map((field) => (
                  <input
                    key={field.placeholder}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={field.value}
                    onChange={(e) => field.onChange(e.target.value)}
                    required
                    aria-label={field.label}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all"
                    style={{
                      background: "rgba(255,255,255,0.06)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#ffffff",
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(45,236,41,0.45)";
                      e.currentTarget.style.background = "rgba(45,236,41,0.05)";
                      e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,236,41,0.08)";
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.border = "1px solid rgba(255,255,255,0.1)";
                      e.currentTarget.style.background = "rgba(255,255,255,0.06)";
                      e.currentTarget.style.boxShadow = "none";
                    }}
                  />
                ))}

                {error && (
                  <p className="text-xs px-1" style={{ color: "#f87171" }}>{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-6 font-black text-sm rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-1 hover:brightness-110 active:scale-[0.99]"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  {loading ? "Joining…" : "Join the Waitlist →"}
                </button>

                <p className="text-center text-[10px] mt-1" style={{ color: "rgba(255,255,255,0.22)" }}>
                  £359 to start · £499 only when you land the job
                </p>
              </form>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
