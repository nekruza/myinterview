"use client";

import { FC, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  User,
  Briefcase,
  Bell,
  CreditCard,
  LogOut,
  Save,
  X,
} from "lucide-react";

const EXPERIENCE_LEVELS = [
  { value: "junior", label: "Junior (0-2 years)" },
  { value: "mid", label: "Mid-Level (3-5 years)" },
  { value: "senior", label: "Senior (6-9 years)" },
  { value: "staff", label: "Staff / Principal (10+ years)" },
];

const TIMELINE_OPTIONS = [
  { value: "1month", label: "Within 1 month" },
  { value: "3months", label: "1-3 months" },
  { value: "6months", label: "3-6 months" },
  { value: "exploring", label: "Just exploring" },
];

const COMPANY_SUGGESTIONS = [
  "Google",
  "Meta",
  "Amazon",
  "Apple",
  "Netflix",
  "Microsoft",
  "Stripe",
  "Airbnb",
  "Uber",
  "Lyft",
];

interface SettingsProps {
  searchParams?: Record<string, string>;
}

const SettingsPage: FC<SettingsProps> = () => {
  const router = useRouter();
  const supabase = createClient();

  const [userEmail] = useState<string>(() => {
    // Will be populated from Supabase on mount via useEffect in a real scenario
    // For now, show placeholder — the server layout already validated auth
    return "";
  });
  const [displayName, setDisplayName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [timeline, setTimeline] = useState("3months");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");

  // Load user on mount
  useState(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setDisplayName(user.user_metadata?.full_name ?? "");
      }
    });
  });

  function addCompany(company: string) {
    const trimmed = company.trim();
    if (trimmed && !targetCompanies.includes(trimmed)) {
      setTargetCompanies((prev) => [...prev, trimmed]);
    }
    setCompanyInput("");
  }

  function removeCompany(company: string) {
    setTargetCompanies((prev) => prev.filter((c) => c !== company));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: displayName,
          experience_level: experienceLevel,
          interview_timeline: timeline,
          target_companies: targetCompanies,
          email_notifications: emailNotifs,
          match_alerts: matchAlerts,
        },
      });
      toast.success("Settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-secondary">Settings</h1>
        <p className="text-neutral-500 mt-1">
          Manage your profile, preferences, and account.
        </p>
      </div>

      {/* Profile */}
      <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
          <User className="w-4 h-4 text-neutral-400" />
          <h2 className="font-semibold text-secondary text-sm">Profile</h2>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your name"
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Email
            </label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-400 bg-neutral-50 cursor-not-allowed"
            />
            <p className="text-xs text-neutral-400 mt-1">Email cannot be changed here.</p>
          </div>
        </div>
      </section>

      {/* Interview Preferences */}
      <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
          <Briefcase className="w-4 h-4 text-neutral-400" />
          <h2 className="font-semibold text-secondary text-sm">Interview Preferences</h2>
        </div>
        <div className="p-6 space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Experience Level
            </label>
            <select
              value={experienceLevel}
              onChange={(e) => setExperienceLevel(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
            >
              {EXPERIENCE_LEVELS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Interview Timeline
            </label>
            <select
              value={timeline}
              onChange={(e) => setTimeline(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
            >
              {TIMELINE_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-600 mb-1.5 uppercase tracking-wide">
              Target Companies
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {targetCompanies.map((company) => (
                <span
                  key={company}
                  className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                  style={{ background: "#f4fdf3", color: "#112715" }}
                >
                  {company}
                  <button
                    onClick={() => removeCompany(company)}
                    className="hover:opacity-70 transition"
                    aria-label={`Remove ${company}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCompany(companyInput);
                  }
                }}
                placeholder="Type a company and press Enter"
                className="flex-1 px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
              />
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {COMPANY_SUGGESTIONS.filter((c) => !targetCompanies.includes(c)).map(
                (company) => (
                  <button
                    key={company}
                    onClick={() => addCompany(company)}
                    className="px-2.5 py-1 rounded-full text-xs border border-neutral-200 text-neutral-500 hover:border-primary hover:text-secondary transition"
                  >
                    + {company}
                  </button>
                )
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Notifications */}
      <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
          <Bell className="w-4 h-4 text-neutral-400" />
          <h2 className="font-semibold text-secondary text-sm">Notifications</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            {
              id: "emailNotifs",
              label: "Email notifications",
              description: "Receive updates about your practice sessions and platform news.",
              value: emailNotifs,
              onChange: setEmailNotifs,
            },
            {
              id: "matchAlerts",
              label: "Match alerts",
              description: "Get notified when a practice partner match is found.",
              value: matchAlerts,
              onChange: setMatchAlerts,
            },
          ].map(({ id, label, description, value, onChange }) => (
            <div key={id} className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-secondary">{label}</p>
                <p className="text-xs text-neutral-400 mt-0.5">{description}</p>
              </div>
              <button
                role="switch"
                aria-checked={value}
                onClick={() => onChange(!value)}
                className="relative shrink-0 w-10 h-5 rounded-full transition-colors duration-200"
                style={{ background: value ? "#2dec29" : "#e5e7eb" }}
              >
                <span
                  className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200"
                  style={{ transform: value ? "translateX(20px)" : "translateX(0)" }}
                />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Subscription */}
      <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
          <CreditCard className="w-4 h-4 text-neutral-400" />
          <h2 className="font-semibold text-secondary text-sm">Subscription</h2>
        </div>
        <div className="p-6 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-secondary">Free Plan</p>
            <p className="text-xs text-neutral-400 mt-0.5">
              Upgrade to Pro for unlimited sessions and AI practice.
            </p>
          </div>
          <button
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90"
            style={{ background: "#112715", color: "#fff" }}
            disabled
          >
            Upgrade — Coming Soon
          </button>
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 pb-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default SettingsPage;
