"use client";

import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  CheckCircle,
  Sparkles,
  ArrowLeft,
  Brain,
  Users,
  FileText,
  Zap,
  Upload,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import Link from "next/link";
import { VoiceCallView } from "@/components/practice/VoiceCallView";
import { LEVELS } from "@/lib/practice-data";
import type { Phase } from "@/lib/practice-data";
import { createClient } from "@/lib/supabase/client";

type InterviewType = "technical" | "behavioural";
type JobContextMode = "paste" | "general";

// ─── Main ────────────────────────────────────────────────────────────────────

export default function PracticePage() {
  const [phase, setPhase] = useState<Phase>("setup");
  const [interviewType, setInterviewType] = useState<InterviewType>("technical");
  const [jobContextMode, setJobContextMode] = useState<JobContextMode>("general");
  const [jobDescription, setJobDescription] = useState("");
  const [level, setLevel] = useState("mid");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [endConfidence, setEndConfidence] = useState<number | null>(null);

  // Resume
  const [hasResume, setHasResume] = useState<boolean | null>(null);
  const [resumeText, setResumeText] = useState("");
  const [uploadingResume, setUploadingResume] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const resumeInputRef = useRef<HTMLInputElement>(null);

  const supabase = createClient();

  useEffect(() => {
    async function checkResume() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);
      const { data: profile } = await supabase
        .from("profiles")
        .select("resume_url")
        .eq("id", user.id)
        .single();
      setHasResume(!!profile?.resume_url);
    }
    checkResume();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

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

      await supabase
        .from("profiles")
        .update({ resume_url: `resumes/${path}` })
        .eq("id", userId);

      setHasResume(true);
      toast.success("Resume saved — your interview will be tailored to your experience!");
    } catch {
      toast.error("Failed to upload resume");
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) resumeInputRef.current.value = "";
    }
  }

  const getJobContext = () => {
    if (jobContextMode === "paste" && jobDescription.trim()) return { mode: "paste" as const, value: jobDescription.trim() };
    return { mode: "general" as const, value: "" };
  };

  const startSession = async () => {
    if (!confidence) {
      toast.error("Please rate your current confidence level.");
      return;
    }

    const jobContext = getJobContext();

    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: `${interviewType} interview practice`,
          category: interviewType,
          interviewType,
          jobContext,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setSessionId(data.sessionId);
      setPhase("chat");
    } catch {
      toast.error("Could not start session. Please try again.");
    }
  };

  const completeSession = async (endConf: number) => {
    if (!sessionId) return;

    setEndConfidence(endConf);

    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        score: endConf,
        feedback: null,
        competencyScores: [
          { competency: interviewType, score: endConf * 10 },
        ],
      }),
    });

    setPhase("complete");
    toast.success("Session saved!");
  };

  // Derived tip states
  const hasJobContext = jobContextMode === "paste" && jobDescription.trim().length > 0;
  const hasResumeText = resumeText.trim().length > 0;

  // ── Render: Setup ──
  if (phase === "setup") {
    return (
      <div className="max-w-5xl mx-auto">
        {/* Hidden resume input */}
        <input
          ref={resumeInputRef}
          type="file"
          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="hidden"
          onChange={handleResumeUpload}
        />

        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary">AI Practice</h1>
            <p className="text-neutral-500 text-sm mt-0.5">
              Practice interview questions with your AI coach
            </p>
          </div>
        </div>

        <div className="flex gap-6 items-start">
          {/* ── Left: Form ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Interview Type */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                1. Interview Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setInterviewType("technical")}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 transition text-left"
                  style={{
                    borderColor: interviewType === "technical" ? "#2dec29" : "transparent",
                    background: interviewType === "technical" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: interviewType === "technical" ? "#2dec29" : "#e5e7eb",
                    }}
                  >
                    <Brain
                      className="w-5 h-5"
                      style={{
                        color: interviewType === "technical" ? "#112715" : "#6b7280",
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-secondary block">
                      Technical
                    </span>
                    <span className="text-xs text-neutral-400">
                      System design, coding, architecture
                    </span>
                  </div>
                </button>
                <button
                  onClick={() => setInterviewType("behavioural")}
                  className="flex items-center gap-3 p-4 rounded-xl border-2 transition text-left"
                  style={{
                    borderColor: interviewType === "behavioural" ? "#2dec29" : "transparent",
                    background: interviewType === "behavioural" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                    style={{
                      background: interviewType === "behavioural" ? "#2dec29" : "#e5e7eb",
                    }}
                  >
                    <Users
                      className="w-5 h-5"
                      style={{
                        color: interviewType === "behavioural" ? "#112715" : "#6b7280",
                      }}
                    />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-secondary block">
                      Behavioural
                    </span>
                    <span className="text-xs text-neutral-400">
                      Leadership, teamwork, conflict
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Job Context */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
              <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                2. Job Context
              </label>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <button
                  onClick={() => setJobContextMode("general")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition"
                  style={{
                    borderColor: jobContextMode === "general" ? "#2dec29" : "transparent",
                    background: jobContextMode === "general" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <Zap
                    className="w-4 h-4"
                    style={{
                      color: jobContextMode === "general" ? "#112715" : "#6b7280",
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: jobContextMode === "general" ? "#112715" : "#6b7280",
                    }}
                  >
                    General
                  </span>
                </button>
                <button
                  onClick={() => setJobContextMode("paste")}
                  className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition"
                  style={{
                    borderColor: jobContextMode === "paste" ? "#2dec29" : "transparent",
                    background: jobContextMode === "paste" ? "#f4fdf3" : "#f9fafb",
                  }}
                >
                  <FileText
                    className="w-4 h-4"
                    style={{
                      color: jobContextMode === "paste" ? "#112715" : "#6b7280",
                    }}
                  />
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: jobContextMode === "paste" ? "#112715" : "#6b7280",
                    }}
                  >
                    Paste Job Description
                  </span>
                </button>
              </div>

              {jobContextMode === "paste" && (
                <textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                />
              )}

              {jobContextMode === "general" && (
                <p className="text-xs text-neutral-400 px-1">
                  Practice with general {interviewType} interview questions — no specific job context needed.
                </p>
              )}
            </div>

            {/* Resume — always shown once loaded */}
            {hasResume !== null && (
              <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide">
                    3. Your Resume
                  </label>
                  <span className="text-xs text-neutral-400 font-medium px-2 py-0.5 rounded-full bg-neutral-100">
                    Optional
                  </span>
                </div>

                {/* File upload (only when no resume on file) */}
                {hasResume === false && (
                  <>
                    <p className="text-xs text-neutral-400 mb-3">
                      Upload your resume so the AI can tailor questions to your background.
                    </p>
                    <button
                      onClick={() => resumeInputRef.current?.click()}
                      disabled={uploadingResume}
                      className="w-full border-2 border-dashed border-neutral-200 rounded-xl py-4 flex items-center justify-center gap-2 hover:border-[#2dec29]/60 hover:bg-neutral-50/50 transition group disabled:opacity-60 mb-4"
                    >
                      {uploadingResume ? (
                        <Loader2 className="w-4 h-4 text-neutral-300 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" style={{ color: "#2dec29" }} />
                      )}
                      <span className="text-sm font-medium text-neutral-600">
                        {uploadingResume ? "Uploading..." : "Upload Resume"}
                      </span>
                      <span className="text-xs text-neutral-400">· PDF, DOC or DOCX · Max 10 MB</span>
                    </button>
                  </>
                )}

                {/* Resume on file indicator */}
                {hasResume === true && (
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: "#2dec29" }} />
                    <span className="text-xs font-medium text-neutral-600">Resume on file</span>
                  </div>
                )}

                {/* Paste resume text */}
                <textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here so the AI can ask questions relevant to your specific experience, projects, and background..."
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl border border-neutral-200 text-sm text-secondary placeholder:text-neutral-300 focus:outline-none focus:border-[#2dec29] focus:ring-1 focus:ring-[#2dec29] transition resize-none"
                />
                <p className="text-xs text-neutral-400 mt-2">
                  The AI will reference your actual experience to ask tailored questions.
                </p>
              </div>
            )}

            {/* Level + Confidence */}
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-6 space-y-5">
              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                  4. Your Experience Level
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {LEVELS.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setLevel(value)}
                      className="p-2.5 rounded-xl border text-xs font-medium transition"
                      style={{
                        borderColor: level === value ? "#2dec29" : "transparent",
                        background: level === value ? "#f4fdf3" : "#f9fafb",
                        color: level === value ? "#112715" : "#6b7280",
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-2">
                  5. Confidence Before (1–10)
                </label>
                <p className="text-xs text-neutral-400 mb-3">
                  How confident do you feel about this type of interview right now?
                </p>
                <div className="flex gap-2 flex-wrap">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setConfidence(n)}
                      className="w-9 h-9 rounded-xl text-sm font-semibold transition"
                      style={{
                        background: confidence === n ? "#2dec29" : "#f3f4f6",
                        color: confidence === n ? "#112715" : "#6b7280",
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <button
              onClick={startSession}
              disabled={!confidence}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-semibold transition disabled:opacity-50"
              style={{ background: "#112715", color: "#fff" }}
            >
              <Sparkles className="w-4 h-4" style={{ color: "#2dec29" }} />
              Start Voice Practice
            </button>
          </div>

          {/* ── Right: Tips panel ── */}
          <div className="w-64 shrink-0 hidden lg:block space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-100 shadow-sm p-5">
              <p className="text-xs font-semibold text-neutral-600 uppercase tracking-wide mb-3">
                Get a tailored interview
              </p>
              <div className="space-y-3">
                {/* Job description tip */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    {hasJobContext ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#2dec29" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary">
                      Add a job description
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      Paste or link the JD so the AI asks questions relevant to the role.
                    </p>
                  </div>
                </div>

                {/* Resume tip */}
                <div className="flex gap-3">
                  <div className="shrink-0 mt-0.5">
                    {hasResumeText ? (
                      <CheckCircle2 className="w-4 h-4" style={{ color: "#2dec29" }} />
                    ) : (
                      <div className="w-4 h-4 rounded-full border-2 border-neutral-300" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-secondary">
                      Add your resume text
                    </p>
                    <p className="text-xs text-neutral-400 mt-0.5 leading-relaxed">
                      The AI will tailor questions to your actual experience and background.
                    </p>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              {(() => {
                const done = [hasJobContext, hasResumeText].filter(Boolean).length;
                return done < 2 ? (
                  <div className="mt-4 pt-4 border-t border-neutral-100">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs text-neutral-400">Personalisation</span>
                      <span className="text-xs font-semibold text-secondary">{done}/2</span>
                    </div>
                    <div className="h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${(done / 2) * 100}%`, background: "#2dec29" }}
                      />
                    </div>
                  </div>
                ) : null;
              })()}
            </div>

            <div className="rounded-2xl p-5" style={{ background: "#f4fdf3" }}>
              <p className="text-xs font-semibold mb-2" style={{ color: "#112715" }}>
                Why it matters
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "#1a3d20" }}>
                Without context, you get generic questions. With your resume and the job description, the AI acts like a real interviewer who has read your application.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Render: Voice Call ──
  if (phase === "chat") {
    const jobContext = getJobContext();
    return (
      <VoiceCallView
        selectedCategory={{ id: interviewType, label: interviewType === "technical" ? "Technical Interview" : "Behavioural Interview", color: interviewType === "technical" ? "#06b6d4" : "#8b5cf6" }}
        selectedQuestion={`${interviewType} interview practice`}
        level={level}
        sessionId={sessionId}
        interviewType={interviewType}
        jobContext={jobContext}
        resumeText={resumeText || undefined}
        onComplete={(endConf) => completeSession(endConf)}
        onReset={() => {
          setPhase("setup");
          setSessionId(null);
        }}
      />
    );
  }

  // ── Render: Complete ──
  const delta =
    endConfidence !== null && confidence !== null
      ? endConfidence - confidence
      : 0;

  return (
    <div className="max-w-lg mx-auto text-center py-12 space-y-6">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto"
        style={{ background: "#f4fdf3" }}
      >
        <CheckCircle className="w-8 h-8" style={{ color: "#2dec29" }} />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-secondary">Session Complete!</h1>
        <p className="text-neutral-500 mt-2">
          You practiced a <strong>{interviewType === "technical" ? "Technical" : "Behavioural"}</strong> interview — great work keeping the momentum going.
        </p>
      </div>

      <div className="flex justify-center gap-6">
        <div className="text-center">
          <p className="text-3xl font-bold text-secondary">{confidence}</p>
          <p className="text-xs text-neutral-400 mt-0.5">Before</p>
        </div>
        <div className="text-center">
          <p
            className="text-3xl font-bold"
            style={{
              color: delta > 0 ? "#2dec29" : delta < 0 ? "#ef4444" : "#6b7280",
            }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </p>
          <p className="text-xs text-neutral-400 mt-0.5">Change</p>
        </div>
        <div className="text-center">
          <p className="text-3xl font-bold text-secondary">{endConfidence}</p>
          <p className="text-xs text-neutral-400 mt-0.5">After</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button
          onClick={() => {
            setPhase("setup");
            setSessionId(null);
            setConfidence(null);
            setEndConfidence(null);
          }}
          className="px-6 py-2.5 rounded-xl font-semibold text-sm transition hover:opacity-90"
          style={{ background: "#2dec29", color: "#112715" }}
        >
          Practice Again
        </button>
        <Link
          href="/app/progress"
          className="px-6 py-2.5 rounded-xl font-semibold text-sm border border-neutral-200 text-secondary hover:bg-neutral-50 transition"
        >
          View Progress
        </Link>
      </div>
    </div>
  );
}
