import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

type ApplicationStatus = "new" | "reviewed" | "rejected";

function verifyAdminSession(req: NextRequest): boolean {
  const session = req.cookies.get("admin_session")?.value;
  const expected = Buffer.from(process.env.ADMIN_PASSWORD ?? "").toString("base64");
  return !!session && session === expected;
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { error } = await supabase
    .from("job_applications")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!verifyAdminSession(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json() as { status?: ApplicationStatus };
  const { status } = body;

  const validStatuses: ApplicationStatus[] = ["new", "reviewed", "rejected"];
  if (!status || !validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
  }

  const { error } = await supabase
    .from("job_applications")
    .update({ status })
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
