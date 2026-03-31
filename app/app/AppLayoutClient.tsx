"use client";

import { QueryProvider } from "@/components/QueryProvider";
import { AppSidebar } from "./AppSidebar";
import { Toaster } from "@/components/ui/sonner";

interface AppLayoutClientProps {
  children: React.ReactNode;
  userEmail: string;
  avatarUrl: string | null;
}

export function AppLayoutClient({ children, userEmail, avatarUrl }: AppLayoutClientProps) {
  return (
    <QueryProvider>
      <AppSidebar userEmail={userEmail} avatarUrl={avatarUrl} />
      <main className="relative z-10 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-24 md:pb-8">{children}</div>
      </main>
      <Toaster position="top-right" />
      {/* Hidden audio element for Inworld Realtime agent voice playback */}
      <audio id="inworld-agent-audio" autoPlay playsInline style={{ display: "none" }} />
    </QueryProvider>
  );
}
