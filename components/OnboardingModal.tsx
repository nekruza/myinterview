"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { Check, ChevronRight, ChevronLeft, Sparkles } from "lucide-react";

type Data = {
  experience_level: string;
  interview_style: string;
  interview_duration: string;
  practice_partner: string;
  interview_language: string;
  interview_platform: string;
  feedback_preference: string;
  wants_tips: boolean | null;
};

const STEP_TITLES = ["About You", "Interview Preferences", "Tools & Feedback"];
const TOTAL_STEPS = 3;

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
function Step1({ data, update }: { data: Data; update: (k: keyof Data, v: unknown) => void }) {
  return (
    <div className="space-y-6">
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
    </div>
  );
}

// ─── Step 2: Interview Preferences ───────────────────────────────────────────
function Step2({ data, update }: { data: Data; update: (k: keyof Data, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Preferred Duration</SectionLabel>
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

      <div>
        <SectionLabel>How would you like to practice?</SectionLabel>
        <div className="grid grid-cols-1 gap-2">
          {[
            { value: "ai", label: "With AI", emoji: "🤖", desc: "Practice solo with instant feedback" },
            { value: "people", label: "With other people", emoji: "👥", desc: "Match with peers for realistic practice" },
            { value: "both", label: "Both", emoji: "✨", desc: "Mix of AI and peer practice" },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => update("practice_partner", opt.value)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-2xl border-2 transition-all duration-150 text-left w-full",
                data.practice_partner === opt.value
                  ? "border-primary bg-primary/10"
                  : "border-neutral-200 bg-white/70 hover:border-neutral-300 hover:bg-neutral-50/80"
              )}
            >
              <span className="text-xl leading-none">{opt.emoji}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-secondary">{opt.label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{opt.desc}</p>
              </div>
              <span
                className={cn(
                  "flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all",
                  data.practice_partner === opt.value ? "border-primary bg-primary" : "border-neutral-300"
                )}
              >
                {data.practice_partner === opt.value && (
                  <Check size={10} strokeWidth={3} className="text-secondary" />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Preferred Language</SectionLabel>
        <div className="flex flex-wrap gap-2">
          {[
            { value: "english", label: "English", emoji: "🇬🇧" },
            { value: "spanish", label: "Spanish", emoji: "🇪🇸" },
            { value: "french", label: "French", emoji: "🇫🇷" },
            { value: "german", label: "German", emoji: "🇩🇪" },
            { value: "mandarin", label: "Mandarin", emoji: "🇨🇳" },
            { value: "other", label: "Other", emoji: "🌍" },
          ].map((opt) => (
            <Chip
              key={opt.value}
              {...opt}
              selected={data.interview_language === opt.value}
              onClick={() => update("interview_language", opt.value)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Step 3: Tools & Feedback ─────────────────────────────────────────────────
function Step3({ data, update }: { data: Data; update: (k: keyof Data, v: unknown) => void }) {
  return (
    <div className="space-y-6">
      <div>
        <SectionLabel>Preferred Platform</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "zoom", label: "Zoom", emoji: "📹" },
            { value: "meet", label: "Google Meet", emoji: "🎥" },
            { value: "teams", label: "MS Teams", emoji: "💼" },
            { value: "coderpad", label: "CoderPad", emoji: "🖥️" },
            { value: "hirevue", label: "HireVue", emoji: "📱" },
            { value: "any", label: "No Preference", emoji: "🤷" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              {...opt}
              selected={data.interview_platform === opt.value}
              onClick={() => update("interview_platform", opt.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Preferred Feedback Style</SectionLabel>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "detailed", label: "Detailed Critique", emoji: "📝" },
            { value: "overview", label: "High-Level", emoji: "💡" },
            { value: "score", label: "Score Only", emoji: "🎯" },
            { value: "none", label: "No Feedback", emoji: "🚫" },
          ].map((opt) => (
            <OptionCard
              key={opt.value}
              {...opt}
              selected={data.feedback_preference === opt.value}
              onClick={() => update("feedback_preference", opt.value)}
            />
          ))}
        </div>
      </div>

      <div>
        <SectionLabel>Would you like interview tips?</SectionLabel>
        <div className="flex gap-3">
          {[
            { value: true, label: "Yes, please!", emoji: "✅" },
            { value: false, label: "No thanks", emoji: "❌" },
          ].map((opt) => (
            <button
              key={String(opt.value)}
              type="button"
              onClick={() => update("wants_tips", opt.value)}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl border-2 font-semibold text-sm transition-all",
                data.wants_tips === opt.value
                  ? "border-primary bg-primary/10 text-secondary"
                  : "border-neutral-200 bg-white/70 text-neutral-500 hover:border-neutral-300"
              )}
            >
              <span>{opt.emoji}</span>
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main Modal ───────────────────────────────────────────────────────────────
export function OnboardingModal({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [data, setData] = useState<Data>({
    experience_level: "",
    interview_style: "",
    interview_duration: "",
    practice_partner: "",
    interview_language: "",
    interview_platform: "",
    feedback_preference: "",
    wants_tips: null,
  });

  const update = (key: keyof Data, val: unknown) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const stepValid = () => {
    if (step === 1) return !!data.experience_level && !!data.interview_style;
    if (step === 2)
      return !!data.interview_duration && !!data.practice_partner && !!data.interview_language;
    if (step === 3)
      return !!data.interview_platform && !!data.feedback_preference && data.wants_tips !== null;
    return false;
  };

  const saveAndClose = async (skipped = false) => {
    setSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        if (skipped) {
          await supabase
            .from("profiles")
            .update({ onboarding_complete: true })
            .eq("id", user.id);
        } else {
          await supabase
            .from("profiles")
            .update({
              experience_level: data.experience_level,
              interview_style: data.interview_style,
              interview_duration: data.interview_duration,
              practice_partner: data.practice_partner,
              interview_language: data.interview_language,
              interview_platform: data.interview_platform,
              feedback_preference: data.feedback_preference,
              wants_tips: data.wants_tips,
              onboarding_complete: true,
            })
            .eq("id", user.id);
        }
      }
      onComplete();
    } finally {
      setSaving(false);
    }
  };

  const progress = ((step - 1) / TOTAL_STEPS) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full sm:max-w-lg flex flex-col max-h-[92vh] sm:max-h-[88vh] rounded-t-3xl sm:rounded-3xl bg-white border-t-2 sm:border-2 border-neutral-200 shadow-[0_-4px_32px_rgba(0,0,0,0.18)] sm:shadow-[8px_8px_0px_0px_#1A1A1A] overflow-hidden">
        {/* Progress bar */}
        <div className="h-1.5 bg-neutral-100 flex-shrink-0">
          <div
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="px-6 pt-5 pb-4 flex-shrink-0 border-b border-neutral-100">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Sparkles size={16} className="text-secondary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider">
                Step {step} of {TOTAL_STEPS}
              </p>
              <h2 className="text-lg font-bold text-secondary leading-tight">
                {STEP_TITLES[step - 1]}
              </h2>
              {step === 1 && (
                <p className="mt-1 text-sm text-neutral-500 leading-relaxed">
                  Help us customise the website for you — takes about a minute!
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {step === 1 && <Step1 data={data} update={update} />}
          {step === 2 && <Step2 data={data} update={update} />}
          {step === 3 && <Step3 data={data} update={update} />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-neutral-100 flex-shrink-0 bg-white/90">
          <div className="flex items-center gap-4">
            {step > 1 ? (
              <button
                onClick={() => setStep((s) => s - 1)}
                className="flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-secondary transition-colors"
              >
                <ChevronLeft size={16} />
                Back
              </button>
            ) : (
              <button
                onClick={() => saveAndClose(true)}
                disabled={saving}
                className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
              >
                Skip for now
              </button>
            )}
          </div>

          {step < TOTAL_STEPS ? (
            <Button
              size="sm"
              disabled={!stepValid()}
              onClick={() => stepValid() && setStep((s) => s + 1)}
              className={cn("gap-1.5", !stepValid() && "opacity-40 cursor-not-allowed")}
            >
              Next
              <ChevronRight size={15} />
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!stepValid() || saving}
              onClick={() => saveAndClose()}
              className={cn(!stepValid() && "opacity-40 cursor-not-allowed")}
            >
              {saving ? "Saving…" : "Get Started!"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
