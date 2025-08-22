import { describe, it, expect, beforeEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "../../app/api/instagram/latest/route";

describe("/api/instagram/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset environment variables
    delete process.env.IG_GRAPH_TOKEN_LONG_LIVED;
    delete process.env.FB_APP_ID;
    delete process.env.FB_APP_CLIENT_TOKEN;

    // Reset fetch mock
    global.fetch = vi.fn();
  });

  it("returns empty array when no environment variables are configured", async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("attempts Graph API first with valid token", async () => {
    // Set up environment variables for Graph API
    process.env.IG_GRAPH_TOKEN_LONG_LIVED = "test-token";

    // Mock successful Graph API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        data: [
          {
            id: "123",
            caption: "Test post",
            media_type: "IMAGE",
            media_url: "https://example.com/image.jpg",
            permalink: "https://instagram.com/p/test",
            timestamp: "2024-01-01T00:00:00+0000",
          },
        ],
      }),
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      platform: "instagram",
      content: "Test post",
      mediaUrl: "https://example.com/image.jpg",
      postUrl: "https://instagram.com/p/test",
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("graph.facebook.com"),
      expect.any(Object)
    );
  });

  it("falls back to oEmbed when Graph API fails", async () => {
    // Set up environment variables
    process.env.IG_GRAPH_TOKEN_LONG_LIVED = "test-token";
    process.env.FB_APP_ID = "test-app-id";
    process.env.FB_APP_CLIENT_TOKEN = "test-client-token";

    // Mock Graph API failure, then successful oEmbed
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 400,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          html: '<blockquote class="instagram-media">Test embed</blockquote>',
          title: "Instagram post",
        }),
      });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      platform: "instagram",
      content: "Instagram post",
      postUrl: expect.any(String),
    });

    // Verify Graph API was called first
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("graph.facebook.com"),
      expect.any(Object)
    );

    // Verify oEmbed was called as fallback
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("instagram_oembed"),
      expect.any(Object)
    );
  });

  it("returns empty array when both Graph API and oEmbed fail", async () => {
    // Set up environment variables
    process.env.IG_GRAPH_TOKEN_LONG_LIVED = "test-token";
    process.env.FB_APP_ID = "test-app-id";
    process.env.FB_APP_CLIENT_TOKEN = "test-client-token";

    // Mock both API failures
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
    });

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });

  it("includes proper cache headers", async () => {
    const response = await GET();

    expect(response.headers.get("cache-control")).toContain("s-maxage=600");
  });

  it("handles network timeouts gracefully", async () => {
    process.env.IG_GRAPH_TOKEN_LONG_LIVED = "test-token";

    // Mock network timeout
    global.fetch = vi.fn().mockRejectedValue(new Error("Timeout"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
  });
});
