import { POST } from "../route";

global.fetch = jest.fn();

describe("POST /api/realtime/connect", () => {
  beforeEach(() => {
    process.env.INWORLD_API_KEY = "test-key-123";
  });

  afterEach(() => {
    jest.clearAllMocks();
    delete process.env.INWORLD_API_KEY;
  });

  it("proxies SDP offer to Inworld and returns SDP answer", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => "v=0\r\na=sendrecv\r\n",
    });

    const req = new Request("http://localhost/api/realtime/connect", {
      method: "POST",
      body: JSON.stringify({ sdp: "v=0\r\noffer sdp\r\n" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(200);

    const body = await response.text();
    expect(body).toBe("v=0\r\na=sendrecv\r\n");
  });

  it("forwards SDP to Inworld with Basic auth", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => "answer",
    });

    const req = new Request("http://localhost/api/realtime/connect", {
      method: "POST",
      body: JSON.stringify({ sdp: "my-sdp-offer" }),
    });

    await POST(req);

    expect(global.fetch).toHaveBeenCalledWith(
      "https://api.inworld.ai/v1/realtime/webrtc",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Basic test-key-123",
          "Content-Type": "application/sdp",
        }),
        body: "my-sdp-offer",
      })
    );
  });

  it("returns 500 when Inworld SDP exchange fails", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false, status: 503 });

    const req = new Request("http://localhost/api/realtime/connect", {
      method: "POST",
      body: JSON.stringify({ sdp: "offer" }),
    });

    const response = await POST(req);
    expect(response.status).toBe(500);
  });

  it("returns 400 when SDP is missing", async () => {
    const req = new Request("http://localhost/api/realtime/connect", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await POST(req);
    expect(response.status).toBe(400);
  });
});
