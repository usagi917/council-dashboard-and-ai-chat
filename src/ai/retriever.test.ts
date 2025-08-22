import { describe, it, expect, beforeEach, vi } from "vitest";
import { retrieve } from "./retriever";
import { VectorSearch } from "../ports/vector";
import { SpeechesRepo } from "../ports/repositories";
import { EmbeddingClient } from "./embeddings";
import { SpeechChunk } from "../domain/types";

describe("retrieve", () => {
  let mockVectorSearch: VectorSearch;
  let mockSpeechesRepo: SpeechesRepo;
  let mockEmbeddingClient: EmbeddingClient;

  beforeEach(() => {
    mockVectorSearch = {
      upsert: vi.fn(),
      querySimilar: vi.fn(),
    };

    mockSpeechesRepo = {
      list: vi.fn(),
      getChunksByIds: vi.fn(),
      getAllChunks: vi.fn(),
    };

    mockEmbeddingClient = {
      embed: vi.fn(),
    } as unknown as EmbeddingClient;
  });

  it("should return empty array when no similar vectors found", async () => {
    vi.mocked(mockEmbeddingClient.embed).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(mockVectorSearch.querySimilar).mockResolvedValue([]);

    const result = await retrieve(
      "test question",
      5,
      mockVectorSearch,
      mockSpeechesRepo,
      mockEmbeddingClient
    );

    expect(result).toEqual([]);
    expect(mockEmbeddingClient.embed).toHaveBeenCalledWith("test question");
    expect(mockVectorSearch.querySimilar).toHaveBeenCalledWith(
      "test question",
      5
    );
  });

  it("should return chunks when similar vectors found", async () => {
    const mockChunks: SpeechChunk[] = [
      {
        id: 1,
        speechId: 1,
        idx: 0,
        text: "教育について話しました",
        sourceUrl: "https://example.com/speech1",
      },
      {
        id: 2,
        speechId: 2,
        idx: 1,
        text: "予算について議論しました",
        sourceUrl: "https://example.com/speech2",
      },
    ];

    vi.mocked(mockEmbeddingClient.embed).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(mockVectorSearch.querySimilar).mockResolvedValue([
      { chunkId: 1, score: 0.9 },
      { chunkId: 2, score: 0.8 },
    ]);
    vi.mocked(mockSpeechesRepo.getChunksByIds).mockResolvedValue(mockChunks);

    const result = await retrieve(
      "教育について",
      5,
      mockVectorSearch,
      mockSpeechesRepo,
      mockEmbeddingClient
    );

    expect(result).toEqual([
      { chunk: mockChunks[0] },
      { chunk: mockChunks[1] },
    ]);
    expect(mockEmbeddingClient.embed).toHaveBeenCalledWith("教育について");
    expect(mockVectorSearch.querySimilar).toHaveBeenCalledWith(
      "教育について",
      5
    );
    expect(mockSpeechesRepo.getChunksByIds).toHaveBeenCalledWith([1, 2]);
  });

  it("should limit results to k parameter", async () => {
    vi.mocked(mockEmbeddingClient.embed).mockResolvedValue([0.1, 0.2, 0.3]);
    vi.mocked(mockVectorSearch.querySimilar).mockResolvedValue([
      { chunkId: 1, score: 0.9 },
      { chunkId: 2, score: 0.8 },
    ]);
    vi.mocked(mockSpeechesRepo.getChunksByIds).mockResolvedValue([]);

    await retrieve(
      "test",
      2,
      mockVectorSearch,
      mockSpeechesRepo,
      mockEmbeddingClient
    );

    expect(mockVectorSearch.querySimilar).toHaveBeenCalledWith("test", 2);
  });
});
