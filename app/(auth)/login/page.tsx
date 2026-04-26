"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/mixpanel";

export default function LoginPage() {
  return (
    <Suspense>
      <GoogleAuth />
    </Suspense>
  );
}

function GoogleAuth() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const nextParam = searchParams.get("next");
  const safeNext = nextParam && nextParam.startsWith("/") ? nextParam : "/app/dashboard";
  const supabase = createClient();

  async function handleGoogleSignIn() {
    setLoading(true);
    setError(null);
    track("Auth Started", { method: "google" });
    const callbackUrl = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNext)}`;
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: callbackUrl },
    });
    if (oauthError) {
      setError(oauthError.message);
      setLoading(false);
    }
  }

  return (
    <div>
      {/* Heading */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-white mb-2">Sign in or sign up</h1>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
          One click with Google. We&apos;ll create your account if you&apos;re new — or sign you in if you already have one.
        </p>
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 h-12 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
        style={{
          background: "#2dec29",
          color: "#071a09",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.filter = "brightness(0.95)")}
        onMouseLeave={(e) => (e.currentTarget.style.filter = "")}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" className="flex-shrink-0">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        {loading ? "Redirecting…" : "Continue with Google"}
      </button>

      {error && (
        <div
          className="mt-4 rounded-xl px-4 py-3 text-sm"
          style={{
            background: "rgba(239,68,68,0.08)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#fca5a5",
          }}
        >
          {error}
        </div>
      )}

      <p className="text-center text-xs mt-6" style={{ color: "rgba(255,255,255,0.32)" }}>
        Same button works for new and existing users — no separate sign-up step.
      </p>
    </div>
  );
}
