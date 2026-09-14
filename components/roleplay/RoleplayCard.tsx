"use client";

import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { RoleplayScenario } from "@/lib/types/roleplay";

export interface RoleplayCardProps {
  scenario: RoleplayScenario;
  href: string;
  /** Custom (user-created) roleplays show a "Custom" badge and, with `onDelete`, a delete button. */
  isCustom?: boolean;
  onDelete?: () => void;
}

/** A single roleplay scenario tile in the `/app/roleplay` grid. */
export function RoleplayCard({ scenario, href, isCustom, onDelete }: RoleplayCardProps) {
  return (
    <div className="relative">
      <Link
        href={href}
        className="flex min-h-[200px] flex-col items-center rounded-3xl border border-line bg-surface p-5 text-center transition hover:border-sub/40 hover:shadow-[0_16px_32px_-24px_rgba(27,26,23,0.18)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
      >
        <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl">
          <span aria-hidden>{scenario.emoji}</span>
        </div>

        <p className="font-display text-base leading-snug text-ink">{scenario.title}</p>
        <p className="mt-1.5 line-clamp-2 text-sm leading-relaxed text-sub">{scenario.description}</p>

        <div className="mt-auto pt-3">
          <span className="inline-flex items-center rounded-full bg-cream px-3 py-1 text-xs font-semibold text-sub">
            {scenario.difficulty}
          </span>
        </div>
      </Link>

      {isCustom && (
        <span className="pointer-events-none absolute top-2 left-2 rounded-full bg-ink px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-cream">
          Custom
        </span>
      )}

      {isCustom && onDelete && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${scenario.title}`}
          className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full border border-line bg-surface text-sub transition hover:text-hot focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-brand"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden />
        </button>
      )}
    </div>
  );
}
