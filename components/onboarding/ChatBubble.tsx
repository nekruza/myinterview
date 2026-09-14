import { cn } from "@/lib/utils";

/**
 * Chat bubble used by the tutor-led onboarding steps. Ported from fina's
 * `components/onboarding/OnboardingShared.tsx` `Bubble` — tutor bubbles sit
 * left in a cream card, the learner's own echoed answer sits right in ink.
 */
export function ChatBubble({
  children,
  from = "tutor",
}: {
  children: React.ReactNode;
  from?: "tutor" | "you";
}) {
  const isTutor = from === "tutor";
  return (
    <div className={cn("mb-1.5 flex", isTutor ? "justify-start" : "justify-end")}>
      <div
        className={cn(
          "max-w-[82%] rounded-[20px] px-4 py-2.5 text-base leading-6",
          isTutor
            ? "rounded-bl-md border border-line bg-surface text-ink"
            : "rounded-br-md bg-ink text-white"
        )}
      >
        {children}
      </div>
    </div>
  );
}
