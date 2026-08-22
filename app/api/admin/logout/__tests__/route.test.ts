import { POST } from "../route";
import { ADMIN_COOKIE, ADMIN_COOKIE_OPTIONS } from "@/lib/admin-auth";

describe("POST /api/admin/logout", () => {
  it("returns JSON rather than a redirect the client fetch would follow", async () => {
    const res = await POST();

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it("clears the admin session cookie", async () => {
    const res = await POST();

    expect(res.cookies.get(ADMIN_COOKIE)?.value).toBe("");
  });

  it("expires the cookie immediately", async () => {
    const res = await POST();

    expect(res.cookies.get(ADMIN_COOKIE)?.maxAge).toBe(0);
  });

  it("matches the login cookie's path, or the browser keeps the original", async () => {
    const res = await POST();

    expect(res.cookies.get(ADMIN_COOKIE)?.path).toBe(ADMIN_COOKIE_OPTIONS.path);
  });

  it("keeps the cookie httpOnly while clearing it", async () => {
    const res = await POST();

    expect(res.cookies.get(ADMIN_COOKIE)?.httpOnly).toBe(
      ADMIN_COOKIE_OPTIONS.httpOnly
    );
  });

  it("is idempotent - logging out twice is harmless", async () => {
    const first = await POST();
    const second = await POST();

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect(second.cookies.get(ADMIN_COOKIE)?.maxAge).toBe(0);
  });
});
