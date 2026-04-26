import { cookies } from "next/headers";
import { randomUUID } from "crypto";

export const ANON_COOKIE = "mi_anon_id";
export const MAX_ANON_SESSIONS = 3;

const COOKIE_OPTIONS = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 60 * 60 * 24 * 365,
};

export async function getAnonId(): Promise<string | null> {
  const store = await cookies();
  return store.get(ANON_COOKIE)?.value ?? null;
}

export async function getOrCreateAnonId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(ANON_COOKIE)?.value;
  if (existing) return existing;
  const id = randomUUID();
  store.set(ANON_COOKIE, id, COOKIE_OPTIONS);
  return id;
}

export async function clearAnonId(): Promise<void> {
  const store = await cookies();
  store.delete(ANON_COOKIE);
}
