import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

// The default Skeleton uses bg-accent, which is nearly identical to the app's
// #faf9f6 background — override it so placeholders are actually visible.
export function SkeletonBlock({ className }: { className?: string }) {
  return <Skeleton className={cn("bg-neutral-200/70", className)} />;
}

/** Placeholder for the dark-green page header banner used across /app pages. */
export function BannerSkeleton() {
  return (
    <div
      className="rounded-2xl p-6"
      style={{ background: "linear-gradient(135deg, #071a09 0%, #0d2410 100%)" }}
    >
      <Skeleton className="h-2.5 w-28 mb-3 bg-white/10" />
      <Skeleton className="h-7 w-48 mb-2.5 bg-white/15" />
      <Skeleton className="h-3.5 w-72 max-w-full bg-white/10" />
    </div>
  );
}

/** Placeholder for a white glass card with a heading line and a few body lines. */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("glass-card rounded-2xl p-5", className)}>
      <SkeletonBlock className="h-4 w-1/3 mb-4" />
      <SkeletonBlock className="h-3 w-full mb-2.5" />
      <SkeletonBlock className="h-3 w-5/6 mb-2.5" />
      <SkeletonBlock className="h-3 w-2/3" />
    </div>
  );
}

/** Wrapper that announces the loading state to assistive tech. */
export function LoadingRegion({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className={className}>
      <span className="sr-only">Loading…</span>
      {children}
    </div>
  );
}
