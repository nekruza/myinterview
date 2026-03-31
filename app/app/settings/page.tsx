"use client";

import { FC, useState, useRef, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Briefcase,
  CreditCard,
  LogOut,
  Save,
  X,
  Camera,
  FileText,
  Upload,
  Trash2,
  Loader2,
  Mail,
  Pencil,
  MapPin,
  Calendar,
} from "lucide-react";
import { ResumeUpload } from "@/components/ResumeUpload";
import { useSettingsProfile } from "@/lib/queries/profile";
import { useSubscription } from "@/lib/queries/subscription";
import { useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "@/lib/queries/keys";

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

const INTERVIEW_STYLE_OPTIONS = [
  { value: "behavioral", label: "Behavioral" },
  { value: "technical", label: "Technical" },
  { value: "case", label: "Case Study" },
  { value: "mixed", label: "Mixed" },
];

const DURATION_OPTIONS = [
  { value: "15", label: "15 minutes" },
  { value: "30", label: "30 minutes" },
  { value: "45", label: "45 minutes" },
  { value: "60+", label: "60+ minutes" },
];

const PRACTICE_PARTNER_OPTIONS = [
  { value: "ai", label: "With AI" },
];

const LANGUAGE_OPTIONS = [
  { value: "english", label: "English" },
  { value: "spanish", label: "Spanish" },
  { value: "french", label: "French" },
  { value: "german", label: "German" },
  { value: "mandarin", label: "Mandarin" },
  { value: "other", label: "Other" },
];

const PLATFORM_OPTIONS = [
  { value: "zoom", label: "Zoom" },
  { value: "meet", label: "Google Meet" },
  { value: "teams", label: "MS Teams" },
  { value: "coderpad", label: "CoderPad" },
  { value: "hirevue", label: "HireVue" },
  { value: "any", label: "No Preference" },
];

const FEEDBACK_OPTIONS = [
  { value: "detailed", label: "Detailed Critique" },
  { value: "overview", label: "High-Level Overview" },
  { value: "score", label: "Score Only" },
  { value: "none", label: "No Feedback" },
];

function optionLabel(opts: { value: string; label: string }[], val: string) {
  return opts.find((o) => o.value === val)?.label ?? val;
}

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

function experienceLabel(value: string) {
  return EXPERIENCE_LEVELS.find((l) => l.value === value)?.label ?? value;
}

function timelineLabel(value: string) {
  return TIMELINE_OPTIONS.find((t) => t.value === value)?.label ?? value;
}

interface SettingsProps {
  searchParams?: Record<string, string>;
}

const SettingsPage: FC<SettingsProps> = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);


  const [displayName, setDisplayName] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("mid");
  const [timeline, setTimeline] = useState("3months");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [companyInput, setCompanyInput] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [matchAlerts, setMatchAlerts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [userId, setUserId] = useState("");

  // Upload states
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeLoaded, setResumeLoaded] = useState(false);

  // Onboarding preferences
  const [interviewStyle, setInterviewStyle] = useState("");
  const [interviewDuration, setInterviewDuration] = useState("");
  const [practicePartner, setPracticePartner] = useState("");
  const [interviewLanguage, setInterviewLanguage] = useState("");
  const [interviewPlatform, setInterviewPlatform] = useState("");
  const [feedbackPreference, setFeedbackPreference] = useState("");
  const [wantsTips, setWantsTips] = useState<boolean | null>(null);

  // Subscription
  const [plan, setPlan] = useState<"free" | "pro">("free");
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(false);
  const [currentPeriodEnd, setCurrentPeriodEnd] = useState<string | null>(null);
  const [upgradingPlan, setUpgradingPlan] = useState(false);

  // Edit modes
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);

  // React Query hooks
  const { data: settingsProfile } = useSettingsProfile();
  const { data: subscriptionData, refetch: refetchSubscription } = useSubscription();
  const queryClient = useQueryClient();

  // Returns the fetched plan so callers can act on it directly
  const loadPlan = useCallback(async (): Promise<"free" | "pro"> => {
    const result = await refetchSubscription();
    return (result.data?.plan as "free" | "pro") ?? "free";
  }, [refetchSubscription]);

  useEffect(() => {
    if (searchParams?.get("upgraded") !== "true") return;

    toast.success("Welcome to Pro! Setting up your account…");
    router.replace("/app/settings");

    let cancelled = false;
    const delays = [2000, 4000, 6000, 8000, 10000, 12000, 15000, 20000];
    let timeoutId: ReturnType<typeof setTimeout>;

    const poll = async (attemptIndex: number) => {
      if (cancelled) return;
      const fetched = await loadPlan();
      if (cancelled) return;
      if (fetched === "pro") {
        toast.success("You're now on Pro! Enjoy unlimited access.");
        return;
      }
      if (attemptIndex + 1 < delays.length) {
        timeoutId = setTimeout(() => poll(attemptIndex + 1), delays[attemptIndex + 1]);
      }
    };

    timeoutId = setTimeout(() => poll(0), delays[0]);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 1: Sync auth user (email + userId)
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        setEmail(user.email ?? "");
        setUserId(user.id);
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 2: Sync profile data into form state
  useEffect(() => {
    if (!settingsProfile) return;
    if (settingsProfile.full_name) setDisplayName(settingsProfile.full_name);
    if (settingsProfile.experience_level) setExperienceLevel(settingsProfile.experience_level);
    if (settingsProfile.interview_timeline) setTimeline(settingsProfile.interview_timeline);
    if (settingsProfile.target_companies?.length) setTargetCompanies(settingsProfile.target_companies);
    if (settingsProfile.email_notifications !== null && settingsProfile.email_notifications !== undefined)
      setEmailNotifs(settingsProfile.email_notifications);
    if (settingsProfile.match_alerts !== null && settingsProfile.match_alerts !== undefined)
      setMatchAlerts(settingsProfile.match_alerts);
    if (settingsProfile.interview_style) setInterviewStyle(settingsProfile.interview_style);
    if (settingsProfile.interview_duration) setInterviewDuration(settingsProfile.interview_duration);
    if (settingsProfile.practice_partner) setPracticePartner(settingsProfile.practice_partner);
    if (settingsProfile.interview_language) setInterviewLanguage(settingsProfile.interview_language);
    if (settingsProfile.interview_platform) setInterviewPlatform(settingsProfile.interview_platform);
    if (settingsProfile.feedback_preference) setFeedbackPreference(settingsProfile.feedback_preference);
    if (settingsProfile.wants_tips !== null && settingsProfile.wants_tips !== undefined)
      setWantsTips(settingsProfile.wants_tips);
    setAvatarUrl(settingsProfile.avatar_url ?? null);
    if (settingsProfile.resume_url) {
      const parts = settingsProfile.resume_url.split("/");
      setResumeName(decodeURIComponent(parts[parts.length - 1]));
    }
    setResumeLoaded(true);
  }, [settingsProfile]); // eslint-disable-line react-hooks/exhaustive-deps

  // Effect 3: Sync subscription into plan state
  useEffect(() => {
    if (!subscriptionData) return;
    setPlan((subscriptionData.plan as "free" | "pro") ?? "free");
    setCancelAtPeriodEnd(subscriptionData.cancel_at_period_end ?? false);
    setCurrentPeriodEnd(subscriptionData.current_period_end ?? null);
  }, [subscriptionData]);

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5 MB");
      return;
    }

    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${userId}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      const freshUrl = `${publicUrl}?t=${Date.now()}`;

      await supabase
        .from("profiles")
        .update({ avatar_url: freshUrl })
        .eq("id", userId);

      setAvatarUrl(freshUrl);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settingsProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Photo updated");
    } catch {
      toast.error("Failed to upload photo");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  }

  async function handleRemoveAvatar() {
    if (!userId) return;
    setUploadingAvatar(true);
    try {
      const { data: files } = await supabase.storage
        .from("avatars")
        .list(userId);

      if (files?.length) {
        await supabase.storage
          .from("avatars")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }

      await supabase
        .from("profiles")
        .update({ avatar_url: null })
        .eq("id", userId);

      setAvatarUrl(null);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settingsProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setUploadingAvatar(false);
    }
  }


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

  async function handleUpgrade() {
    setUpgradingPlan(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Could not start checkout. Please try again.");
    } finally {
      setUpgradingPlan(false);
    }
  }

  async function handleManageSubscription() {
    setUpgradingPlan(true);
    try {
      const res = await fetch("/api/stripe/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) window.location.href = data.url;
    } catch {
      toast.error("Could not open billing portal. Please try again.");
    } finally {
      setUpgradingPlan(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await supabase
        .from("profiles")
        .update({
          full_name: displayName,
          experience_level: experienceLevel,
          interview_timeline: timeline,
          target_companies: targetCompanies,
          email_notifications: emailNotifs,
          match_alerts: matchAlerts,
          interview_style: interviewStyle,
          interview_duration: interviewDuration,
          practice_partner: practicePartner,
          interview_language: interviewLanguage,
          interview_platform: interviewPlatform,
          feedback_preference: feedbackPreference,
          wants_tips: wantsTips,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      // Keep auth display name in sync
      await supabase.auth.updateUser({ data: { full_name: displayName } });

      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.settingsProfile });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.profile });
      toast.success("Settings saved");
      setEditingProfile(false);
      setEditingPrefs(false);
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

  const initials = (displayName || email)
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="space-y-6">
      {/* Hidden file inputs */}
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={handleAvatarUpload}
      />

      {/* ── Profile Card (full width, LinkedIn-style) ── */}
      <section className="glass-card rounded-2xl overflow-hidden">
        {/* Banner */}
        <div
          className="h-36 relative"
          style={{
            background:
              "linear-gradient(135deg, #112715 0%, #1a3d20 40%, #2dec29 100%)",
          }}
        />

        {/* Avatar overlapping banner */}
        <div className="px-6 -mt-14 relative z-10">
          <div className="relative group inline-block">
            <div
              className="w-28 h-28 rounded-full overflow-hidden flex items-center justify-center ring-4 ring-white"
              style={{ background: "#2dec29", color: "#112715" }}
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="Profile photo"
                  width={112}
                  height={112}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold">{initials}</span>
              )}
            </div>
            {uploadingAvatar && (
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              </div>
            )}
            <button
              onClick={() => avatarInputRef.current?.click()}
              disabled={uploadingAvatar}
              className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-white shadow-md border border-neutral-200 flex items-center justify-center hover:bg-neutral-50 transition"
            >
              <Camera className="w-4 h-4 text-neutral-600" />
            </button>
          </div>
          {avatarUrl && (
            <button
              onClick={handleRemoveAvatar}
              disabled={uploadingAvatar}
              className="ml-3 text-xs text-neutral-400 hover:text-red-500 transition align-bottom"
            >
              Remove photo
            </button>
          )}
        </div>

        {/* Profile info */}
        <div className="px-6 pt-3 pb-6">
          {editingProfile ? (
            <div className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Full Name
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
                <label className="block text-xs font-medium text-neutral-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-neutral-400 bg-neutral-50 cursor-not-allowed"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingProfile(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold text-secondary">
                    {displayName || "Your Name"}
                  </h1>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {experienceLabel(experienceLevel)} &middot; Interview
                    Candidate
                  </p>
                </div>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="p-2 rounded-xl hover:bg-neutral-100 transition text-neutral-400 hover:text-neutral-600"
                  title="Edit profile"
                >
                  <Pencil className="w-4 h-4" />
                </button>
              </div>

              {/* Contact / meta row */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-xs text-neutral-500">
                <span className="flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  {email}
                </span>
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  {timelineLabel(timeline)}
                </span>
                {targetCompanies.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    {targetCompanies.slice(0, 3).join(", ")}
                    {targetCompanies.length > 3 &&
                      ` +${targetCompanies.length - 3}`}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Notification toggles inline */}
          <div className="mt-5 pt-5 border-t border-neutral-100 flex flex-wrap gap-x-8 gap-y-3">
            {[
              {
                id: "emailNotifs",
                label: "Email notifications",
                value: emailNotifs,
                onChange: setEmailNotifs,
              },
              {
                id: "matchAlerts",
                label: "Match alerts",
                value: matchAlerts,
                onChange: setMatchAlerts,
              },
            ].map(({ id, label, value, onChange }) => (
              <div key={id} className="flex items-center gap-3">
                <button
                  role="switch"
                  aria-checked={value}
                  onClick={() => onChange(!value)}
                  className="relative shrink-0 w-9 h-[18px] rounded-full transition-colors duration-200"
                  style={{ background: value ? "#2dec29" : "#e5e7eb" }}
                >
                  <span
                    className="absolute top-[2px] left-[2px] w-[14px] h-[14px] bg-white rounded-full shadow transition-transform duration-200"
                    style={{
                      transform: value
                        ? "translateX(18px)"
                        : "translateX(0)",
                    }}
                  />
                </button>
                <span className="text-xs text-neutral-500">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Two-column grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subscription — full width */}
        <section className="glass-card rounded-2xl overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <CreditCard className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-secondary text-sm">
              Subscription
            </h2>
          </div>
          <div className="p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-secondary">
                  {plan === "pro" ? "Pro Plan" : "Free Plan"}
                </p>
                {plan === "pro" && !cancelAtPeriodEnd && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#f4fdf3", color: "#112715" }}
                  >
                    Active
                  </span>
                )}
                {cancelAtPeriodEnd && (
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: "#fff7ed", color: "#c2410c" }}
                  >
                    Cancels {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "soon"}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-400 mt-0.5">
                {cancelAtPeriodEnd
                  ? `Your Pro access continues until ${currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "the end of your billing period"}, then reverts to Free.`
                  : plan === "pro"
                  ? "30 interviews per month, unlimited peer sessions, and the ability to create meetings."
                  : "3 free interviews to get started · 3 peer session joins · Upgrade for 30 interviews/month."}
              </p>
            </div>
            {plan === "pro" ? (
              <button
                onClick={handleManageSubscription}
                disabled={upgradingPlan}
                className="self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
                style={{ background: "#112715", color: "#fff" }}
              >
                {upgradingPlan ? "Loading…" : "Manage Subscription"}
              </button>
            ) : (
              <button
                onClick={handleUpgrade}
                disabled={upgradingPlan}
                className="self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
                style={{ background: "#2dec29", color: "#112715" }}
              >
                {upgradingPlan ? "Loading…" : "Upgrade to Pro — $19/mo"}
              </button>
            )}
          </div>
        </section>

        {/* Left: Resume */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <FileText className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-secondary text-sm">Resume</h2>
          </div>
          <div className="p-6">
            {resumeLoaded && (
              <ResumeUpload
                initialFileName={resumeName}
                onUploadSuccess={(text) => {
                  toast.success(text ? "Resume uploaded — AI will personalise your sessions!" : "Resume saved (text extraction limited).");
                }}
                onDeleteSuccess={() => {
                  setResumeName(null);
                  toast.success("Resume removed.");
                }}
              />
            )}
          </div>
        </section>

        {/* Right: Interview Preferences */}
        <section className="glass-card rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <Briefcase className="w-4 h-4 text-neutral-400" />
              <h2 className="font-semibold text-secondary text-sm">
                Interview Preferences
              </h2>
            </div>
            {!editingPrefs && (
              <button
                onClick={() => setEditingPrefs(true)}
                className="p-2 rounded-xl hover:bg-neutral-100 transition text-neutral-400 hover:text-neutral-600"
                title="Edit preferences"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>

          {editingPrefs ? (
            <div className="p-6 space-y-5">
              <div>
                <label className="block text-xs font-medium text-neutral-500 mb-1">
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
                <label className="block text-xs font-medium text-neutral-500 mb-1">
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
                <label className="block text-xs font-medium text-neutral-500 mb-1">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {COMPANY_SUGGESTIONS.filter(
                    (c) => !targetCompanies.includes(c)
                  ).map((company) => (
                    <button
                      key={company}
                      onClick={() => addCompany(company)}
                      className="px-2.5 py-1 rounded-full text-xs border border-neutral-200 text-neutral-500 hover:border-primary hover:text-secondary transition"
                    >
                      + {company}
                    </button>
                  ))}
                </div>
              </div>
              {/* ── Onboarding preferences ── */}
              <div className="pt-2 border-t border-neutral-100">
                <p className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-4">
                  Practice Preferences
                </p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Interview Style
                    </label>
                    <select
                      value={interviewStyle}
                      onChange={(e) => setInterviewStyle(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
                    >
                      <option value="">Select style</option>
                      {INTERVIEW_STYLE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Session Duration
                    </label>
                    <select
                      value={interviewDuration}
                      onChange={(e) => setInterviewDuration(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
                    >
                      <option value="">Select duration</option>
                      {DURATION_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Practice With
                    </label>
                    <select
                      value={practicePartner}
                      onChange={(e) => setPracticePartner(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
                    >
                      <option value="">Select preference</option>
                      {PRACTICE_PARTNER_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Language
                    </label>
                    <select
                      value={interviewLanguage}
                      onChange={(e) => setInterviewLanguage(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
                    >
                      <option value="">Select language</option>
                      {LANGUAGE_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Platform
                    </label>
                    <select
                      value={interviewPlatform}
                      onChange={(e) => setInterviewPlatform(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
                    >
                      <option value="">Select platform</option>
                      {PLATFORM_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-1">
                      Feedback Style
                    </label>
                    <select
                      value={feedbackPreference}
                      onChange={(e) => setFeedbackPreference(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-neutral-200 text-sm text-secondary outline-none focus:border-primary transition bg-white"
                    >
                      <option value="">Select feedback style</option>
                      {FEEDBACK_OPTIONS.map(({ value, label }) => (
                        <option key={value} value={value}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-neutral-500 mb-2">
                      Interview Tips
                    </label>
                    <div className="flex gap-2">
                      {[
                        { val: true, label: "Yes, please" },
                        { val: false, label: "No thanks" },
                      ].map(({ val, label }) => (
                        <button
                          key={String(val)}
                          type="button"
                          onClick={() => setWantsTips(val)}
                          className="flex-1 py-2 rounded-xl border-2 text-sm font-semibold transition-all"
                          style={{
                            borderColor: wantsTips === val ? "#2dec29" : "#e5e7eb",
                            background: wantsTips === val ? "rgba(45,236,41,0.1)" : "white",
                            color: wantsTips === val ? "#112715" : "#6b7280",
                          }}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-2xl text-sm font-bold transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
                  style={{ background: "#2dec29", color: "#112715" }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => setEditingPrefs(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-neutral-500 hover:bg-neutral-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Experience</span>
                <span className="text-sm font-medium text-secondary">
                  {experienceLabel(experienceLevel)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-neutral-400">Timeline</span>
                <span className="text-sm font-medium text-secondary">
                  {timelineLabel(timeline)}
                </span>
              </div>
              {interviewStyle && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Style</span>
                  <span className="text-sm font-medium text-secondary">
                    {optionLabel(INTERVIEW_STYLE_OPTIONS, interviewStyle)}
                  </span>
                </div>
              )}
              {interviewDuration && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Duration</span>
                  <span className="text-sm font-medium text-secondary">
                    {optionLabel(DURATION_OPTIONS, interviewDuration)}
                  </span>
                </div>
              )}
              {practicePartner && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Practice With</span>
                  <span className="text-sm font-medium text-secondary">
                    {optionLabel(PRACTICE_PARTNER_OPTIONS, practicePartner)}
                  </span>
                </div>
              )}
              {interviewLanguage && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Language</span>
                  <span className="text-sm font-medium text-secondary">
                    {optionLabel(LANGUAGE_OPTIONS, interviewLanguage)}
                  </span>
                </div>
              )}
              {interviewPlatform && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Platform</span>
                  <span className="text-sm font-medium text-secondary">
                    {optionLabel(PLATFORM_OPTIONS, interviewPlatform)}
                  </span>
                </div>
              )}
              {feedbackPreference && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Feedback</span>
                  <span className="text-sm font-medium text-secondary">
                    {optionLabel(FEEDBACK_OPTIONS, feedbackPreference)}
                  </span>
                </div>
              )}
              {wantsTips !== null && (
                <div className="flex items-center justify-between">
                  <span className="text-xs text-neutral-400">Tips</span>
                  <span className="text-sm font-medium text-secondary">
                    {wantsTips ? "Yes" : "No"}
                  </span>
                </div>
              )}
              {targetCompanies.length > 0 && (
                <div>
                  <span className="text-xs text-neutral-400">
                    Target Companies
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {targetCompanies.map((c) => (
                      <span
                        key={c}
                        className="px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ background: "#f4fdf3", color: "#112715" }}
                      >
                        {c}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Account — full width */}
        <section className="glass-card rounded-2xl overflow-hidden lg:col-span-2">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <LogOut className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-secondary text-sm">Account</h2>
          </div>
          <div className="p-6 flex flex-wrap items-center justify-between gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-2xl font-bold text-sm transition-all duration-100 shadow-[4px_4px_0px_0px_#1A1A1A] hover:brightness-95 active:translate-y-1 active:shadow-[2px_2px_0px_0px_#1A1A1A] disabled:opacity-60 disabled:shadow-none disabled:translate-y-0"
              style={{ background: "#2dec29", color: "#112715" }}
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
