"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Mic, BookOpen, MessageSquare } from "lucide-react";
import { useProfile, useUpdateProfile } from "@/lib/queries/profile";
import { LanguageLevelSwitcher } from "@/components/home/LanguageLevelSwitcher";
import { StreakCard } from "@/components/home/StreakCard";
import { StudyPlanCard } from "@/components/home/StudyPlanCard";
import { ProUpgradeDialog } from "@/components/ProUpgradeDialog";
import { useFeedbackDialog } from "@/components/FeedbackProvider";
import { DEFAULT_TUTOR_ID, isTutorId } from "@/lib/tutors";
import { isLanguageId, type LanguageId } from "@/lib/languages";
import { isUserLevel, type UserLevel } from "@/lib/levels";

const EMPTY_WEEK: boolean[] = [false, false, false, false, false, false, false];

function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

/**
 * `/app` home dashboard. Ported from fina `app/(tabs)/index.tsx`: greeting +
 * language/level switcher header, streak card, today's study-plan card, and
 * a quick-actions grid. The greeting is computed after mount so it reflects
 * the visitor's own local hour rather than the server's clock/timezone.
 */
export function HomeClient() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const feedbackDialog = useFeedbackDialog();
  const [greeting, setGreeting] = useState<string | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  useEffect(() => {
    async function computeGreeting() {
      setGreeting(greetingForHour(new Date().getHours()));
    }
    computeGreeting();
  }, []);

  const firstName = profile?.displayName ? profile.displayName.split(" ")[0] : "there";
  const language: LanguageId = isLanguageId(profile?.targetLanguage) ? profile!.targetLanguage : "english";
  const level: UserLevel = isUserLevel(profile?.level) ? profile!.level : "beginner";
  const tutorId = isTutorId(profile?.tutorId) ? profile!.tutorId : DEFAULT_TUTOR_ID;

  function handleLanguageChange(id: LanguageId) {
    updateProfile.mutate({ targetLanguage: id });
  }

  function handleLevelChange(next: UserLevel) {
    updateProfile.mutate({ level: next });
  }

  return (
    <div className="mx-auto max-w-3xl">
      <header className="flex items-start justify-between gap-4">
        <div>
          {greeting ? (
            <h1 className="font-display text-3xl text-ink">
              {greeting}, {firstName}
            </h1>
          ) : (
            <div className="h-9 w-56 rounded-lg bg-line motion-safe:animate-pulse" aria-hidden />
          )}

          <div className="mt-2 min-h-[30px]">
            {isLoading ? null : profile?.pro.isPro ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ink px-3 py-1.5 text-xs font-semibold text-cream">
                <Sparkles className="h-3 w-3" aria-hidden />
                Pro
              </span>
            ) : (
              <button
                type="button"
                onClick={() => setUpgradeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-full bg-accent-brand px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-accent-brand/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
              >
                <Sparkles className="h-3 w-3" aria-hidden />
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>

        <LanguageLevelSwitcher
          language={language}
          level={level}
          onLanguageChange={handleLanguageChange}
          onLevelChange={handleLevelChange}
        />
      </header>

      <div className="mt-6">
        <StreakCard
          currentStreak={profile?.streak.current ?? 0}
          weeklyActivity={profile?.streak.weeklyActivity ?? EMPTY_WEEK}
          isLoading={isLoading}
        />
      </div>

      {profile && (
        <div className="mt-4">
          <StudyPlanCard
            userId={profile.id}
            targetLanguage={language}
            tutorId={tutorId}
            studyPlanStartDate={profile.studyPlan.startDate}
            completedDays={profile.studyPlan.completedDays}
          />
        </div>
      )}

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link
          href="/app/roleplay"
          className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 transition hover:border-sub/40 hover:shadow-[0_16px_32px_-24px_rgba(27,26,23,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-brand">
            <Mic className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-lg text-ink">Voice chat</span>
            <span className="block text-sm text-sub">Choose a roleplay and practise speaking</span>
          </span>
        </Link>

        <Link
          href="/app/vocabulary"
          className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 transition hover:border-sub/40 hover:shadow-[0_16px_32px_-24px_rgba(27,26,23,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-brand">
            <BookOpen className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-lg text-ink">Words</span>
            <span className="block text-sm text-sub">Learn and manage your vocabulary</span>
          </span>
        </Link>

        <button
          type="button"
          onClick={() => feedbackDialog.open()}
          className="flex flex-col gap-3 rounded-3xl border border-line bg-surface p-5 text-left transition hover:border-sub/40 hover:shadow-[0_16px_32px_-24px_rgba(27,26,23,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-accent-brand">
            <MessageSquare className="h-5 w-5" aria-hidden />
          </span>
          <span>
            <span className="block font-display text-lg text-ink">Give us feedback</span>
            <span className="block text-sm text-sub">Help us improve Fina</span>
          </span>
        </button>
      </div>

      <ProUpgradeDialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} reason="upgrade" />
    </div>
  );
}
