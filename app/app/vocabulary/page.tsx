"use client";

import Image from "next/image";
import Link from "next/link";
import { Heart, Sparkles } from "lucide-react";
import { useProfile } from "@/lib/queries/profile";

export default function VocabularyHomePage() {
  const { data: profile } = useProfile();
  const showProBadge = !!profile && !profile.pro.isPro;
  const freeLeft = profile?.usage.freeGenerationsRemaining ?? 0;

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="font-display text-3xl text-ink">Vocabulary</h1>
      <p className="mt-1.5 text-base text-sub">Learn, generate, and manage your words</p>

      <div className="mt-8 flex flex-col gap-4">
        <Link
          href="/app/vocabulary/lessons"
          className="group relative overflow-hidden rounded-3xl border border-line bg-surface transition hover:border-sub/40 hover:shadow-[0_20px_40px_-28px_rgba(27,26,23,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <div className="relative h-48 w-full sm:h-56">
            <Image src="/images/topics-main.png" alt="" fill className="object-cover" priority />
          </div>
          <div className="p-5">
            <p className="font-display text-xl text-ink">Words by Topic</p>
            <p className="mt-1 text-sm text-sub">Learn new words and their meanings</p>
          </div>
        </Link>

        <Link
          href="/app/vocabulary/generate"
          className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:border-sub/40 hover:shadow-[0_16px_32px_-24px_rgba(27,26,23,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-brand">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="flex items-center gap-2">
              <span className="font-display text-lg text-ink">Generate Words</span>
              {showProBadge && (
                <span className="rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
                  PRO
                </span>
              )}
            </span>
            <span className="block text-sm text-sub">
              AI-powered vocabulary on any topic
              {showProBadge && ` · ${freeLeft} free left`}
            </span>
          </span>
        </Link>

        <Link
          href="/app/vocabulary/favorites"
          className="flex items-center gap-4 rounded-3xl border border-line bg-surface p-5 transition hover:border-sub/40 hover:shadow-[0_16px_32px_-24px_rgba(27,26,23,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent-soft text-accent-brand">
            <Heart className="h-5 w-5" aria-hidden />
          </span>
          <span className="flex-1">
            <span className="font-display text-lg text-ink">Favorites</span>
            <span className="block text-sm text-sub">Your saved words</span>
          </span>
        </Link>
      </div>
    </div>
  );
}
