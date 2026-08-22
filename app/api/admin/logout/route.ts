import { NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST() {
  // The caller (app/admin/page.tsx) redirects on the client, so return JSON
  // rather than a redirect the fetch would follow opaquely.
  const response = NextResponse.json({ ok: true });

  // Path MUST match the login cookie's path or the browser keeps the original.
  // That mismatch was the bug that made logout a no-op.
  response.cookies.set(ADMIN_COOKIE, "", {
    ...ADMIN_COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}
