import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const name = formData.get("name") as string | null;
  const email = formData.get("email") as string | null;
  const role = formData.get("role") as string | null;
  const linkedinUrl = formData.get("linkedinUrl") as string | null;
  const coverLetter = formData.get("coverLetter") as string | null;
  const resumeFile = formData.get("resume") as File | null;

  if (!name || !email || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  // Upload resume to Supabase Storage if provided
  let resumeUrl: string | null = null;
  if (resumeFile && resumeFile.size > 0) {
    const ext = resumeFile.name.split(".").pop();
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const arrayBuffer = await resumeFile.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("resumes")
      .upload(filename, buffer, {
        contentType: resumeFile.type,
        upsert: false,
      });

    if (uploadError) {
      console.error("Resume upload error:", uploadError);
      return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
    }

    const { data: urlData } = supabase.storage.from("resumes").getPublicUrl(filename);
    resumeUrl = urlData.publicUrl;
  }

  const { error } = await supabase.from("job_applications").insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: role.trim(),
    linkedin_url: linkedinUrl?.trim() || null,
    cover_letter: coverLetter?.trim() || null,
    resume_url: resumeUrl,
  });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
