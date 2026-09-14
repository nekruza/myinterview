import { GET } from "../route";
import { createSupabaseMock, type SupabaseMockConfig } from "@/test-utils/supabase-mock";

jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));

const { createClient } = jest.requireMock("@/lib/supabase/server");

const USER = { id: "user-1" };

function mockSupabase(config: SupabaseMockConfig) {
  const mock = createSupabaseMock(config);
  createClient.mockResolvedValue(mock);
  return mock;
}

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
    delete process.env.INWORLD_API_KEY;
  });

  it("returns 401 with no authenticated user", async () => {
    mockSupabase({ user: null });

    const response = await GET();

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ error: "Unauthorized" });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it("returns iceServers but NOT the apiKey", async () => {
    mockSupabase({ user: USER });

    const response = await GET();
    const data = await response.json();

    expect(data.iceServers).toEqual([{ urls: "stun:stun.example.com" }]);
    expect(data.apiKey).toBeUndefined();
    expect(data.realtimeUrl).toBeUndefined();
  });

  it("calls Inworld ICE servers endpoint with auth header", async () => {
    mockSupabase({ user: USER });

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
    mockSupabase({ user: USER });
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    const response = await GET();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });

  it("returns 500 when INWORLD_API_KEY is not set", async () => {
    mockSupabase({ user: USER });
    delete process.env.INWORLD_API_KEY;

    const response = await GET();
    expect(response.status).toBe(500);

    const data = await response.json();
    expect(data.error).toBeDefined();
  });
});
