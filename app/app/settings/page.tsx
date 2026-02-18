"use client";

import { FC, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import {
  Briefcase,
  Bell,
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
  const supabase = createClient();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

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
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Edit modes
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingPrefs, setEditingPrefs] = useState(false);

  // Load user + profile on mount
  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setEmail(user.email ?? "");
      setUserId(user.id);
      setDisplayName(user.user_metadata?.full_name ?? "");

      // Load preferences from metadata
      const meta = user.user_metadata ?? {};
      if (meta.experience_level) setExperienceLevel(meta.experience_level);
      if (meta.interview_timeline) setTimeline(meta.interview_timeline);
      if (meta.target_companies) setTargetCompanies(meta.target_companies);
      if (meta.email_notifications !== undefined)
        setEmailNotifs(meta.email_notifications);
      if (meta.match_alerts !== undefined) setMatchAlerts(meta.match_alerts);

      const { data: profile } = await supabase
        .from("profiles")
        .select("avatar_url, resume_url")
        .eq("id", user.id)
        .single();

      if (profile) {
        setAvatarUrl(profile.avatar_url);
        setResumeUrl(profile.resume_url);
        if (profile.resume_url) {
          const parts = profile.resume_url.split("/");
          setResumeName(decodeURIComponent(parts[parts.length - 1]));
        }
      }
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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
      toast.success("Photo removed");
    } catch {
      toast.error("Failed to remove photo");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    if (file.size > 10 * 1024 * 1024) {
      toast.error("Resume must be under 10 MB");
      return;
    }

    setUploadingResume(true);
    try {
      const path = `${userId}/${file.name}`;

      const { data: existing } = await supabase.storage
        .from("resumes")
        .list(userId);

      if (existing?.length) {
        await supabase.storage
          .from("resumes")
          .remove(existing.map((f) => `${userId}/${f.name}`));
      }

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(path, file, { upsert: true });

      if (uploadError) throw uploadError;

      const storedUrl = `resumes/${path}`;

      await supabase
        .from("profiles")
        .update({ resume_url: storedUrl })
        .eq("id", userId);

      setResumeUrl(storedUrl);
      setResumeName(file.name);
      toast.success("Resume uploaded");
    } catch {
      toast.error("Failed to upload resume");
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  async function handleRemoveResume() {
    if (!userId) return;
    setUploadingResume(true);
    try {
      const { data: files } = await supabase.storage
        .from("resumes")
        .list(userId);

      if (files?.length) {
        await supabase.storage
          .from("resumes")
          .remove(files.map((f) => `${userId}/${f.name}`));
      }

      await supabase
        .from("profiles")
        .update({ resume_url: null })
        .eq("id", userId);

      setResumeUrl(null);
      setResumeName(null);
      toast.success("Resume removed");
    } catch {
      toast.error("Failed to remove resume");
    } finally {
      setUploadingResume(false);
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
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleResumeUpload}
      />

      {/* ── Profile Card (full width, LinkedIn-style) ── */}
      <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
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
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
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
        {/* Left: Resume */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-neutral-400" />
              <h2 className="font-semibold text-secondary text-sm">Resume</h2>
            </div>
            {resumeUrl && (
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-neutral-100 transition"
                style={{ color: "#2dec29" }}
              >
                <Upload className="w-3 h-3 inline mr-1" />
                Replace
              </button>
            )}
          </div>
          <div className="p-6">
            {resumeUrl ? (
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: "#f4fdf3" }}
                >
                  <FileText
                    className="w-6 h-6"
                    style={{ color: "#2dec29" }}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-secondary truncate">
                    {resumeName}
                  </p>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    PDF &middot; Ready to share
                  </p>
                </div>
                <button
                  onClick={handleRemoveResume}
                  disabled={uploadingResume}
                  className="p-2 rounded-lg text-neutral-300 hover:text-red-500 hover:bg-red-50 transition"
                  title="Remove resume"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                {uploadingResume && (
                  <Loader2 className="w-4 h-4 text-neutral-400 animate-spin shrink-0" />
                )}
              </div>
            ) : (
              <button
                onClick={() => resumeInputRef.current?.click()}
                disabled={uploadingResume}
                className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-8 flex flex-col items-center gap-2 hover:border-primary/50 hover:bg-neutral-50/50 transition group"
              >
                {uploadingResume ? (
                  <Loader2 className="w-7 h-7 text-neutral-300 animate-spin" />
                ) : (
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-1 group-hover:scale-105 transition-transform"
                    style={{ background: "#f4fdf3" }}
                  >
                    <Upload
                      className="w-5 h-5"
                      style={{ color: "#2dec29" }}
                    />
                  </div>
                )}
                <p className="text-sm font-medium text-neutral-600">
                  {uploadingResume ? "Uploading..." : "Upload your resume"}
                </p>
                <p className="text-xs text-neutral-400">
                  PDF, DOC, or DOCX &middot; Max 10 MB
                </p>
              </button>
            )}
          </div>
        </section>

        {/* Right: Interview Preferences */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
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
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-opacity hover:opacity-90 disabled:opacity-60"
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

        {/* Left: Subscription */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <CreditCard className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-secondary text-sm">
              Subscription
            </h2>
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

        {/* Right: Account Actions */}
        <section className="bg-white rounded-2xl border border-neutral-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-neutral-100">
            <LogOut className="w-4 h-4 text-neutral-400" />
            <h2 className="font-semibold text-secondary text-sm">Account</h2>
          </div>
          <div className="p-6 flex items-center justify-between">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-60"
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
