import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppLayoutClient } from "./AppLayoutClient";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const headerList = await headers();
  const pathname = headerList.get("x-pathname") ?? "";
  const isPublicRoute = pathname === "/app/practice";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && !isPublicRoute) {
    redirect("/login");
  }

  let avatarUrl: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
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
      <AppLayoutClient
        userId={user?.id ?? null}
        userEmail={user?.email ?? null}
        avatarUrl={avatarUrl}
      >
        {children}
      </AppLayoutClient>
    </div>
  );
}
