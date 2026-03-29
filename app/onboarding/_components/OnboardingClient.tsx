"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { TECH_ROLES } from "@/lib/practice-data";
import {
  Check,
  ChevronRight,
  ChevronLeft,
  Upload,
  CheckCircle,
  AlertTriangle,
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

type ResumeState = "idle" | "uploading" | "success" | "warning" | "error";

const TOTAL_STEPS = 4;
const STEP_TITLES = ["About You", "Your Preferences", "Your Resume", "One last thing"];
const STEP_SUBTITLES = [
  "Tell us a bit about yourself so we can tailor your experience from day one.",
  "Helps us generate the right questions for your target role and interview style — the more specific, the better.",
  "We use your resume to generate questions based on your actual experience. Skipping this means generic questions instead of personalised ones.",
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
  const isKnownRole = TECH_ROLES.some((r) => r.value === data.target_role);
  const [isOther, setIsOther] = useState(!isKnownRole && !!data.target_role);

  return (
    <div className="space-y-6 mt-4">
      <div>
        <SectionLabel>Target Role</SectionLabel>
        <select
          value={isOther ? "other" : data.target_role}
          onChange={(e) => {
            if (e.target.value === "other") {
              setIsOther(true);
              update("target_role", "");
            } else {
              setIsOther(false);
              update("target_role", e.target.value);
            }
          }}
          className="w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition appearance-none cursor-pointer"
        >
          <option value="" disabled>Select your target role…</option>
          {TECH_ROLES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        {isOther && (
          <input
            type="text"
            value={data.target_role}
            onChange={(e) => update("target_role", e.target.value)}
            placeholder="e.g. Product Manager, UX Engineer…"
            className="mt-2 w-full px-4 py-2.5 rounded-xl border-2 border-neutral-200 bg-white text-sm text-secondary focus:outline-none focus:border-primary transition placeholder:text-neutral-400"
            autoFocus
          />
        )}
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

// ─── Step 3: Resume Upload ────────────────────────────────────────────────────

function StepResume({
  resumeState,
  resumeFileName,
  resumeWarning,
  onFileSelect,
  onReset,
}: {
  resumeState: ResumeState;
  resumeFileName: string | null;
  resumeWarning: string | null;
  onFileSelect: (file: File) => void;
  onReset: () => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) onFileSelect(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileSelect(file);
    // Reset input so re-selecting same file triggers onChange
    if (inputRef.current) inputRef.current.value = "";
  };

  const uploaded = resumeState === "success" || resumeState === "warning";

  return (
    <div className="mt-4 space-y-4">
      {uploaded ? (
        <div
          className={cn(
            "rounded-xl border-2 p-4 flex items-start gap-3",
            resumeState === "success"
              ? "border-green-300 bg-green-50"
              : "border-yellow-300 bg-yellow-50"
          )}
        >
          {resumeState === "success" ? (
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary truncate">{resumeFileName}</p>
            {resumeState === "success" && (
              <p className="text-xs text-green-700 mt-0.5">Text extracted successfully ✓</p>
            )}
            {resumeWarning && (
              <p className="text-xs text-yellow-700 mt-0.5">{resumeWarning}</p>
            )}
          </div>
          <button
            onClick={onReset}
            className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors flex-shrink-0"
          >
            Replace
          </button>
        </div>
      ) : (
        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-secondary bg-neutral-100"
              : "border-neutral-300 bg-neutral-50 hover:border-neutral-400",
            resumeState === "uploading" && "pointer-events-none opacity-60"
          )}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="sr-only"
            onChange={handleChange}
            disabled={resumeState === "uploading"}
          />
          {resumeState === "uploading" ? (
            <>
              <div className="text-3xl mb-2">⏳</div>
              <p className="text-sm font-semibold text-secondary">Uploading &amp; extracting…</p>
              <p className="text-xs text-neutral-400 mt-1">This takes a few seconds</p>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-semibold text-secondary">Drop your resume here</p>
              <p className="text-xs text-neutral-400 mt-1">PDF or DOCX · Max 5MB</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold">
                <Upload size={12} /> Browse files
              </div>
            </>
          )}
        </label>
      )}

      {resumeState === "error" && (
        <p className="text-xs text-red-500">
          {resumeWarning ?? "Upload failed. Please try again."}
        </p>
      )}
    </div>
  );
}

// ─── Step 4: Where did you hear about us? ────────────────────────────────────

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
    <div className="min-h-screen bg-[#faf9f6] flex items-center justify-center">
      <div className="text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-secondary mb-2">You're all set!</h2>
        <p className="text-neutral-500">Taking you to your dashboard…</p>
      </div>
    </div>
  );
}

// ─── Main client component ────────────────────────────────────────────────────

export default function OnboardingClient() {
  const router = useRouter();
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
  const [resumeState, setResumeState] = useState<ResumeState>("idle");
  const [resumeFileName, setResumeFileName] = useState<string | null>(null);
  const [resumeWarning, setResumeWarning] = useState<string | null>(null);

  const update = <K extends keyof OnboardingData>(key: K, val: OnboardingData[K]) =>
    setData((prev) => ({ ...prev, [key]: val }));

  const stepValid = () => {
    if (step === 1) return !!data.full_name.trim() && !!data.age && !!data.experience_level;
    if (step === 2) return !!data.target_role.trim() && !!data.interview_style && !!data.interview_duration;
    if (step === 3) return resumeState === "success" || resumeState === "warning";
    if (step === 4) return !!data.heard_from;
    return false;
  };

  const handleFileSelect = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      setResumeState("error");
      setResumeWarning("File too large. Please upload a PDF or DOCX under 5MB.");
      return;
    }
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      setResumeState("error");
      setResumeWarning("Please upload a PDF or DOCX file.");
      return;
    }

    setResumeState("uploading");
    setResumeFileName(file.name);
    setResumeWarning(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/extract", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (!res.ok) {
        setResumeState("error");
        setResumeWarning(json.error ?? "Upload failed. Please try again.");
        return;
      }

      if (json.resume_text === null) {
        setResumeState("warning");
        const reason = json.extract_error ? ` (${json.extract_error})` : " (it may be image-based)";
        setResumeWarning(
          `We couldn't extract text from this file${reason}. Your resume was saved but personalisation may be limited.`
        );
      } else {
        setResumeState("success");
      }
    } catch {
      setResumeState("error");
      setResumeWarning("Upload failed. Please try again.");
    }
  };

  const resetResume = () => {
    setResumeState("idle");
    setResumeFileName(null);
    setResumeWarning(null);
  };

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
      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          full_name: data.full_name.trim(),
          age: data.age ? parseInt(data.age, 10) : null,
          experience_level: data.experience_level,
          interview_style: data.interview_style,
          interview_duration: data.interview_duration,
          practice_partner: data.practice_partner,
          target_role: data.target_role.trim(),
          heard_from: data.heard_from,
          onboarding_complete: true,
        })
        .eq("id", user.id);
      if (updateError) {
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

  // Redirect to dashboard 1.5s after showing the done screen
  useEffect(() => {
    if (!done) return;
    const t = setTimeout(() => router.push("/app/dashboard"), 1500);
    return () => clearTimeout(t);
  }, [done, router]);

  if (done) return <StepDone />;

  const isValid = stepValid();
  const progress = (step / TOTAL_STEPS) * 100;

  return (
    <div className="h-screen flex flex-col overflow-hidden" style={{ background: "linear-gradient(135deg, #faf9f6 0%, #f5f4f0 100%)" }}>
      {/* Progress bar */}
      <div className="h-1 bg-neutral-200 w-full flex-shrink-0">
        <div
          className="h-full bg-secondary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* ── Left panel: personalisation hint ── */}
        <div className="hidden md:flex w-80 lg:w-96 flex-shrink-0 flex-col justify-between bg-secondary px-8 py-10 overflow-hidden relative">
          {/* Subtle ambient blob */}
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "radial-gradient(ellipse 80% 60% at 10% 80%, rgba(255,255,255,0.06) 0%, transparent 70%)" }}
          />

          {/* Top: logo/brand mark */}
          <div className="relative z-10">
            <div className="text-2xl font-black text-white tracking-tight">myinterview</div>
            <div className="mt-1 text-xs font-semibold text-white/40 uppercase tracking-widest">Setup</div>
          </div>

          {/* Middle: step hint */}
          <div className="relative z-10 flex flex-col gap-5">
            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-2xl">
              ✨
            </div>
            <div>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3">
                Why we ask
              </p>
              <p className="text-xl font-bold text-white leading-snug">
                {STEP_SUBTITLES[step - 1]}
              </p>
            </div>
          </div>

          {/* Bottom: step counter dots */}
          <div className="relative z-10 flex gap-2">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div
                key={i}
                className={cn(
                  "h-1.5 rounded-full transition-all duration-300",
                  i < step ? "bg-white w-6" : "bg-white/25 w-3"
                )}
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

          {/* Form content — full width, no card box */}
          <div className="flex-1 overflow-y-auto">
            {step === 1 && <StepAboutYou data={data} update={update} />}
            {step === 2 && <StepPreferences data={data} update={update} />}
            {step === 3 && (
              <StepResume
                resumeState={resumeState}
                resumeFileName={resumeFileName}
                resumeWarning={resumeWarning}
                onFileSelect={handleFileSelect}
                onReset={resetResume}
              />
            )}
            {step === 4 && <StepHeardFrom data={data} update={update} />}
          </div>

          {/* Mobile hint */}
          <div className="md:hidden mt-6 flex items-start gap-3 px-4 py-3 rounded-2xl border bg-neutral-100/80 border-neutral-200">
            <span className="text-base leading-none mt-px flex-shrink-0">✨</span>
            <p className="text-xs leading-relaxed text-neutral-500">{STEP_SUBTITLES[step - 1]}</p>
          </div>

          {/* Footer nav */}
          <div className="flex flex-col gap-2 mt-8 pt-4 border-t border-neutral-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {step > 1 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="flex items-center gap-1 text-sm font-semibold text-neutral-400 hover:text-secondary transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Back
                  </button>
                )}
                {step === 3 && (
                  <button
                    onClick={() => setStep(4)}
                    className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors underline underline-offset-2"
                  >
                    Skip for now
                  </button>
                )}
              </div>

              {step < TOTAL_STEPS ? (
                <Button
                  size="sm"
                  disabled={!isValid}
                  onClick={() => isValid && setStep((s) => s + 1)}
                  className={cn("gap-1.5", !isValid && "opacity-40 cursor-not-allowed")}
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              ) : (
                <Button
                  size="sm"
                  disabled={!isValid || saving}
                  onClick={saveAndFinish}
                  className={cn(!isValid && "opacity-40 cursor-not-allowed")}
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
