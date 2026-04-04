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

interface WaitlistModalProps {
  open: boolean;
  onClose: () => void;
}

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
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black text-secondary">
            Join the Waitlist
          </DialogTitle>
          <DialogDescription className="text-neutral-600">
            Cohort 1 is filling up. Reserve your spot — we&apos;ll be in touch within 48 hours.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-6 text-center">
            <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-xl font-black text-secondary mb-1">You&apos;re on the list!</p>
            <p className="text-neutral-600 text-sm">We&apos;ll be in touch soon.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-2">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              aria-label="Full Name"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email Address"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              aria-label="Phone Number"
              className="w-full px-4 py-3 rounded-xl border border-neutral-300 bg-white text-neutral-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
            />
            {error && (
              <p className="text-sm text-red-500">{error}</p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-secondary text-white font-black text-base rounded-xl hover:brightness-95 active:brightness-90 transition-all disabled:opacity-60 disabled:cursor-not-allowed mt-1"
            >
              {loading ? "Joining..." : "Join the Waitlist"}
            </button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
