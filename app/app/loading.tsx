import {
  BannerSkeleton,
  CardSkeleton,
  LoadingRegion,
} from "@/components/skeletons";

// Fallback for every /app/* route that doesn't define its own loading.tsx
// (settings, peer-practice, resources, contact). The sidebar lives in the
// layout, so only the page area swaps in this placeholder.
export default function AppLoading() {
  return (
    <LoadingRegion className="space-y-6 pb-8">
      <BannerSkeleton />
      <div className="grid gap-4 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
      <CardSkeleton className="min-h-48" />
    </LoadingRegion>
  );
}
