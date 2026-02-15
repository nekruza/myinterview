import { NextRequest, NextResponse } from "next/server";

export async function POST(_req: NextRequest) {
  const response = NextResponse.redirect(new URL("/admin/login", process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"));

  response.cookies.set("admin_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/admin",
    maxAge: 0,
  });

  return response;
}
