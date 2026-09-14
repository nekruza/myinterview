import { cn } from "@/lib/utils";

/**
 * A selectable option row for the chat-driven onboarding steps (language,
 * level, motivation, goal). Fills ink and turns its text/description white
 * when selected. Ported from fina's `assessment.tsx` local `OptionRow`.
 */
export function OptionRow({
  selected,
  onSelect,
  ariaLabel,
  children,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  ariaLabel: string;
  children: React.ReactNode;
  badge?: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={ariaLabel}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 rounded-2xl border px-4 py-3.5 text-left transition-colors",
        selected
          ? "border-ink bg-ink text-white"
          : "border-line bg-surface text-ink hover:border-ink/40"
      )}
    >
      <div className="flex-1">{children}</div>
      {badge}
    </button>
  );
}
