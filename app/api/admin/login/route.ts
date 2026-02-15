import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json() as { password?: string };
  const { password } = body;

  const adminPassword = process.env.ADMIN_PASSWORD ?? "";

  if (!password || password !== adminPassword) {
    return NextResponse.json({ ok: false, error: "Invalid password" }, { status: 401 });
  }

  const sessionValue = Buffer.from(adminPassword).toString("base64");

  const response = NextResponse.json({ ok: true });
  response.cookies.set("admin_session", sessionValue, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });

  return response;
}
