"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { track } from "@/lib/mixpanel";
import { ONBOARDING_LANGUAGE_IDS, LANGUAGE_GREETING, LEVEL_SAMPLES, getLanguage, isLanguageId } from "@/lib/languages";
import { TUTORS, DEFAULT_TUTOR_ID, getTutorById, isTutorId, type TutorId } from "@/lib/tutors";
import {
  LEVEL_OPTIONS,
  LEVEL_LABEL,
  MOTIVATIONS,
  MOTIV_LEAD_IN,
  GOALS,
  DESTINATION_BY_MOTIVATION,
  PLAN_PHASES,
  AI_SERVICES,
} from "@/lib/data/onboarding";
import { STUDY_PLAN_30 } from "@/lib/data/studyPlan";
import { loadOnboarding, saveOnboarding, type OnboardingData } from "@/lib/onboarding-storage";
import { StepShell } from "@/components/onboarding/StepShell";
import { ChatBubble } from "@/components/onboarding/ChatBubble";
import { OptionRow } from "@/components/onboarding/OptionRow";

type Step = "tutor" | "language" | "level" | "motivation" | "goal" | "generating" | "reveal" | "consent";

const CHAT_STEP_ORDER: Step[] = ["language", "level", "motivation", "goal"];
const STEP_ORDER: Step[] = ["tutor", ...CHAT_STEP_ORDER, "generating", "reveal", "consent"];

const PREVIEW_DAYS = STUDY_PLAN_30.slice(0, 7);

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

/** Determines where a returning visitor resumes: the first field not yet saved. */
function resumeStep(data: Partial<OnboardingData>): Step {
  if (!isTutorId(data.tutor)) return "tutor";
  if (!isLanguageId(data.language)) return "language";
  if (!data.level) return "level";
  if (!data.motivation) return "motivation";
  if (typeof data.goal !== "number") return "goal";
  return "consent";
}

export function OnboardingFlow() {
  const router = useRouter();
  const viewedRef = useRef(new Set<string>());
  const headingRef = useRef<HTMLElement | null>(null);
  const isFirstFocusRef = useRef(true);

  // Every field defaults to the fresh-visitor state. Reading localStorage in
  // a useState initializer would run during the server render too (there is
  // no `window` there, so it'd have to guess or throw) and, worse, would
  // make the very first client render disagree with the server-rendered
  // markup — a hydration mismatch. Instead we render this default state on
  // the first paint and resume from storage in a mount-only effect below.
  const [hydrated, setHydrated] = useState(false);
  const [step, setStep] = useState<Step>("tutor");

  const [tutor, setTutor] = useState<TutorId>(DEFAULT_TUTOR_ID);
  const [language, setLanguage] = useState<string | null>(null);
  const [level, setLevel] = useState<string | null>(null);
  const [motivation, setMotivation] = useState<string | null>(null);
  const [goal, setGoal] = useState<number | null>(null);
  const [consented, setConsented] = useState(false);
  const [signedIn, setSignedIn] = useState(false);
  const [signedInChecked, setSignedInChecked] = useState(false);

  // Mount-only: resume from whatever was saved locally, then reveal the flow.
  useEffect(() => {
    function resume() {
      const data = loadOnboarding();
      setStep(resumeStep(data));
      if (isTutorId(data.tutor)) setTutor(data.tutor);
      if (isLanguageId(data.language)) setLanguage(data.language);
      if (data.level) setLevel(data.level);
      if (data.motivation) setMotivation(data.motivation);
      if (typeof data.goal === "number") setGoal(data.goal);
      setHydrated(true);
    }
    resume();
  }, []);

  function trackOnce(key: string, event: string, properties?: Record<string, unknown>) {
    if (viewedRef.current.has(key)) return;
    viewedRef.current.add(key);
    track(event, properties);
  }

  function goBack() {
    const idx = STEP_ORDER.indexOf(step);
    if (idx > 0) setStep(STEP_ORDER[idx - 1]);
  }

  // Moves focus to the new step's heading whenever the step changes, so
  // screen-reader and keyboard users land somewhere meaningful instead of
  // wherever the old step's now-gone Continue button used to be. Skipped
  // the first time the flow becomes visible (fresh mount, or the resume
  // jump right after hydration) — that's not a step "change" a user made.
  useEffect(() => {
    if (!hydrated) return;
    if (isFirstFocusRef.current) {
      isFirstFocusRef.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [step, hydrated]);

  // ── Tutor step ────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (step === "tutor") trackOnce("tutor", "onboarding_choose_tutor_viewed");
  }, [step, hydrated]);

  function selectTutor(id: TutorId) {
    setTutor(id);
  }

  function continueFromTutor() {
    saveOnboarding({ tutor });
    track("onboarding_tutor_selected", { tutor });
    setStep("language");
  }

  // ── Chat steps (language / level / motivation / goal) ─────────
  useEffect(() => {
    if (!hydrated) return;
    if (step === "language") trackOnce("assessment", "onboarding_assessment_viewed");
  }, [step, hydrated]);

  function selectLanguage(id: string) {
    setLanguage(id);
    saveOnboarding({ language: id as OnboardingData["language"] });
    track("onboarding_language_selected", { language: id });
  }

  function selectLevel(id: string) {
    setLevel(id);
    saveOnboarding({ level: id });
    track("onboarding_level_selected", { level: id });
  }

  function selectMotivation(id: string) {
    setMotivation(id);
    saveOnboarding({ motivation: id });
    track("onboarding_motivation_selected", { motivation: id });
  }

  function selectGoal(min: number) {
    setGoal(min);
    saveOnboarding({ goal: min });
    track("onboarding_goal_selected", { daily_goal_minutes: min });
  }

  function continueChatStep() {
    if (step === "language" && language) setStep("level");
    else if (step === "level" && level) setStep("motivation");
    else if (step === "motivation" && motivation) setStep("goal");
    else if (step === "goal" && goal) {
      track("onboarding_assessment_completed", { language, level, motivation, daily_goal_minutes: goal });
      setStep("generating");
    }
  }

  function advanceFromGenerating() {
    setStep("reveal");
  }

  // ── Plan reveal ─────────────────────────────────────────────────
  useEffect(() => {
    if (!hydrated) return;
    if (step === "reveal") trackOnce("reveal", "onboarding_plan_reveal_viewed");
  }, [step, hydrated]);

  function continueFromReveal() {
    track("onboarding_plan_reveal_continue");
    setStep("consent");
  }

  // ── AI consent ────────────────────────────────────────────────
  // The signed-in check gates both the button's label ("Create my
  // account" vs. "Finish setup") and where Continue routes to, so the
  // button stays disabled (see ConsentStep) until it resolves — a signed-in
  // user must never be misrouted to /signup because we guessed too early.
  useEffect(() => {
    if (!hydrated || step !== "consent") return;
    trackOnce("consent", "onboarding_ai_consent_viewed");
    let cancelled = false;
    const supabase = createClient();
    supabase.auth
      .getUser()
      .then(({ data }: { data: { user: unknown } }) => {
        if (cancelled) return;
        setSignedIn(Boolean(data.user));
        setSignedInChecked(true);
      })
      .catch((error: unknown) => {
        console.error("Failed to check auth status before consent submit:", error);
        if (cancelled) return;
        setSignedIn(false);
        setSignedInChecked(true);
      });
    return () => {
      cancelled = true;
    };
  }, [step, hydrated]);

  function submitConsent() {
    track("onboarding_ai_consent_accepted");
    saveOnboarding({ consent: true });
    if (signedIn) {
      router.push("/onboarding/complete");
    } else {
      router.push("/signup?next=/onboarding/complete");
    }
  }

  const tutorObj = getTutorById(tutor);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream" role="status" aria-live="polite">
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  if (step === "tutor") {
    return (
      <TutorStep headingRef={headingRef} selected={tutor} onSelect={selectTutor} onContinue={continueFromTutor} />
    );
  }

  if (CHAT_STEP_ORDER.includes(step)) {
    const stepIndex = CHAT_STEP_ORDER.indexOf(step) + 1;
    const canContinue =
      (step === "language" && !!language) ||
      (step === "level" && !!level) ||
      (step === "motivation" && !!motivation) ||
      (step === "goal" && !!goal);
    const continueLabel = step === "goal" ? "Build my plan" : "Continue";

    return (
      <StepShell
        tutorId={tutor}
        step={stepIndex}
        total={CHAT_STEP_ORDER.length}
        onBack={goBack}
        footer={
          <PrimaryButton label={continueLabel} onClick={continueChatStep} disabled={!canContinue} />
        }
      >
        {step === "language" && (
          <LanguageStep headingRef={headingRef} tutorName={tutorObj.name} selected={language} onSelect={selectLanguage} />
        )}
        {step === "level" && language && (
          <LevelStep headingRef={headingRef} language={language} selected={level} onSelect={selectLevel} />
        )}
        {step === "motivation" && level && (
          <MotivationStep headingRef={headingRef} level={level} selected={motivation} onSelect={selectMotivation} />
        )}
        {step === "goal" && motivation && (
          <GoalStep headingRef={headingRef} motivation={motivation} selected={goal} onSelect={selectGoal} />
        )}
      </StepShell>
    );
  }

  if (step === "generating") {
    return <GeneratingStep headingRef={headingRef} tutorId={tutor} onBack={goBack} onAdvance={advanceFromGenerating} />;
  }

  if (step === "reveal") {
    return (
      <RevealStep
        headingRef={headingRef}
        tutorId={tutor}
        language={language ?? "spanish"}
        motivation={motivation ?? "travel"}
        goal={goal ?? 10}
        onBack={goBack}
        onContinue={continueFromReveal}
      />
    );
  }

  return (
    <ConsentStep
      headingRef={headingRef}
      consented={consented}
      onToggleConsent={() => setConsented((v) => !v)}
      onBack={goBack}
      onSubmit={submitConsent}
      signedIn={signedIn}
      signedInChecked={signedInChecked}
    />
  );
}

type HeadingRef = RefObject<HTMLElement | null>;

/* ───────── Primary button ───────── */
function PrimaryButton({
  label,
  onClick,
  disabled,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      aria-disabled={disabled}
      className="w-full rounded-2xl bg-ink py-4 text-center text-lg font-semibold text-white transition-opacity disabled:cursor-not-allowed disabled:opacity-35"
    >
      {label}
    </button>
  );
}

/* ───────── Back button (used outside StepShell) ───────── */
function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Go back"
      className="flex h-[30px] w-[30px] items-center justify-center rounded-full border border-line bg-surface text-ink transition-colors hover:border-ink/40"
    >
      <span aria-hidden className="text-base leading-none">
        ‹
      </span>
    </button>
  );
}

/* ───────── Step 1: Tutor ───────── */
function TutorStep({
  headingRef,
  selected,
  onSelect,
  onContinue,
}: {
  headingRef: HeadingRef;
  selected: TutorId;
  onSelect: (id: TutorId) => void;
  onContinue: () => void;
}) {
  const currentName = getTutorById(selected).name;
  return (
    <div className="flex min-h-screen flex-col bg-cream px-5 pb-6 pt-10 sm:pt-16">
      <div className="mb-6 flex gap-1">
        <div className="h-[3px] flex-1 rounded-full bg-ink" />
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className="h-[3px] flex-1 rounded-full bg-line" />
        ))}
      </div>

      <h1
        ref={headingRef as RefObject<HTMLHeadingElement | null>}
        tabIndex={-1}
        className="mb-1.5 font-display text-3xl font-bold text-ink outline-none"
      >
        Pick your tutor
      </h1>
      <p className="mb-6 text-base text-sub">You can switch anytime. All fluent in 9 languages.</p>

      <div role="radiogroup" aria-label="Choose your tutor" className="flex-1 space-y-3">
        {TUTORS.map((t) => {
          const isSelected = selected === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${t.name}, ${t.blurb}${isSelected ? ", selected" : ""}`}
              onClick={() => onSelect(t.id)}
              className={`flex w-full items-center rounded-2xl border-2 p-3 text-left transition-colors ${
                isSelected ? "border-ink bg-surface" : "border-line bg-surface"
              }`}
            >
              <span className="relative mr-3.5 block h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-2xl bg-accent-soft">
                <Image src={t.image} alt="" fill sizes="72px" className="object-cover" />
              </span>
              <span className="flex-1">
                <span className="mb-0.5 block text-lg font-semibold text-ink">{t.name}</span>
                <span className="block text-sm leading-snug text-sub">{t.blurb}</span>
              </span>
              {isSelected && (
                <span className="ml-2 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-ink text-sm font-bold text-white">
                  ✓
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="mt-6">
        <PrimaryButton label={`Continue with ${currentName}`} onClick={onContinue} />
      </div>
    </div>
  );
}

/* ───────── Step 2: Language ───────── */
function LanguageStep({
  headingRef,
  tutorName,
  selected,
  onSelect,
}: {
  headingRef: HeadingRef;
  tutorName: string;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      {/* Visually hidden — the visible chat bubble below carries the same
          copy. This is the programmatic focus target on step change. */}
      <h2 ref={headingRef as RefObject<HTMLHeadingElement | null>} tabIndex={-1} className="sr-only outline-none">
        Which language do you want to speak?
      </h2>
      <ChatBubble>{`Hey! I'm ${tutorName} 👋`}</ChatBubble>
      <ChatBubble>Which language do you want to speak?</ChatBubble>
      <div role="radiogroup" aria-label="Which language do you want to speak?" className="mt-4 space-y-2">
        {ONBOARDING_LANGUAGE_IDS.map((id) => {
          const lang = getLanguage(id);
          return (
            <OptionRow key={id} selected={selected === id} onSelect={() => onSelect(id)} ariaLabel={lang.label}>
              <span className="flex items-center gap-3">
                <span className="text-xl">{lang.flag}</span>
                <span className="text-base font-medium">{lang.label}</span>
              </span>
            </OptionRow>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Step 3: Level ───────── */
function LevelStep({
  headingRef,
  language,
  selected,
  onSelect,
}: {
  headingRef: HeadingRef;
  language: string;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  const lang = getLanguage(language);
  const samples = LEVEL_SAMPLES[language] ?? [];
  return (
    <div>
      <h2 ref={headingRef as RefObject<HTMLHeadingElement | null>} tabIndex={-1} className="sr-only outline-none">
        Where are you starting from?
      </h2>
      <ChatBubble from="you">{`${lang.label} ${lang.flag}`}</ChatBubble>
      <ChatBubble>{LANGUAGE_GREETING[language]}</ChatBubble>
      <ChatBubble>Where are you starting from?</ChatBubble>
      <div role="radiogroup" aria-label="Where are you starting from?" className="mt-4 space-y-2">
        {LEVEL_OPTIONS.map((l, idx) => (
          <OptionRow
            key={l.id}
            selected={selected === l.id}
            onSelect={() => onSelect(l.id)}
            ariaLabel={`${l.label}: ${samples[idx]}`}
          >
            <span className="mb-0.5 block text-[15px] font-semibold">{l.label}</span>
            <span className="block text-[13px] italic opacity-70">&ldquo;{samples[idx]}&rdquo;</span>
          </OptionRow>
        ))}
      </div>
    </div>
  );
}

/* ───────── Step 4: Motivation ───────── */
function MotivationStep({
  headingRef,
  level,
  selected,
  onSelect,
}: {
  headingRef: HeadingRef;
  level: string;
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 ref={headingRef as RefObject<HTMLHeadingElement | null>} tabIndex={-1} className="sr-only outline-none">
        What&apos;s pulling you here?
      </h2>
      <ChatBubble>{`Got it — ${LEVEL_LABEL[level]}. 🌱`}</ChatBubble>
      <ChatBubble>{`What's pulling you here?`}</ChatBubble>
      <div role="radiogroup" aria-label="What's pulling you here?" className="mt-4 space-y-2">
        {MOTIVATIONS.map((m) => (
          <OptionRow key={m.id} selected={selected === m.id} onSelect={() => onSelect(m.id)} ariaLabel={`${m.label}: ${m.sub}`}>
            <span className="flex items-center gap-3">
              <span className="text-xl">{m.emoji}</span>
              <span>
                <span className="block text-base font-semibold">{m.label}</span>
                <span className="block text-xs opacity-70">{m.sub}</span>
              </span>
            </span>
          </OptionRow>
        ))}
      </div>
    </div>
  );
}

/* ───────── Step 5: Goal ───────── */
function GoalStep({
  headingRef,
  motivation,
  selected,
  onSelect,
}: {
  headingRef: HeadingRef;
  motivation: string;
  selected: number | null;
  onSelect: (min: number) => void;
}) {
  return (
    <div>
      <h2 ref={headingRef as RefObject<HTMLHeadingElement | null>} tabIndex={-1} className="sr-only outline-none">
        How much time can you give me daily?
      </h2>
      <ChatBubble>{MOTIV_LEAD_IN[motivation]}</ChatBubble>
      <ChatBubble>Here&apos;s the thing — 10 minutes a day beats 2 hours once a week.</ChatBubble>
      <ChatBubble>How much time can you give me daily?</ChatBubble>
      <div role="radiogroup" aria-label="How much time can you give me daily?" className="mt-4 space-y-2">
        {GOALS.map((g) => {
          const isSelected = selected === g.min;
          return (
            <OptionRow
              key={g.min}
              selected={isSelected}
              onSelect={() => onSelect(g.min)}
              ariaLabel={`${g.label} per day, ${g.sub}`}
              badge={
                g.recommended && !isSelected ? (
                  <span className="flex-shrink-0 rounded-full bg-hot px-2 py-1 text-[10px] font-bold tracking-wide text-white">
                    PICK ME
                  </span>
                ) : undefined
              }
            >
              <span className="flex items-center gap-3">
                <span className="text-xl">{g.emoji}</span>
                <span>
                  <span className="block text-base font-semibold">{g.label} / day</span>
                  <span className="block text-xs opacity-70">{g.sub}</span>
                </span>
              </span>
            </OptionRow>
          );
        })}
      </div>
    </div>
  );
}

/* ───────── Step 6: Plan generating ───────── */
function GeneratingStep({
  headingRef,
  tutorId,
  onBack,
  onAdvance,
}: {
  headingRef: HeadingRef;
  tutorId: string;
  onBack: () => void;
  onAdvance: () => void;
}) {
  const tutor = getTutorById(tutorId);
  const reducedMotion = prefersReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    track("onboarding_plan_generating_viewed");
    const tick = setInterval(() => {
      setPhase((p) => Math.min(PLAN_PHASES.length, p + 1));
    }, 650);
    const advance = setTimeout(onAdvance, 2900);
    return () => {
      clearInterval(tick);
      clearTimeout(advance);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="flex min-h-screen flex-col bg-cream px-5 pb-8 pt-10 sm:pt-16">
      <BackButton onClick={onBack} />

      <div className="mt-8 flex flex-col items-center">
        <div className="relative flex h-[150px] w-[150px] items-center justify-center">
          {!reducedMotion && (
            <span className="absolute h-[110px] w-[110px] animate-ping rounded-full border-[3px] border-accent-brand opacity-30" />
          )}
          <span className="relative block h-[110px] w-[110px] overflow-hidden rounded-full border-4 border-surface shadow-md">
            <Image src={tutor.image} alt="" fill sizes="110px" className="object-cover" />
          </span>
        </div>

        <h1
          ref={headingRef as RefObject<HTMLHeadingElement | null>}
          tabIndex={-1}
          className="mt-8 mb-2 text-center font-display text-2xl font-bold text-ink outline-none"
        >
          Crafting your plan…
        </h1>
        <p className="mb-8 text-center text-sm text-sub">This&apos;ll take a few seconds.</p>

        <div className="w-full max-w-[300px] space-y-3">
          {PLAN_PHASES.map((label, i) => {
            const text = typeof label === "function" ? label(tutor.name) : label;
            const done = i < phase;
            const active = i === phase;
            return (
              <div key={i} className={`flex items-center gap-3 ${done || active ? "opacity-100" : "opacity-35"}`}>
                <span
                  className={`flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full border-2 text-[11px] font-bold text-white ${
                    done ? "border-accent-brand bg-accent-brand" : active ? "border-ink" : "border-line"
                  }`}
                >
                  {done ? "✓" : null}
                </span>
                <span className={`text-sm ${active ? "font-semibold" : ""} ${done ? "text-ink" : "text-sub"}`}>{text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ───────── Step 7: Plan reveal ───────── */
function RevealStep({
  headingRef,
  tutorId,
  language,
  motivation,
  goal,
  onBack,
  onContinue,
}: {
  headingRef: HeadingRef;
  tutorId: string;
  language: string;
  motivation: string;
  goal: number;
  onBack: () => void;
  onContinue: () => void;
}) {
  const tutor = getTutorById(tutorId);
  const lang = getLanguage(language);
  const destination = (DESTINATION_BY_MOTIVATION[motivation] ?? DESTINATION_BY_MOTIVATION.travel)(lang.label);

  return (
    <div className="flex min-h-screen flex-col bg-cream px-5 pb-6 pt-10 sm:pt-16">
      <div className="mb-4">
        <BackButton onClick={onBack} />
      </div>

      <div className="flex-1 overflow-y-auto">
        <span className="mb-4 inline-block rounded bg-accent-brand px-2.5 py-1.5 text-[11px] font-bold tracking-wider text-white">
          YOUR PLAN IS READY
        </span>

        <h1
          ref={headingRef as RefObject<HTMLHeadingElement | null>}
          tabIndex={-1}
          className="mb-2 whitespace-pre-line font-display text-[26px] font-bold leading-tight text-ink outline-none"
        >
          {`In 30 days,\n${destination}`}
        </h1>

        <p className="mb-5 text-sm text-sub">
          {goal} min/day · {lang.label} · with {tutor.name}
        </p>

        <div className="mb-3 flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-wide text-sub">Your 30-day plan</p>
          <p className="text-xs text-sub">Week 1 preview</p>
        </div>

        <div className="mb-3 overflow-hidden rounded-[20px] border border-line bg-surface">
          {PREVIEW_DAYS.map((d, i) => (
            <div
              key={d.day}
              className={`flex items-center gap-3 px-4 py-3.5 ${i < PREVIEW_DAYS.length - 1 ? "border-b border-line" : ""}`}
            >
              <span
                className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                  i === 0 ? "bg-ink text-white" : "bg-cream text-sub"
                }`}
              >
                {d.day}
              </span>
              <span className="flex-1">
                <span className="mb-0.5 block text-sm font-semibold text-ink">{d.speakLabel}</span>
                <span className="flex gap-2">
                  <span className="rounded-md bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-brand">
                    🎙️ Speak
                  </span>
                  <span className="rounded-md bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-800">
                    📖 {d.vocabTopic}
                  </span>
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="mb-4 flex items-start gap-2.5 rounded-2xl bg-accent-soft p-3.5">
          <span className="relative block h-8 w-8 flex-shrink-0 overflow-hidden rounded-full">
            <Image src={tutor.image} alt="" fill sizes="32px" className="object-cover" />
          </span>
          <p className="flex-1 text-[13px] leading-snug text-ink">
            <span className="font-bold">{tutor.name}:</span> &ldquo;Each day we&apos;ll practice speaking about a topic,
            then learn the words to back it up. {goal} minutes is all it takes.&rdquo;
          </p>
        </div>
      </div>

      <div className="pt-2">
        <PrimaryButton label="Continue" onClick={onContinue} />
      </div>
    </div>
  );
}

/* ───────── Step 8: AI consent ───────── */
function ConsentStep({
  headingRef,
  consented,
  onToggleConsent,
  onBack,
  onSubmit,
  signedIn,
  signedInChecked,
}: {
  headingRef: HeadingRef;
  consented: boolean;
  onToggleConsent: () => void;
  onBack: () => void;
  onSubmit: () => void;
  signedIn: boolean;
  signedInChecked: boolean;
}) {
  const submitLabel = signedIn ? "Finish setup" : "Create my account";
  const consentLabelId = "onboarding-consent-label";

  return (
    <div className="flex min-h-screen flex-col bg-cream px-6 pb-8 pt-10 sm:pt-16">
      <div className="mb-6">
        <BackButton onClick={onBack} />
      </div>

      <div className="mb-8 flex flex-col items-center text-center">
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-2xl">🔒</span>
        <h1
          ref={headingRef as RefObject<HTMLHeadingElement | null>}
          tabIndex={-1}
          className="mb-3 font-display text-3xl font-bold text-ink outline-none"
        >
          AI-Powered Features
        </h1>
        <p className="max-w-sm text-base leading-6 text-sub">
          Fina uses third-party AI services to power your learning experience. Here&apos;s exactly what&apos;s shared
          and with whom.
        </p>
      </div>

      <div className="mb-6 space-y-3">
        {AI_SERVICES.map((service) => (
          <div key={service.name} className="rounded-2xl border border-line bg-surface p-4">
            <p className="mb-1 text-base font-bold text-ink">{service.name}</p>
            <p className="mb-3 text-xs text-sub">{service.operator}</p>
            <div className="space-y-1.5">
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-xs font-semibold text-sub">Data sent:</span>
                <span className="flex-1 text-xs text-ink">{service.dataSent}</span>
              </div>
              <div className="flex gap-2">
                <span className="w-20 flex-shrink-0 text-xs font-semibold text-sub">Purpose:</span>
                <span className="flex-1 text-xs text-ink">{service.purpose}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-8 rounded-2xl bg-accent-soft p-4 text-center">
        <p className="mb-2 text-sm leading-5 text-ink">
          Your data is used solely to provide these features. It is not sold or used for advertising.
        </p>
        <Link href="/privacy" className="text-sm font-semibold text-accent-brand underline">
          View Privacy Policy
        </Link>
      </div>

      <button
        type="button"
        onClick={onToggleConsent}
        role="checkbox"
        aria-checked={consented}
        aria-labelledby={consentLabelId}
        className="mb-8 flex items-start gap-3 px-2 text-left"
      >
        <span
          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-md border-2 ${
            consented ? "border-ink bg-ink" : "border-line bg-surface"
          }`}
        >
          {consented && <span className="text-sm font-bold text-white">✓</span>}
        </span>
        <span id={consentLabelId} className="flex-1 text-sm leading-5 text-sub">
          I understand and consent to my conversation data and voice audio being processed by the AI services listed
          above.
        </span>
      </button>

      <PrimaryButton label={submitLabel} onClick={onSubmit} disabled={!consented || !signedInChecked} />

      {!consented && (
        <p className="mt-4 text-center text-xs text-sub">Please accept the above to continue</p>
      )}
    </div>
  );
}
