import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/sonner";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url, onboarding_complete")
    .eq("id", user.id)
    .single();

  if (!profile?.onboarding_complete) {
    redirect("/onboarding");
  }

  return (
    <div className="flex h-screen overflow-hidden relative" style={{
      background: "linear-gradient(135deg, #faf9f6 0%, #f5f4f0 100%)",
    }}>
      {/* Subtle ambient blob for glass depth */}
      <div
        className="pointer-events-none absolute inset-0 z-0"
        aria-hidden
        style={{
          background: "radial-gradient(ellipse 50% 60% at 0% 50%, rgba(180,200,220,0.08) 0%, transparent 70%)",
        }}
      />
      <AppSidebar userEmail={user.email ?? ""} avatarUrl={profile?.avatar_url ?? null} />
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-8">{children}</div>
      </main>
      <Toaster position="top-right" />
      {/* Hidden audio element for Inworld Realtime agent voice playback */}
      <audio id="inworld-agent-audio" autoPlay playsInline style={{ display: "none" }} />
    </div>
  );
}
