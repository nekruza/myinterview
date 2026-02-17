"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
      <div className="rounded-3xl p-8 shadow-lg border-2 border-neutral-200 bg-white text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-black text-secondary mb-2">
          Check Your Email
        </h2>
        <p className="text-neutral-600 mb-6">
          If an account exists for <strong>{email}</strong>, we sent a password
          reset link.
        </p>
        <Link
          href="/login"
          className="text-primary hover:underline font-semibold"
        >
          Back to Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl p-8 shadow-lg border-2 border-neutral-200 bg-white">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-secondary mb-2">
          Reset Password
        </h1>
        <p className="text-neutral-600">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="h-11"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={loading}>
          {loading ? "Sending..." : "Send Reset Link"}
        </Button>
      </form>

      <p className="text-center text-sm text-neutral-600 mt-6">
        Remember your password?{" "}
        <Link
          href="/login"
          className="text-primary hover:underline font-semibold"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
