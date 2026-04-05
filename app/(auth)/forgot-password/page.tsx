"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const supabase = createClient();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      {
        redirectTo: `${window.location.origin}/auth/callback?next=/app/settings`,
      }
    );

    if (resetError) {
      setError(resetError.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="text-center py-4">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-5"
          style={{
            background: "rgba(45,236,41,0.08)",
            border: "1px solid rgba(45,236,41,0.2)",
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              stroke="#2dec29"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-white mb-2">Check your email</h2>
        <p className="text-sm mb-6" style={{ color: "rgba(255,255,255,0.42)" }}>
          If an account exists for{" "}
          <span className="text-white font-medium">{email}</span>, we sent a
          password reset link.
        </p>
        <Link
          href="/login"
          className="text-sm font-semibold transition-colors"
          style={{ color: "#2dec29" }}
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Reset password</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-xs font-semibold uppercase tracking-wider"
            style={{ color: "rgba(255,255,255,0.45)" }}
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full h-11 px-4 rounded-xl text-sm outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.09)",
              color: "white",
            }}
            onFocus={(e) => {
              e.currentTarget.style.border = "1px solid rgba(45,236,41,0.45)";
              e.currentTarget.style.boxShadow = "0 0 0 3px rgba(45,236,41,0.08)";
            }}
            onBlur={(e) => {
              e.currentTarget.style.border = "1px solid rgba(255,255,255,0.09)";
              e.currentTarget.style.boxShadow = "none";
            }}
          />
        </div>

        {error && (
          <div
            className="rounded-xl px-4 py-3 text-sm"
            style={{
              background: "rgba(239,68,68,0.08)",
              border: "1px solid rgba(239,68,68,0.2)",
              color: "#fca5a5",
            }}
          >
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-11 rounded-xl font-bold text-sm transition-all disabled:opacity-50 mt-1"
          style={{
            background: loading ? "rgba(45,236,41,0.6)" : "#2dec29",
            color: "#071a09",
          }}
        >
          {loading ? "Sending…" : "Send Reset Link"}
        </button>
      </form>

      <p
        className="text-center text-sm mt-6"
        style={{ color: "rgba(255,255,255,0.38)" }}
      >
        Remember your password?{" "}
        <Link
          href="/login"
          className="font-semibold transition-colors"
          style={{ color: "#2dec29" }}
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
