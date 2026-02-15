import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function verifyAdminSession(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? "").toString("base64");
  return !!session && session === expected;
}

export async function GET(req: NextRequest) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("job_applications")
    .select("id, name, email, role, linkedin_url, cover_letter, created_at, status")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data });
}
