import {
  BannerSkeleton,
  CardSkeleton,
  LoadingRegion,
  SkeletonBlock,
} from "@/components/skeletons";

// Mirrors progress/page.tsx: banner, 4 stat cards, then chart/history cards.
export default function ProgressLoading() {
  return (
    <LoadingRegion className="space-y-6 pb-8">
      <BannerSkeleton />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-card rounded-2xl p-5">
            <SkeletonBlock className="h-9 w-9 rounded-xl mb-4" />
            <SkeletonBlock className="h-7 w-16 mb-2" />
            <SkeletonBlock className="h-3 w-24" />
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <CardSkeleton className="min-h-64" />
        <CardSkeleton className="min-h-64" />
      </div>
    </LoadingRegion>
  );
}
