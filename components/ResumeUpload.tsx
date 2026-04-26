"use client";

import { useRef, useState } from "react";
import { CheckCircle, AlertTriangle, Upload, Trash2, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { track } from "@/lib/mixpanel";

type UploadState = "idle" | "uploading" | "success" | "warning" | "error";

interface ResumeUploadProps {
  /** Filename to display when a resume is already on file */
  initialFileName?: string | null;
  /** Called after a successful upload with the extracted text (may be null for image PDFs) */
  onUploadSuccess?: (resumeText: string | null) => void;
  /** Called after the resume is deleted */
  onDeleteSuccess?: () => void;
  className?: string;
}

export function ResumeUpload({
  initialFileName,
  onUploadSuccess,
  onDeleteSuccess,
  className,
}: ResumeUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [state, setState] = useState<UploadState>(initialFileName ? "success" : "idle");
  const [fileName, setFileName] = useState<string | null>(initialFileName ?? null);
  const [warning, setWarning] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const uploaded = state === "success" || state === "warning";

  async function upload(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setState("error");
      setWarning("File too large. Please upload a PDF or DOCX under 5 MB.");
      return;
    }
    const allowed = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowed.includes(file.type)) {
      setState("error");
      setWarning("Please upload a PDF or DOCX file.");
      return;
    }

    setState("uploading");
    setFileName(file.name);
    setWarning(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/resume/extract", { method: "POST", body: formData });
      const json = await res.json();

      if (!res.ok) {
        setState("error");
        const friendly =
          res.status === 401 || json.error === "Unauthorized"
            ? "Sign up to be able to upload your resume."
            : json.error ?? "Upload failed. Please try again.";
        setWarning(friendly);
        track("Resume Upload Failed", { reason: json.error ?? "api_error", file_type: file.type });
        return;
      }

      if (json.resume_text === null) {
        const reason = json.extract_error ? ` (${json.extract_error})` : " (it may be image-based)";
        setState("warning");
        setWarning(
          `Text extraction failed${reason}. Your resume was saved but personalisation may be limited.`
        );
        track("Resume Uploaded", { text_extracted: false, file_type: file.type, file_size_kb: Math.round(file.size / 1024) });
      } else {
        setState("success");
        setWarning(null);
        track("Resume Uploaded", { text_extracted: true, file_type: file.type, file_size_kb: Math.round(file.size / 1024) });
      }

      onUploadSuccess?.(json.resume_text);
    } catch {
      setState("error");
      setWarning("Upload failed. Please try again.");
      track("Resume Upload Failed", { reason: "network_error", file_type: file.type });
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) upload(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: files } = await supabase.storage.from("resumes").list(user.id);
      if (files?.length) {
        await supabase.storage
          .from("resumes")
          .remove(files.map((f) => `${user.id}/${f.name}`));
      }
      await supabase
        .from("profiles")
        .update({ resume_url: null, resume_text: null })
        .eq("id", user.id);

      setState("idle");
      setFileName(null);
      setWarning(null);
      track("Resume Deleted");
      onDeleteSuccess?.();
    } catch {
      // silently fail — user can retry
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <input
        ref={inputRef}
        id="resume-file-input"
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="sr-only"
        onChange={handleChange}
        disabled={state === "uploading" || deleting}
      />

      {uploaded ? (
        /* ── Uploaded state ── */
        <div
          className={cn(
            "rounded-xl border-2 p-4 flex items-start gap-3",
            state === "success" ? "border-green-300 bg-green-50" : "border-yellow-300 bg-yellow-50"
          )}
        >
          {state === "success" ? (
            <CheckCircle className="text-green-600 flex-shrink-0 mt-0.5" size={18} />
          ) : (
            <AlertTriangle className="text-yellow-600 flex-shrink-0 mt-0.5" size={18} />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-secondary truncate">{fileName}</p>
            {state === "success" && (
              <p className="text-xs text-green-700 mt-0.5">Text extracted — AI will personalise your sessions ✓</p>
            )}
            {warning && <p className="text-xs text-yellow-700 mt-0.5">{warning}</p>}
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              onClick={() => inputRef.current?.click()}
              disabled={deleting}
              className="text-xs text-neutral-400 hover:text-neutral-600 transition-colors px-2 py-1 rounded hover:bg-white/60"
            >
              Replace
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="p-1.5 rounded text-neutral-300 hover:text-red-500 hover:bg-red-50 transition"
              title="Remove resume"
            >
              {deleting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* ── Upload area ── */
        <label
          htmlFor="resume-file-input"
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={cn(
            "block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors",
            dragOver
              ? "border-secondary bg-neutral-100"
              : "border-neutral-300 bg-neutral-50 hover:border-neutral-400",
            state === "uploading" && "pointer-events-none opacity-60"
          )}
        >
          {state === "uploading" ? (
            <>
              <Loader2 className="mx-auto mb-2 text-neutral-400 animate-spin" size={28} />
              <p className="text-sm font-semibold text-secondary">Uploading &amp; extracting…</p>
              <p className="text-xs text-neutral-400 mt-1">This takes a few seconds</p>
            </>
          ) : (
            <>
              <div className="text-3xl mb-2">📄</div>
              <p className="text-sm font-semibold text-secondary">Drop your resume here</p>
              <p className="text-xs text-neutral-400 mt-1">PDF or DOCX · Max 5 MB</p>
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-secondary text-white rounded-lg text-xs font-semibold">
                <Upload size={12} /> Browse files
              </div>
            </>
          )}
        </label>
      )}

      {state === "error" && warning && (
        <p className="text-xs text-red-500">{warning}</p>
      )}
    </div>
  );
}
