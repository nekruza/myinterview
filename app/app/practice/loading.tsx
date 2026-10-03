import {
  BannerSkeleton,
  CardSkeleton,
  LoadingRegion,
} from "@/components/skeletons";

// Mirrors the practice setup view: banner, then a form column beside a narrower sidebar.
export default function PracticeLoading() {
  return (
    <LoadingRegion className="max-w-5xl mx-auto w-full space-y-6">
      <BannerSkeleton />
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-5">
          <CardSkeleton className="min-h-40" />
          <CardSkeleton className="min-h-40" />
        </div>
        <div className="hidden lg:block w-72 shrink-0">
          <CardSkeleton className="min-h-56" />
        </div>
      </div>
    </LoadingRegion>
  );
}
