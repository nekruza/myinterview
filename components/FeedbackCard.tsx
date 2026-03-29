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
        className="group relative rounded-2xl overflow-hidden flex flex-col gap-4 p-5 text-left hover:opacity-95 transition-opacity w-full"
        style={{ background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 60%, #0f0f1a 100%)" }}
      >
        <div
          className="pointer-events-none absolute -bottom-6 -right-6 w-32 h-32 rounded-full blur-2xl opacity-20"
          style={{ background: "#818cf8" }}
        />
        <div className="relative z-10 flex flex-col gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center"
            style={{ background: "rgba(129,140,248,0.12)" }}
          >
            <MessageSquare className="w-6 h-6" style={{ color: "#818cf8" }} />
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-[10px] font-bold uppercase tracking-widest"
                style={{ color: "#818cf8" }}
              >
                Help us improve
              </span>
            </div>
            <h3 className="text-white font-bold text-lg leading-tight">Give Feedback</h3>
            <p className="text-white/50 text-xs mt-1 leading-relaxed">
              Share a bug, suggestion, or tell us what you think
            </p>
          </div>
          <div
            className="flex items-center gap-1 text-sm font-bold"
            style={{ color: "#818cf8" }}
          >
            Share now
          </div>
        </div>
      </button>

      {/* Dialog */}
      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.4)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-xl">
            {submitted ? (
              <div className="text-center py-6 space-y-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto" style={{ background: "#f4fdf3" }}>
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
                  <button onClick={() => setOpen(false)} className="text-neutral-400 hover:text-neutral-600 transition text-xl leading-none">&times;</button>
                </div>

                {/* Rating */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">How&apos;s the app?</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button key={star} onClick={() => setRating(star)}>
                        <Star
                          className="w-7 h-7 transition"
                          style={{ color: star <= rating ? "#f59e0b" : "#e5e7eb", fill: star <= rating ? "#f59e0b" : "none" }}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Type</p>
                  <div className="flex gap-2">
                    {(["suggestion", "bug", "other"] as const).map((c) => (
                      <button
                        key={c}
                        onClick={() => setCategory(c)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition capitalize"
                        style={{
                          borderColor: category === c ? "#2dec29" : "transparent",
                          background: category === c ? "#f4fdf3" : "#f9fafb",
                          color: category === c ? "#112715" : "#6b7280",
                        }}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div className="mb-5">
                  <p className="text-xs font-semibold text-neutral-500 uppercase tracking-wide mb-2">Message</p>
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
                  className="w-full py-2.5 rounded-xl font-bold text-sm transition disabled:opacity-40"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {submitting ? "Submitting..." : "Submit Feedback"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
