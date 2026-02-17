import { NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin routes: protected by password cookie
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = req.cookies.get("admin_session")?.value;
    const expected = btoa(process.env.ADMIN_PASSWORD ?? "");

    if (!session || session !== expected) {
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
