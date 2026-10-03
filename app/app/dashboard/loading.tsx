import { LoadingRegion, SkeletonBlock } from "@/components/skeletons";

// Mirrors dashboard/page.tsx: greeting row, then a 3fr/2fr grid of two 380px cards.
export default function DashboardLoading() {
  return (
    <LoadingRegion className="space-y-5 pb-12">
      <div>
        <SkeletonBlock className="h-8 w-64 max-w-full mb-2" />
        <SkeletonBlock className="h-4 w-52 max-w-full" />
      </div>

      <div className="grid gap-3 grid-cols-1 md:grid-cols-[3fr_2fr]">
        <div
          className="rounded-2xl p-6"
          style={{
            minHeight: 380,
            background: "linear-gradient(160deg, #071a09 0%, #112914 50%, #0a2010 100%)",
          }}
        >
          <SkeletonBlock className="h-5 w-24 rounded-full mb-4 bg-white/10" />
          <SkeletonBlock className="h-6 w-44 mb-2 bg-white/15" />
          <SkeletonBlock className="h-3 w-64 max-w-full mb-6 bg-white/10" />
          <div className="grid grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <SkeletonBlock key={i} className="aspect-[4/5] rounded-xl bg-white/10" />
            ))}
          </div>
        </div>

        <SkeletonBlock className="rounded-2xl min-h-[380px]" />
      </div>
    </LoadingRegion>
  );
}
