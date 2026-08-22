import { NextRequest, NextResponse } from "next/server";
import {
  ADMIN_COOKIE,
  ADMIN_COOKIE_OPTIONS,
  ADMIN_SESSION_TTL_SECONDS,
  createAdminSessionToken,
  isAdminAuthConfigured,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { clientIp, rateLimit, resetRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const MAX_ATTEMPTS = 10;
const WINDOW_SECONDS = 15 * 60;

export async function POST(req: NextRequest) {
  // Fail closed on misconfiguration rather than letting a blank password through.
  if (!isAdminAuthConfigured()) {
    console.error(
      "[admin/login] ADMIN_PASSWORD and/or ADMIN_SESSION_SECRET missing — refusing all logins"
    );
    return NextResponse.json(
      { ok: false, error: "Admin login is not configured" },
      { status: 503 }
    );
  }

  const key = `admin-login:${clientIp(req)}`;
  const limit = rateLimit(key, MAX_ATTEMPTS, WINDOW_SECONDS);

  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many attempts. Try again later." },
      { status: 429, headers: { "Retry-After": String(limit.retryAfterSeconds) } }
    );
  }

  let password: string | undefined;
  try {
    ({ password } = (await req.json()) as { password?: string });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body" },
      { status: 400 }
    );
  }

  if (!password || !(await verifyAdminPassword(password))) {
    return NextResponse.json(
      { ok: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  // Correct password — clear the throttle so a typo streak doesn't linger.
  resetRateLimit(key);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ADMIN_COOKIE, await createAdminSessionToken(), {
    ...ADMIN_COOKIE_OPTIONS,
    maxAge: ADMIN_SESSION_TTL_SECONDS,
  });

  return response;
}
