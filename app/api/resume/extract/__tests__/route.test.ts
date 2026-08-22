import type { NextRequest } from "next/server";
import { POST } from "../route";
import {
  createSupabaseMock,
  writePayload,
  type SupabaseMock,
  type SupabaseMockConfig,
} from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const getText = jest.fn();
jest.mock(
  "pdf-parse",
  () => ({
    __esModule: true,
    PDFParse: jest.fn().mockImplementation(() => ({ getText })),
  }),
  { virtual: true }
);

const extractRawText = jest.fn();
jest.mock(
  "mammoth",
  () => ({ __esModule: true, extractRawText }),
  { virtual: true }
);

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1" };
const PDF_TYPE = "application/pdf";
const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

interface StorageConfig {
  uploadError?: { message: string } | null;
  publicUrl?: string;
}

type ResumeMock = SupabaseMock & {
  storage: { from: jest.Mock };
  upload: jest.Mock;
  getPublicUrl: jest.Mock;
};

function mockSupabase(
  config: SupabaseMockConfig,
  storage: StorageConfig = {}
): ResumeMock {
  const { uploadError = null, publicUrl = "https://cdn.example.com/resume.pdf" } =
    storage;

  const mock = createSupabaseMock(config) as ResumeMock;

  const upload = jest.fn(async () => ({ error: uploadError }));
  const getPublicUrl = jest.fn(() => ({ data: { publicUrl } }));

  mock.storage = { from: jest.fn(() => ({ upload, getPublicUrl })) };
  mock.upload = upload;
  mock.getPublicUrl = getPublicUrl;

  createClient.mockResolvedValue(mock);
  return mock;
}

function uploadRequest(file?: File) {
  const formData = new FormData();
  if (file) formData.append("file", file);

  return new Request("http://localhost/api/resume/extract", {
    method: "POST",
    body: formData,
  }) as unknown as NextRequest;
}

function makeFile(
  type: string,
  { name = "resume", sizeBytes = 1024 } = {}
): File {
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

beforeEach(() => {
  getText.mockResolvedValue({ text: "  Extracted resume text  " });
  extractRawText.mockResolvedValue({ value: "  Docx resume text  " });
});

describe("authorisation and validation", () => {
  it("returns 401 for an anonymous caller", async () => {
    mockSupabase({ user: null });

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(res.status).toBe(401);
    await expect(res.json()).resolves.toEqual({ error: "Unauthorized" });
  });

  it("returns 400 when no file is attached", async () => {
    mockSupabase({ user: USER });

    const res = await POST(uploadRequest());

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "No file provided" });
  });

  it.each([
    ["a plain text file", "text/plain"],
    ["an image", "image/png"],
    ["a legacy word document", "application/msword"],
  ])("rejects %s", async (_label, type) => {
    mockSupabase({ user: USER });

    const res = await POST(uploadRequest(makeFile(type)));

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({
      error: "Invalid file type. Upload a PDF or DOCX.",
    });
  });

  it("rejects a file over 5MB", async () => {
    mockSupabase({ user: USER });

    const res = await POST(
      uploadRequest(makeFile(PDF_TYPE, { sizeBytes: 5 * 1024 * 1024 + 1 }))
    );

    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toEqual({ error: "File too large. Max 5MB." });
  });

  it("accepts a file exactly at the 5MB limit", async () => {
    mockSupabase({ user: USER });

    const res = await POST(
      uploadRequest(makeFile(PDF_TYPE, { sizeBytes: 5 * 1024 * 1024 }))
    );

    expect(res.status).toBe(200);
  });

  it("does not upload anything when validation fails", async () => {
    const db = mockSupabase({ user: USER });

    await POST(uploadRequest(makeFile("text/plain")));

    expect(db.upload).not.toHaveBeenCalled();
  });
});

describe("storage", () => {
  it("stores the resume under the user's own folder", async () => {
    const db = mockSupabase({ user: USER });

    await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(db.upload).toHaveBeenCalledWith(
      "user-1/resume.pdf",
      expect.any(Buffer),
      expect.objectContaining({ contentType: PDF_TYPE, upsert: true })
    );
  });

  it("uses a docx extension for word documents", async () => {
    const db = mockSupabase({ user: USER });

    await POST(uploadRequest(makeFile(DOCX_TYPE)));

    expect(db.upload.mock.calls[0][0]).toBe("user-1/resume.docx");
  });

  it("overwrites the previous resume rather than accumulating files", async () => {
    const db = mockSupabase({ user: USER });

    await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(db.upload.mock.calls[0][2].upsert).toBe(true);
  });

  it("returns 500 when the upload fails", async () => {
    mockSupabase({ user: USER }, { uploadError: { message: "quota exceeded" } });

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Storage upload failed" });
  });

  it("does not update the profile when the upload fails", async () => {
    const db = mockSupabase({ user: USER }, { uploadError: { message: "quota" } });

    await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(db.callCountFor("profiles")).toBe(0);
  });
});

describe("text extraction", () => {
  it("extracts and trims text from a PDF", async () => {
    const db = mockSupabase({ user: USER });

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    await expect(res.json()).resolves.toMatchObject({
      success: true,
      resume_text: "Extracted resume text",
      extract_error: null,
    });
    expect(writePayload(db, "profiles", "update").resume_text).toBe(
      "Extracted resume text"
    );
  });

  it("extracts and trims text from a DOCX", async () => {
    mockSupabase({ user: USER });

    const res = await POST(uploadRequest(makeFile(DOCX_TYPE)));

    await expect(res.json()).resolves.toMatchObject({
      resume_text: "Docx resume text",
    });
  });

  it("stores the public url alongside the text", async () => {
    const db = mockSupabase(
      { user: USER },
      { publicUrl: "https://cdn.example.com/user-1/resume.pdf" }
    );

    await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(writePayload(db, "profiles", "update").resume_url).toBe(
      "https://cdn.example.com/user-1/resume.pdf"
    );
  });

  it("updates only the caller's own profile", async () => {
    const db = mockSupabase({ user: USER });

    await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(db.builderFor("profiles").eq).toHaveBeenCalledWith("id", USER.id);
  });

  it("treats an image-only PDF with no text as a success", async () => {
    mockSupabase({ user: USER });
    getText.mockResolvedValue({ text: "   " });

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      resume_text: null,
    });
  });

  it("still saves the upload when parsing throws, and reports why", async () => {
    mockSupabase({ user: USER });
    getText.mockRejectedValue(new Error("encrypted pdf"));

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(res.status).toBe(200);
    await expect(res.json()).resolves.toMatchObject({
      success: true,
      resume_text: null,
      extract_error: "encrypted pdf",
    });
  });

  it("returns 500 when the profile update fails", async () => {
    mockSupabase({
      user: USER,
      tables: { profiles: { data: null, error: { message: "db down" } } },
    });

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({
      error: "Failed to save resume data",
    });
  });
});

describe("unexpected failures", () => {
  it("returns 500 rather than crashing when the client blows up", async () => {
    createClient.mockRejectedValue(new Error("connection refused"));

    const res = await POST(uploadRequest(makeFile(PDF_TYPE)));

    expect(res.status).toBe(500);
    await expect(res.json()).resolves.toEqual({ error: "Internal server error" });
  });
});
