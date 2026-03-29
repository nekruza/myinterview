import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

async function extractText(buffer: Buffer, mimeType: string): Promise<{ text: string | null; error?: string }> {
  try {
    if (mimeType === "application/pdf") {
      // Dynamic import avoids pdf-parse's test-file side effects at module load time
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const data = await parser.getText();
      return { text: data.text.trim() || null };
    }
    if (mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return { text: result.value.trim() || null };
    }
    return { text: null };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[extractText] Failed to parse file:", msg);
    return { text: null, error: msg };
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: "Invalid file type. Upload a PDF or DOCX." }, { status: 400 });
    }

    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "File too large. Max 5MB." }, { status: 400 });
    }

    const ext = file.type === "application/pdf" ? "pdf" : "docx";
    const storagePath = `${user.id}/resume.${ext}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload to Supabase Storage (upsert = overwrite previous)
    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(storagePath, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Storage upload failed" }, { status: 500 });
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("resumes").getPublicUrl(storagePath);

    // Extract text — null is acceptable (image-only PDF etc.)
    const { text: resumeText, error: extractError } = await extractText(buffer, file.type);

    // Save to profile
    const { error: updateError } = await supabase
      .from("profiles")
      .update({ resume_url: publicUrl, resume_text: resumeText })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json({ error: "Failed to save resume data" }, { status: 500 });
    }

    return NextResponse.json({ success: true, resume_text: resumeText, extract_error: extractError ?? null });
  } catch (err) {
    console.error("[resume/extract]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
