"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { customRoleplayTitleExists, validateCustomRoleplay } from "@/lib/db/customRoleplays";
import { useCreateCustomRoleplay } from "@/lib/queries/roleplays";
import type { RoleplayDifficulty } from "@/lib/types/roleplay";

const SUGGESTIONS = [
  "I'm at the airport and my flight is cancelled",
  "Meeting my girlfriend's parents for the first time",
  "Trying to return a broken appliance",
];

const DIFFICULTIES: RoleplayDifficulty[] = ["Beginner", "Intermediate", "Advanced"];

/** Mirrors fina's auto-title behavior: first 5 words of the (50-char-capped) scenario text. */
function autoTitleFrom(text: string): string {
  return text.slice(0, 50).split(" ").slice(0, 5).join(" ");
}

export default function NewRoleplayPage() {
  const router = useRouter();
  const createCustomRoleplay = useCreateCustomRoleplay();

  const [scenario, setScenario] = useState("");
  const [title, setTitle] = useState("");
  const [userRole, setUserRole] = useState("");
  const [aiRole, setAiRole] = useState("");
  const [difficulty, setDifficulty] = useState<RoleplayDifficulty>("Beginner");
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleScenarioChange(text: string) {
    setScenario(text);
    // Auto-fill the title from the scenario text only while the title is still empty.
    if (!title && text.trim().length >= 3) {
      setTitle(autoTitleFrom(text));
    }
  }

  function applySuggestion(s: string) {
    setScenario(s);
    setTitle(s.slice(0, 50));
  }

  const isValid =
    title.trim().length >= 3 &&
    userRole.trim().length >= 2 &&
    aiRole.trim().length >= 2 &&
    scenario.trim().length >= 10;

  async function handleSubmit() {
    if (isSaving) return;
    setErrorMessage(null);

    const validationError = validateCustomRoleplay({ title, userRole, aiRole, scenario });
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsSaving(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setErrorMessage("You must be logged in to create custom roleplays.");
        return;
      }

      const titleExists = await customRoleplayTitleExists(supabase, user.id, title.trim());
      if (titleExists) {
        setErrorMessage("You already have a roleplay with this title.");
        return;
      }

      await createCustomRoleplay.mutateAsync({
        title: title.trim(),
        category: "custom",
        difficulty,
        userRole: userRole.trim(),
        aiRole: aiRole.trim(),
        scenario: scenario.trim(),
      });

      toast.success("Custom roleplay created");
      router.push("/app/roleplay?filter=custom");
    } catch {
      setErrorMessage("Failed to create custom roleplay. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-accent-brand">Custom Roleplay</p>
      <h1 className="mt-2 font-display text-3xl leading-[1.15] text-ink">What are we practicing?</h1>

      <div className="mt-7">
        <label htmlFor="roleplay-scenario" className="sr-only">
          Scenario
        </label>
        <textarea
          id="roleplay-scenario"
          value={scenario}
          onChange={(e) => handleScenarioChange(e.target.value)}
          maxLength={200}
          rows={4}
          aria-label="Scenario"
          placeholder="Describe the situation, who you're talking to, and what you want to practice..."
          disabled={isSaving}
          className="w-full resize-none rounded-2xl border border-line bg-surface px-5 py-4 text-base text-ink placeholder:text-sub focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand disabled:opacity-60"
        />
      </div>

      <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-sub">Try one of these</p>
      <div className="mt-3 flex flex-col gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => applySuggestion(s)}
            disabled={isSaving}
            className="rounded-2xl border border-line bg-surface px-5 py-3.5 text-left text-sm font-semibold italic text-ink transition hover:border-sub/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
          >
            &ldquo;{s}&rdquo;
          </button>
        ))}
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="roleplay-user-role" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sub">
            You are
          </label>
          <input
            id="roleplay-user-role"
            type="text"
            value={userRole}
            onChange={(e) => setUserRole(e.target.value)}
            maxLength={30}
            placeholder="e.g. Customer"
            disabled={isSaving}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-sub focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand disabled:opacity-60"
          />
        </div>
        <div>
          <label htmlFor="roleplay-ai-role" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sub">
            AI is
          </label>
          <input
            id="roleplay-ai-role"
            type="text"
            value={aiRole}
            onChange={(e) => setAiRole(e.target.value)}
            maxLength={30}
            placeholder="e.g. Barista"
            disabled={isSaving}
            className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-sub focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand disabled:opacity-60"
          />
        </div>
      </div>

      <div className="mt-6">
        <label htmlFor="roleplay-title" className="text-[11px] font-semibold uppercase tracking-[0.1em] text-sub">
          Title
        </label>
        <input
          id="roleplay-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={50}
          placeholder="e.g. Returning a broken appliance"
          disabled={isSaving}
          className="mt-2 w-full rounded-xl border border-line bg-surface px-4 py-3 text-sm text-ink placeholder:text-sub focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand disabled:opacity-60"
        />
      </div>

      <div className="mt-6 flex gap-2">
        {DIFFICULTIES.map((diff) => {
          const selected = difficulty === diff;
          return (
            <button
              key={diff}
              type="button"
              onClick={() => setDifficulty(diff)}
              disabled={isSaving}
              aria-pressed={selected}
              className={`rounded-full border px-4 py-2 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand ${
                selected ? "border-ink bg-ink text-cream" : "border-line bg-surface text-sub hover:border-sub/40"
              }`}
            >
              {diff}
            </button>
          );
        })}
      </div>

      {errorMessage && (
        <p role="alert" className="mt-4 text-sm text-hot">
          {errorMessage}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!isValid || isSaving}
        className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-brand py-4 text-[17px] font-semibold text-cream transition hover:bg-accent-brand/90 disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
      >
        <Mic className="h-5 w-5" aria-hidden />
        {isSaving ? "Creating…" : "Set the scene"}
      </button>
    </div>
  );
}
