import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const data = await iceRes.json() as { ice_servers?: RTCIceServer[]; iceServers?: RTCIceServer[] };
  const iceServers = data.ice_servers ?? data.iceServers ?? [];

  return Response.json({ iceServers });
}
