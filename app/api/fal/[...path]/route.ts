import { NextRequest } from "next/server";

export const runtime = "nodejs";

const TARGET_URL_HEADER = "x-fal-target-url";

async function handler(req: NextRequest) {
  const targetUrl = req.headers.get(TARGET_URL_HEADER);
  if (!targetUrl) {
    return new Response(JSON.stringify({ error: "Missing target URL" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const headers: Record<string, string> = {
    Authorization: `Key ${process.env.FAL_KEY}`,
  };
  const contentType = req.headers.get("Content-Type");
  if (contentType) headers["Content-Type"] = contentType;

  const body = req.method !== "GET" ? await req.arrayBuffer() : undefined;

  const falRes = await fetch(targetUrl, {
    method: req.method,
    headers,
    body,
  });

  const responseHeaders = new Headers();
  falRes.headers.forEach((value, key) => {
    responseHeaders.set(key, value);
  });

  const responseBody = await falRes.arrayBuffer();
  return new Response(responseBody, {
    status: falRes.status,
    headers: responseHeaders,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
