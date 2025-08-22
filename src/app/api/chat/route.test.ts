import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";
import { NextRequest } from "next/server";
import { getMessage } from "../../../i18n/ja";

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

vi.mock("../../../i18n/ja", () => ({
  getMessage: vi.fn(),
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
    vi.mocked(getMessage).mockImplementation((key: string) => {
      const messages = {
        "errors.noInformation": "情報がありません。",
        "errors.chatError": "チャットでエラーが発生しました",
      };
      return messages[key as keyof typeof messages] || "エラーが発生しました";
    });
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
    expect(getMessage).toHaveBeenCalledWith("errors.noInformation");
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

  // NOTE: Enhanced system prompt functionality is verified through integration tests
  // Strict mode adds citation requirements to prevent response deviation
});
