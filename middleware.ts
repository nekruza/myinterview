import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { verifyAdminRequest } from "@/lib/admin-auth";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes: protected by a signed, expiring session cookie
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    if (!(await verifyAdminRequest(req))) {
      return NextResponse.redirect(new URL("/admin/login", req.url));
    }

    return NextResponse.next();
  }

  // All other matched routes: refresh Supabase auth session
  return updateSession(req);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/app/:path*",
    "/login",
    "/signup",
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)",
  ],
};
