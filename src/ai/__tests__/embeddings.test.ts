import { describe, test, expect, vi, beforeEach } from "vitest";
import { EmbeddingClient } from "../embeddings";

// OpenAI SDKをモック
vi.mock("openai", () => ({
  default: vi.fn(() => ({
    embeddings: {
      create: vi.fn(),
    },
  })),
}));

describe("EmbeddingClient", () => {
  let client: EmbeddingClient;
  let mockOpenAI: any;

  beforeEach(() => {
    // OpenAI インスタンスのモックを作成
    mockOpenAI = {
      embeddings: {
        create: vi.fn(),
      },
    };
    client = new EmbeddingClient(mockOpenAI);
  });

  test("embed() should return embedding vector with correct dimensions", async () => {
    // 3072次元のモックベクターを作成
    const mockEmbedding = new Array(3072).fill(0).map((_, i) => i * 0.001);

    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [
        {
          embedding: mockEmbedding,
        },
      ],
    });

    const result = await client.embed("test text");

    expect(result).toEqual(mockEmbedding);
    expect(result.length).toBe(3072);
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
      model: "text-embedding-3-large",
      input: "test text",
    });
  });

  test("embed() should handle OpenAI API errors", async () => {
    const apiError = new Error("API rate limit exceeded");
    mockOpenAI.embeddings.create.mockRejectedValue(apiError);

    await expect(client.embed("test text")).rejects.toThrow(
      "API rate limit exceeded"
    );
  });

  test("embed() should handle empty text input", async () => {
    const mockEmbedding = new Array(3072).fill(0);
    mockOpenAI.embeddings.create.mockResolvedValue({
      data: [{ embedding: mockEmbedding }],
    });

    const result = await client.embed("");

    expect(result).toEqual(mockEmbedding);
    expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
      model: "text-embedding-3-large",
      input: "",
    });
  });
});
