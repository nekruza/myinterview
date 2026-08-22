import type { NextRequest } from "next/server";
import { POST } from "../route";

jest.mock("@/lib/supabase", () => ({
  supabase: { from: jest.fn(), storage: { from: jest.fn() } },
}));

const { supabase } = jest.requireMock("@/lib/supabase");

interface Scenario {
  insertError?: { message: string } | null;
  uploadError?: { message: string } | null;
  publicUrl?: string;
}

function mockSupabase(scenario: Scenario = {}) {
  const {
    insertError = null,
    uploadError = null,
    publicUrl = "https://cdn.example.com/resumes/abc.pdf",
  } = scenario;

  const insert = jest.fn().mockResolvedValue({ error: insertError });
  const upload = jest.fn().mockResolvedValue({ error: uploadError });
  const getPublicUrl = jest.fn(() => ({ data: { publicUrl } }));

  supabase.from.mockReturnValue({ insert });
  supabase.storage.from.mockReturnValue({ upload, getPublicUrl });

  return { insert, upload, getPublicUrl };
}

function jsonRequest(body: unknown) {
  return new Request("http://localhost/api/apply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }) as unknown as NextRequest;
}

function formRequest(
  fields: Record<string, string>,
  resume?: File
) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) formData.append(key, value);
  if (resume) formData.append("resume", resume);

  return new Request("http://localhost/api/apply", {
    method: "POST",
    body: formData,
  }) as unknown as NextRequest;
}

const VALID = {
  name: "Jane Doe",
  email: "jane@example.com",
  role: "Frontend Engineer",
};

describe("JSON submissions", () => {
  it("accepts an application with the required fields", async () => {
    mockSupabase();

    const res = await POST(jsonRequest(VALID));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });

  it.each([
    ["the name is missing", { email: VALID.email, role: VALID.role }],
    ["the email is missing", { name: VALID.name, role: VALID.role }],
    ["the role is missing", { name: VALID.name, email: VALID.email }],
  ])("returns 400 when %s", async (_label, body) => {
    mockSupabase();

    const res = await POST(jsonRequest(body));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Missing required fields" });
  });

  it("returns 400 for an email with no @", async () => {
    mockSupabase();

    const res = await POST(jsonRequest({ ...VALID, email: "notanemail" }));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "Invalid email" });
  });

  it("normalises the name, email and role before storing", async () => {
    const { insert } = mockSupabase();

    await POST(
      jsonRequest({
        name: "  Jane Doe  ",
        email: "  JANE@EXAMPLE.COM  ",
        role: "  Frontend Engineer  ",
      })
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Jane Doe",
        email: "jane@example.com",
        role: "Frontend Engineer",
      })
    );
  });

  it("stores the optional fields when supplied", async () => {
    const { insert } = mockSupabase();

    await POST(
      jsonRequest({
        ...VALID,
        linkedinUrl: " https://linkedin.com/in/jane ",
        coverLetter: " I would love to join. ",
        appFeedback: " Great product. ",
      })
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: "https://linkedin.com/in/jane",
        cover_letter: "I would love to join.",
        app_feedback: "Great product.",
      })
    );
  });

  it("stores null for omitted optional fields", async () => {
    const { insert } = mockSupabase();

    await POST(jsonRequest(VALID));

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: null,
        cover_letter: null,
        app_feedback: null,
        resume_url: null,
      })
    );
  });

  it("never uploads a resume on the JSON path", async () => {
    const { upload } = mockSupabase();

    await POST(jsonRequest(VALID));

    expect(upload).not.toHaveBeenCalled();
  });

  it("returns 500 when the insert fails", async () => {
    mockSupabase({ insertError: { message: "db down" } });

    const res = await POST(jsonRequest(VALID));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to save application" });
  });
});

describe("multipart submissions", () => {
  const resume = () =>
    new File([new Uint8Array(64)], "jane-resume.pdf", { type: "application/pdf" });

  it("accepts a form submission without a resume", async () => {
    mockSupabase();

    const res = await POST(formRequest(VALID));

    expect(res.status).toBe(200);
  });

  it("validates form fields the same way", async () => {
    mockSupabase();

    const res = await POST(formRequest({ name: "Jane", email: "jane@example.com" }));

    expect(res.status).toBe(400);
  });

  it("uploads the resume and stores its public url", async () => {
    const { upload, insert } = mockSupabase({
      publicUrl: "https://cdn.example.com/resumes/xyz.pdf",
    });

    const res = await POST(formRequest(VALID, resume()));

    expect(res.status).toBe(200);
    expect(upload).toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        resume_url: "https://cdn.example.com/resumes/xyz.pdf",
      }),
    );
  });

  it("keeps the original file extension", async () => {
    const { upload } = mockSupabase();

    await POST(formRequest(VALID, resume()));

    expect(upload.mock.calls[0][0]).toMatch(/\.pdf$/);
  });

  it("generates a unique filename rather than trusting the upload", async () => {
    const { upload } = mockSupabase();

    await POST(formRequest(VALID, resume()));

    expect(upload.mock.calls[0][0]).not.toContain("jane-resume");
  });

  it("does not overwrite an existing stored file", async () => {
    const { upload } = mockSupabase();

    await POST(formRequest(VALID, resume()));

    expect(upload.mock.calls[0][2]).toMatchObject({
      contentType: "application/pdf",
      upsert: false,
    });
  });

  it("skips the upload for an empty file", async () => {
    const { upload, insert } = mockSupabase();
    const empty = new File([], "empty.pdf", { type: "application/pdf" });

    await POST(formRequest(VALID, empty));

    expect(upload).not.toHaveBeenCalled();
    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({ resume_url: null })
    );
  });

  it("returns 500 and saves nothing when the upload fails", async () => {
    const { insert } = mockSupabase({ uploadError: { message: "quota exceeded" } });

    const res = await POST(formRequest(VALID, resume()));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Failed to upload resume" });
    expect(insert).not.toHaveBeenCalled();
  });

  it("stores the optional form fields", async () => {
    const { insert } = mockSupabase();

    await POST(
      formRequest({
        ...VALID,
        linkedinUrl: "https://linkedin.com/in/jane",
        coverLetter: "Hello",
      })
    );

    expect(insert).toHaveBeenCalledWith(
      expect.objectContaining({
        linkedin_url: "https://linkedin.com/in/jane",
        cover_letter: "Hello",
      })
    );
  });
});
