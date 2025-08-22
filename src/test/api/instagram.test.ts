import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "@/app/api/instagram/latest/route";

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock console methods to avoid noise in tests
const mockConsole = {
  log: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};
vi.stubGlobal("console", mockConsole);

describe("/api/instagram/latest", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    process.env.IG_GRAPH_TOKEN_LONG_LIVED = "test-graph-token";
    process.env.FB_APP_ID = "test-app-id";
    process.env.FB_APP_CLIENT_TOKEN = "test-client-token";
  });

  it("should return Instagram posts from Graph API when successful", async () => {
    const mockGraphResponse = {
      data: [
        {
          id: "1",
          caption: "Test post 1",
          media_type: "IMAGE",
          media_url: "https://example.com/image1.jpg",
          permalink: "https://instagram.com/p/1",
          timestamp: "2023-01-01T10:00:00+0000",
        },
        {
          id: "2",
          caption: "Test post 2",
          media_type: "VIDEO",
          media_url: "https://example.com/video2.mp4",
          permalink: "https://instagram.com/p/2",
          timestamp: "2023-01-02T10:00:00+0000",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGraphResponse,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toEqual([
      {
        id: 0, // Repository will set actual IDs
        platform: "instagram",
        postDate: "2023-01-01T10:00:00.000Z",
        content: "Test post 1",
        mediaUrl: "https://example.com/image1.jpg",
        postUrl: "https://instagram.com/p/1",
      },
      {
        id: 0,
        platform: "instagram",
        postDate: "2023-01-02T10:00:00.000Z",
        content: "Test post 2",
        mediaUrl: "https://example.com/video2.mp4",
        postUrl: "https://instagram.com/p/2",
      },
    ]);

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("graph.facebook.com/v18.0/me/media"),
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Accept: "application/json",
        }),
      })
    );
  });

  it("should fallback to oEmbed when Graph API fails", async () => {
    // Graph API fails
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: async () => ({ error: "Invalid token" }),
    });

    // oEmbed succeeds for first URL
    const mockOEmbedResponse = {
      html: '<blockquote class="instagram-media">Test Instagram post</blockquote>',
      title: "Test oEmbed Post",
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockOEmbedResponse,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data).toHaveLength(1);
    expect(data[0]).toEqual({
      id: 0,
      platform: "instagram",
      postDate: expect.any(String),
      content: "Test oEmbed Post",
      postUrl: "https://www.instagram.com/p/example1/",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("graph.facebook.com/v18.0/me/media"),
      expect.any(Object)
    );
    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("graph.facebook.com/v18.0/instagram_oembed"),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("should return empty array when both Graph API and oEmbed fail", async () => {
    // Both APIs fail
    mockFetch.mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ error: "Failed" }),
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
  });

  it("should include cache headers", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [] }),
    });

    const response = await GET();

    expect(response.headers.get("Cache-Control")).toBe(
      "s-maxage=600, stale-while-revalidate=86400"
    );
  });

  it("should handle missing environment variables gracefully", async () => {
    delete process.env.IG_GRAPH_TOKEN_LONG_LIVED;
    delete process.env.FB_APP_ID;
    delete process.env.FB_APP_CLIENT_TOKEN;

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data).toEqual([]);
    expect(mockConsole.log).toHaveBeenCalledWith(
      "No Instagram API credentials available or all methods failed"
    );
  });

  it("should handle Graph API with missing media_url", async () => {
    const mockGraphResponse = {
      data: [
        {
          id: "1",
          caption: "Test post without media",
          media_type: "IMAGE",
          // media_url is missing
          permalink: "https://instagram.com/p/1",
          timestamp: "2023-01-01T10:00:00+0000",
        },
      ],
    };

    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => mockGraphResponse,
    });

    const response = await GET();

    expect(response.status).toBe(200);
    const data = await response.json();

    expect(data[0].mediaUrl).toBeUndefined();
    expect(data[0].content).toBe("Test post without media");
  });
});
