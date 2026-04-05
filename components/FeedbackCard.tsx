"use client";

import { useState } from "react";
import { MessageSquare, Star, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function FeedbackCard() {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<"bug" | "suggestion" | "other">("suggestion");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const supabase = createClient();

  const openDialog = () => {
    setSubmitted(false);
    setRating(0);
    setMessage("");
    setCategory("suggestion");
    setOpen(true);
  };

  const submit = async () => {
    if (!message.trim() && rating === 0) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from("user_feedback").insert({
        user_id: user?.id ?? null,
        session_id: null,
        rating: rating || null,
        message: message.trim() || null,
        category,
      });
      setSubmitted(true);
    } catch {
      toast.error("Could not submit feedback. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Card */}
      <button
        onClick={openDialog}
        className="group relative rounded-2xl overflow-hidden flex flex-col gap-4 p-5 text-left transition-all duration-200 hover:brightness-105 w-full"
        style={{
          background: "linear-gradient(145deg, #071a09 0%, #0d2410 60%, #061508 100%)",
          border: "1px solid rgba(45,236,41,0.12)",
        }}
      >
        {/* Ambient glow */}
        <div
          className="pointer-events-none absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-20"
          style={{ background: "#2dec29" }}
        />

        <div className="relative z-10 flex flex-col gap-4">
          {/* Icon */}
          <div
            className="w-11 h-11 rounded-2xl flex items-center justify-center"
            style={{
              background: "rgba(45,236,41,0.10)",
              border: "1px solid rgba(45,236,41,0.18)",
            }}
          >
            <MessageSquare className="w-5 h-5" style={{ color: "#2dec29" }} />
          </div>

          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="w-1 h-1 rounded-full"
                style={{ background: "#2dec29" }}
              />
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "rgba(45,236,41,0.65)" }}
              >
                Help us improve
              </span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">
              Give Feedback
            </h3>
            <p className="text-white/45 text-xs mt-1 leading-relaxed">
              Share a bug, suggestion, or tell us what you think
            </p>
          </div>

          <div
            className="flex items-center gap-1.5 text-sm font-bold transition-all duration-200 group-hover:gap-2.5"
            style={{ color: "#2dec29" }}
          >
            Share now
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </div>
        </div>
      </button>

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.45)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl"
            style={{ border: "1px solid rgba(0,0,0,0.06)" }}
          >
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto"
                  style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }}
                >
                  <CheckCircle className="w-6 h-6" style={{ color: "#2dec29" }} />
                </div>
                <p className="font-bold text-secondary text-lg">Thanks for your feedback!</p>
                <p className="text-sm text-neutral-500">We read every submission and use it to improve.</p>
                <button
                  onClick={() => setOpen(false)}
                  className="mt-2 px-5 py-2 rounded-xl text-sm font-semibold border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
                >
                  Close
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-base font-bold text-secondary">Share your feedback</h2>
                  <button
                    onClick={() => setOpen(false)}
                    className="text-neutral-300 hover:text-neutral-500 transition text-xl leading-none w-7 h-7 flex items-center justify-center rounded-lg hover:bg-neutral-100"
                  >
                    &times;
                  </button>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                    How&apos;s the app?
                  </p>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110 active:scale-95"
                      >
                        <Star
                          className="w-7 h-7 transition-colors"
                          style={{
                            color: star <= rating ? "#f59e0b" : "#e5e7eb",
                            fill: star <= rating ? "#f59e0b" : "none",
                          }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                    Type
                  </p>
                  <div className="flex gap-2">
                    {(["suggestion", "bug", "other"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium transition capitalize"
                        style={{
                          border: category === c ? "1.5px solid #2dec29" : "1.5px solid transparent",
                          background: category === c
                            ? "linear-gradient(135deg, #f0fdf4, #dcfce7)"
                            : "#f9fafb",
                          color: category === c ? "#112715" : "#6b7280",
                          boxShadow: category === c ? "0 0 0 3px rgba(45,236,41,0.08)" : "none",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-neutral-400 uppercase tracking-widest mb-2">
                    Message
                  </p>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us what you think, what's broken, or what you'd love to see..."
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                  />
                </div>

                <button
                  onClick={submit}
                  disabled={submitting || (!message.trim() && rating === 0)}
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition-all hover:brightness-110 disabled:opacity-40"
                  style={{ background: "#2dec29", color: "#071a09" }}
                >
                  {submitting ? "Submitting…" : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
