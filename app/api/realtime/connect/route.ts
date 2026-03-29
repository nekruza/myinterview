export async function POST(req: Request) {
  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "INWORLD_API_KEY not configured" }, { status: 500 });
  }

  const { sdp } = await req.json() as { sdp: string };
  if (!sdp) {
    return Response.json({ error: "Missing SDP offer" }, { status: 400 });
  }

  const sdpRes = await fetch("https://api.inworld.ai/v1/realtime/webrtc", {
    method: "POST",
    headers: {
      Authorization: `Basic ${apiKey}`,
      "Content-Type": "application/sdp",
    },
    body: sdp,
  });

  if (!sdpRes.ok) {
    return Response.json(
      { error: `SDP exchange failed: ${sdpRes.status}` },
      { status: 500 }
    );
  }

  const answerSdp = await sdpRes.text();
  return new Response(answerSdp, {
    headers: { "Content-Type": "application/sdp" },
  });
}
