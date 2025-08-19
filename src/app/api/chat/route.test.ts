import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";

// Mock the dependencies
vi.mock("../../../container", () => ({
  getRepositories: vi.fn(() => ({
    speechesRepo: mockSpeechesRepo,
    highlightsRepo: mockHighlightsRepo,
    snsRepo: mockSnsRepo,
  })),
  getVectorSearch: vi.fn(() => mockVectorSearch),
  getEmbeddingClient: vi.fn(() => mockEmbeddingClient),
}));

vi.mock("openai", () => ({
  default: vi.fn(() => ({
    beta: {
      chat: {
        completions: {
          stream: vi.fn(),
        },
      },
    },
  })),
}));

const mockSpeechesRepo = {
  list: vi.fn(),
  getChunksByIds: vi.fn(),
  create: vi.fn(),
  createChunk: vi.fn(),
};

const mockHighlightsRepo = {
  list: vi.fn(),
};

const mockSnsRepo = {
  latest: vi.fn(),
};

const mockVectorSearch = {
  upsert: vi.fn(),
  querySimilar: vi.fn(),
};

const mockEmbeddingClient = {
  embed: vi.fn(),
};

describe("/api/chat POST", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return "情報がありません" when no chunks found', async () => {
    // Mock empty retrieval
    vi.mocked(mockEmbeddingClient.embed).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(mockVectorSearch.querySimilar).mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ question: "test question" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(response.headers.get("Content-Type")).toContain("text/plain");

    const text = await response.text();
    expect(text).toContain("情報がありません");
  });

  it("should validate request body", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: JSON.stringify({ invalid: "data" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it("should handle JSON parse errors", async () => {
    const request = new NextRequest("http://localhost:3000/api/chat", {
      method: "POST",
      body: "invalid json",
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });
});
