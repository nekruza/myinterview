"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  FC,
  ReactNode,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui";
import { track } from "@/lib/mixpanel";

interface ComingSoonContextType {
  openModal: () => void;
}

const ComingSoonContext = createContext<ComingSoonContextType>({
  openModal: () => {},
});

export function useComingSoon() {
  return useContext(ComingSoonContext);
}

export const ComingSoonProvider: FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = useCallback(() => {
    setSubmitted(false);
    setEmail("");
    setError(null);
    setOpen(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error("Failed");
      track("Waitlist Signup", { email });
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <ComingSoonContext.Provider value={{ openModal }}>
      {children}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md bg-white text-neutral-900 p-0 overflow-hidden">
          {/* Top accent bar */}
          <div className="h-2 bg-primary w-full" />

          <div className="px-8 pb-8 pt-6">
            {submitted ? (
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                  <svg
                    className="w-8 h-8 text-primary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <DialogHeader className="mb-2">
                  <DialogTitle className="text-2xl font-black text-secondary">
                    You&apos;re on the list! 🎉
                  </DialogTitle>
                </DialogHeader>
                <p className="text-neutral-600 text-sm leading-relaxed">
                  We&apos;ll email you the moment MyInterview launches. You&apos;ll be
                  among the first to get access.
                </p>
              </div>
            ) : (
              <>
                <DialogHeader className="mb-6">
                  <div className="text-5xl mb-4">🚀</div>
                  <DialogTitle className="text-2xl font-black text-secondary mb-2">
                    We&apos;re Launching Soon
                  </DialogTitle>
                  <DialogDescription className="text-neutral-600 leading-relaxed">
                    MyInterview is in active development. Drop your email and
                    we&apos;ll notify you the moment we go live — plus early access
                    perks for beta users.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-3">
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="border-neutral-300 text-neutral-900 placeholder:text-neutral-400 h-11"
                  />
                  {error && (
                    <p className="text-sm text-red-500">{error}</p>
                  )}
                  <Button type="submit" size="lg" className="w-full" disabled={loading}>
                    {loading ? "Saving..." : "Notify Me at Launch"}
                  </Button>
                </form>

                <p className="text-xs text-neutral-400 text-center mt-4">
                  No spam. Unsubscribe any time.
                </p>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </ComingSoonContext.Provider>
  );
};
