import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

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
    .from("waitlist")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
