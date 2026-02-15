import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { name, email, role, linkedinUrl, coverLetter } = await req.json();

  if (!name || !email || !role) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!email.includes("@")) {
    return NextResponse.json({ error: "Invalid email" }, { status: 400 });
  }

  const { error } = await supabase.from("job_applications").insert({
    name: name.trim(),
    email: email.toLowerCase().trim(),
    role: role.trim(),
    linkedin_url: linkedinUrl?.trim() || null,
    cover_letter: coverLetter?.trim() || null,
  });

  if (error) {
    console.error("Supabase error:", error);
    return NextResponse.json({ error: "Failed to save application" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
