// app/api/realtime/config/__tests__/route.test.ts
import { GET } from "../route";

global.fetch = jest.fn();

describe("GET /api/realtime/config", () => {
  beforeEach(() => {
    process.env.INWORLD_API_KEY = "test-key-123";
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        iceServers: [{ urls: "stun:stun.example.com" }],
      }),
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns apiKey, iceServers, and realtimeUrl", async () => {
    const response = await GET();
    const data = await response.json();

    expect(data.apiKey).toBe("test-key-123");
    expect(data.iceServers).toEqual([{ urls: "stun:stun.example.com" }]);
    expect(data.realtimeUrl).toBe("https://api.inworld.ai/v1/realtime/webrtc");
  });

  it("calls Inworld ICE servers endpoint with auth header", async () => {
    await GET();

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.inworld.ai/v1/realtime/ice-servers",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Basic test-key-123",
        }),
      })
    );
  });

  it("returns 500 when Inworld ICE endpoint fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    const response = await GET();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
