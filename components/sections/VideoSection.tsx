import { FC } from "react";

const VIDEO_URL =
  "https://wgvyosffhhwkzbvhdwql.supabase.co/storage/v1/object/public/videos/myinterview-demo.mp4";

export const VideoSection: FC = () => {
  return (
    <section
      aria-labelledby="video-section-heading"
      className="px-4 sm:px-6 lg:px-8 relative -mt-[150px] lg:-mt-[320px]"
    >
      <div className="max-w-4xl mx-auto">
        <div className="relative aspect-video bg-neutral-900 rounded-2xl overflow-hidden">
          <video
            className="w-full h-full object-cover"
            controls
            playsInline
            preload="metadata"
            aria-label="MyInterview platform demo"
          >
            <source src={VIDEO_URL} type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
};
