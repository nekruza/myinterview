export async function GET() {
  const apiKey = process.env.INWORLD_API_KEY;
  if (!apiKey) {
    return Response.json({ error: "INWORLD_API_KEY not configured" }, { status: 500 });
  }

  const iceRes = await fetch("https://api.inworld.ai/v1/realtime/ice-servers", {
    headers: {
      Authorization: `Basic ${apiKey}`,
    },
  });

  if (!iceRes.ok) {
    return Response.json(
      { error: `Failed to fetch ICE servers: ${iceRes.status}` },
      { status: 500 }
    );
  }

  const { iceServers } = await iceRes.json();

  return Response.json({ iceServers });
}
