import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayoutClient } from "./AppLayoutClient";

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
      <AppLayoutClient userEmail={user.email ?? ""} avatarUrl={profile?.avatar_url ?? null}>
        {children}
      </AppLayoutClient>
    </div>
  );
}
