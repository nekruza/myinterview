import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfileRow } from "@/lib/db/profile";
import { needsOnboarding } from "@/lib/onboarding-storage";
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

  // Non-PGRST116 read failures (getProfileRow throws) fall through and let
  // the page render rather than redirect-looping into /onboarding.
  let profileRow = null;
  try {
    profileRow = await getProfileRow(supabase, user.id);
  } catch {
    profileRow = undefined;
  }

  if (profileRow !== undefined && needsOnboarding(profileRow)) {
    redirect("/onboarding");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .single();
  const avatarUrl: string | null = profile?.avatar_url ?? null;

  return (
    <div className="flex h-screen overflow-hidden relative bg-cream">
      <AppLayoutClient
        userId={user.id}
        userEmail={user.email ?? null}
        avatarUrl={avatarUrl}
      >
        {children}
      </AppLayoutClient>
    </div>
  );
}
