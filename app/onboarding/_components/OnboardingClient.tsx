"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Sparkles,
} from "lucide-react";

// ─── Types ───────────────────────────────────────────────────────────────────

type OnboardingData = {
  full_name: string;
  age: string;
  experience_level: string;
  interview_style: string;
  interview_duration: string;
  practice_partner: string;
  target_role: string;
  heard_from: string;
};

const TOTAL_STEPS = 3;
const STEP_TITLES = ["About You", "Your Preferences", "One last thing"];
const STEP_SUBTITLES = [
  "Tell us a bit about yourself so we can tailor your experience from day one.",
  "Helps us generate the right questions for your target role and interview style — the more specific, the better.",
  "Takes one second and helps us grow the right way.",
];

// ─── Shared primitives ────────────────────────────────────────────────────────

function OptionCard({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl border-2 transition-all duration-150 text-left w-full",
        selected
          ? "border-primary bg-primary/10"
          : "border-neutral-200 bg-white/70 hover:border-neutral-300 hover:bg-neutral-50/80"
      )}
    >
      {emoji && <span className="text-base leading-none">{emoji}</span>}
      <span className="text-sm font-semibold text-secondary flex-1">{label}</span>
      <span
        className={cn(
          "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
          selected ? "border-primary bg-primary" : "border-neutral-300"
        )}
      >
        {selected && <Check size={10} strokeWidth={3} className="text-secondary" />}
      </span>
    </button>
  );
}

function Chip({
  label,
  emoji,
  selected,
  onClick,
}: {
  label: string;
  emoji?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 text-sm font-semibold transition-all duration-150",
        selected
          ? "border-primary bg-primary/15 text-secondary"
          : "border-neutral-200 bg-white/70 text-neutral-500 hover:border-neutral-300"
      )}
    >
      {emoji && <span>{emoji}</span>}
      {label}
    </button>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-2.5">
      {children}
    </p>
  );
}

// ─── Step 1: About You ────────────────────────────────────────────────────────

function StepAboutYou({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  return (
    <div className="space-y-6 mt-4">
      <div>
        <SectionLabel>Your Name</SectionLabel>
        <input
          type="text"
          value={data.full_name}
          onChange={(e) => update("full_name", e.target.value)}
          placeholder="e.g. Alex Johnson"
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition placeholder:text-neutral-400"
        />
      </div>
      <div>
        <SectionLabel>Your Age</SectionLabel>
        <input
          type="number"
          value={data.age}
          onChange={(e) => update("age", e.target.value)}
          placeholder="e.g. 27"
          min={16}
          max={80}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition placeholder:text-neutral-400"
        />
      </div>
      <div>
        <SectionLabel>Experience Level</SectionLabel>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: "student", label: "Student / Graduate", emoji: "🎓" },
            { value: "junior", label: "Junior (0–2 years)", emoji: "🌱" },
            { value: "mid", label: "Mid-level (2–5 years)", emoji: "💼" },
            { value: "senior", label: "Senior (5+ years)", emoji: "🚀" },
            { value: "staff", label: "Staff / Lead / Manager", emoji: "⭐" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              {...opt}
              selected={data.experience_level === opt.value}
              onClick={() => update("experience_level", opt.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 2: Preferences ──────────────────────────────────────────────────────

function StepPreferences({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  return (
    <div className="space-y-6 mt-4">
      <div>
        <SectionLabel>Target Role</SectionLabel>
        <input
          type="text"
          value={data.target_role}
          onChange={(e) => update("target_role", e.target.value)}
          placeholder="e.g. Software Engineer, Product Manager, Consultant..."
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition placeholder:text-neutral-400"
        />
      </div>
      <div>
        <SectionLabel>Preferred Interview Style</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "behavioral", label: "Behavioral", emoji: "🧠" },
            { value: "technical", label: "Technical", emoji: "💻" },
            { value: "case", label: "Case Study", emoji: "📊" },
            { value: "mixed", label: "Mixed", emoji: "🎯" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              {...opt}
              selected={data.interview_style === opt.value}
              onClick={() => update("interview_style", opt.value)}
            />
          ))}
        </div>
      </div>
      <div>
        <SectionLabel>Preferred Session Duration</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "15", label: "15 min", emoji: "⚡" },
            { value: "30", label: "30 min", emoji: "📅" },
            { value: "45", label: "45 min", emoji: "⏱️" },
            { value: "60+", label: "60 min+", emoji: "🕐" },
          ].map((opt) => (
            <Chip
              key={opt.value}
              {...opt}
              selected={data.interview_duration === opt.value}
              onClick={() => update("interview_duration", opt.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Where did you hear about us? ────────────────────────────────────

function StepHeardFrom({
  data,
  update,
}: {
  data: OnboardingData;
  update: <K extends keyof OnboardingData>(k: K, v: OnboardingData[K]) => void;
}) {
  return (
    <div className="mt-4">
      <SectionLabel>Where did you hear about us?</SectionLabel>
      <div className="grid grid-cols-1 gap-2">
        {[
          { value: "google", label: "Google / Search", emoji: "🔍" },
          { value: "friend", label: "Friend or Colleague", emoji: "🤝" },
          { value: "twitter", label: "Twitter / X", emoji: "𝕏" },
          { value: "linkedin", label: "LinkedIn", emoji: "💼" },
          { value: "reddit", label: "Reddit", emoji: "🟠" },
          { value: "youtube", label: "YouTube", emoji: "▶️" },
          { value: "other", label: "Somewhere else", emoji: "✨" },
        ].map((opt) => (
          <OptionCard
            key={opt.value}
            {...opt}
            selected={data.heard_from === opt.value}
            onClick={() => update("heard_from", opt.value)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Done screen ──────────────────────────────────────────────────────────────

function StepDone() {
  return (
    <div
      className="min-h-screen flex items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #071a09 0%, #0d2410 60%, #061508 100%)" }}
    >
      {/* Dot grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(45,236,41,0.06) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Ambient glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full blur-3xl pointer-events-none"
        style={{ background: "rgba(45,236,41,0.07)" }}
      />
      <div className="relative z-10 text-center px-6">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{
            background: "rgba(45,236,41,0.10)",
            border: "1px solid rgba(45,236,41,0.25)",
          }}
        >
          <CheckCircle className="w-8 h-8" style={{ color: "#2dec29" }} />
        </div>
        <h2 className="text-2xl font-black text-white mb-2">You&apos;re all set!</h2>
        <p className="text-sm" style={{ color: "rgba(255,255,255,0.42)" }}>
          Taking you to your dashboard…
        </p>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function OnboardingClient() {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    full_name: "",
    age: "",
    experience_level: "",
    interview_style: "",
    interview_duration: "",
    practice_partner: "ai",
    target_role: "",
    heard_from: "",
  });

  const update = <K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const saveAndFinish = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setSaveError("Not authenticated. Please refresh and try again.");
        setSaving(false);
        return;
      }

      const { data: saved, error: upsertError } = await supabase
        .from("profiles")
        .upsert({
          id: user.id,
          full_name: data.full_name.trim() || null,
          age: data.age ? parseInt(data.age, 10) : null,
          experience_level: data.experience_level || null,
          interview_style: data.interview_style || null,
          interview_duration: data.interview_duration || null,
          practice_partner: data.practice_partner,
          target_role: data.target_role.trim() || null,
          heard_from: data.heard_from || null,
          onboarding_complete: true,
        })
        .select("onboarding_complete")
        .single();

      if (upsertError || !saved?.onboarding_complete) {
        setSaveError("Something went wrong saving your preferences. Please try again.");
        setSaving(false);
        return;
      }

      setDone(true);
    } catch {
      setSaveError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => {
      window.location.href = "/app/dashboard";
    }, 1500);
    return () => clearTimeout(t);
  }, [done]);

  if (done) return <StepDone />;

  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg, #faf9f6 0%, #f5f4f0 100%)" }}>
      {/* Progress bar */}
      <div className="h-1 bg-neutral-200 w-full flex-shrink-0">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, background: "#2dec29" }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: personalisation hint ── */}
        <div
          className="hidden md:flex w-80 lg:w-96 flex-shrink-0 flex-col justify-between px-8 py-10 overflow-hidden relative"
          style={{
            background: "linear-gradient(160deg, #071a09 0%, #0a1f0b 55%, #040d05 100%)",
          }}
        >
          {/* Dot grid */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle, rgba(45,236,41,0.06) 1px, transparent 1px)",
              backgroundSize: "26px 26px",
            }}
          />
          {/* Ambient glow */}
          <div
            className="pointer-events-none absolute bottom-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-15"
            style={{ background: "#2dec29" }}
          />

          {/* Top: logo/brand mark */}
          <div className="relative z-10">
            <div className="text-xl font-black text-white tracking-tight">myinterview</div>
            <div
              className="mt-1 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: "rgba(45,236,41,0.55)" }}
            >
              Account Setup
            </div>
          </div>

          {/* Middle: step hint */}
          <div className="relative z-10 flex flex-col gap-5">
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{
                background: "rgba(45,236,41,0.08)",
                border: "1px solid rgba(45,236,41,0.2)",
              }}
            >
              <Sparkles className="w-5 h-5" style={{ color: "#2dec29" }} />
            </div>
            <div>
              <p
                className="text-[10px] font-bold uppercase tracking-widest mb-3"
                style={{ color: "rgba(255,255,255,0.3)" }}
              >
                Why we ask
              </p>
              <p className="text-lg font-bold text-white leading-snug">
                {STEP_SUBTITLES[step - 1]}
              </p>
            </div>
          </div>

          {/* Bottom: step counter dots */}
          <div className="relative z-10 flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i < step ? 24 : 12,
                  background: i < step ? "#2dec29" : "rgba(255,255,255,0.2)",
                }}
              />
            ))}
          </div>
        </div>

        {/* ── Right panel: form ── */}
        <div className="flex-1 flex flex-col overflow-y-auto px-8 lg:px-16 py-10">
          {/* Step counter (mobile only) */}
          <div className="flex justify-between items-center mb-6 md:hidden">
            <div className="flex gap-2">
              {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    i < step ? "bg-secondary" : "bg-neutral-300"
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-neutral-400">Step {step} of {TOTAL_STEPS}</span>
          </div>

          {/* Step title */}
          <h2 className="text-2xl font-bold text-secondary mb-1">{STEP_TITLES[step - 1]}</h2>

          {/* Divider */}
          <div className="h-px bg-neutral-200 mb-6" />

          {/* Form content */}
          <div className="flex-1 overflow-y-auto">
            {step === 1 && <StepAboutYou data={data} update={update} />}
            {step === 2 && <StepPreferences data={data} update={update} />}
            {step === 3 && <StepHeardFrom data={data} update={update} />}
          </div>

          {/* Mobile hint */}
          <div
            className="md:hidden mt-6 flex items-start gap-3 px-4 py-3 rounded-2xl"
            style={{
              background: "rgba(45,236,41,0.05)",
              border: "1px solid rgba(45,236,41,0.15)",
            }}
          >
            <Sparkles className="w-4 h-4 mt-px flex-shrink-0" style={{ color: "#2dec29" }} />
            <p className="text-xs leading-relaxed" style={{ color: "rgba(0,0,0,0.5)" }}>
              {STEP_SUBTITLES[step - 1]}
            </p>
          </div>

          {/* Footer nav */}
          <div className="flex flex-col gap-2 mt-8 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              {step > 1 ? (
                <button
                  onClick={() => setStep((s) => s - 1)}
                  className="flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-secondary transition-colors"
                >
                  <ChevronLeft size={16} />
                  Back
                </button>
              ) : <div />}

              {step < TOTAL_STEPS ? (
                <Button
                  size="sm"
                  onClick={() => setStep((s) => s + 1)}
                  className="gap-1.5"
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={saveAndFinish}
                >
                  {saving ? "Saving…" : "Get Started!"}
                </Button>
              )}
            </div>
            {saveError && (
              <p className="text-xs text-red-500 text-center">{saveError}</p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
