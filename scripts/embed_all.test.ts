import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpeechesRepo } from "../src/ports/repositories";
import type { VectorSearch } from "../src/ports/vector";
import type { EmbeddingClient } from "../src/ai/embeddings";
import { EmbeddingProcessor, EmbeddingProgress } from "./embed_all";

// Mock implementations
const createMockSpeechesRepo = (): SpeechesRepo => ({
  list: vi.fn(),
  getChunksByIds: vi.fn(),
});

const createMockVectorSearch = (): VectorSearch => ({
  upsert: vi.fn(),
  querySimilar: vi.fn(),
});

const createMockEmbeddingClient = (): EmbeddingClient =>
  ({
    embed: vi.fn(),
  }) as unknown as EmbeddingClient;

describe("EmbeddingProcessor", () => {
  let mockSpeechesRepo: SpeechesRepo;
  let mockVectorSearch: VectorSearch;
  let mockEmbeddingClient: EmbeddingClient;
  let processor: EmbeddingProcessor;
  let progressCallback: (progress: EmbeddingProgress) => void;

  beforeEach(() => {
    mockSpeechesRepo = createMockSpeechesRepo();
    mockVectorSearch = createMockVectorSearch();
    mockEmbeddingClient = createMockEmbeddingClient();
    progressCallback = vi.fn();

    processor = new EmbeddingProcessor(
      mockSpeechesRepo,
      mockVectorSearch,
      mockEmbeddingClient,
      { rateLimitMs: 10, batchSize: 2 } // Fast settings for testing
    );
  });

  describe("processAllChunks", () => {
    it("should process all chunks in batches with rate limiting", async () => {
      const mockChunks = [
        {
          id: 1,
          speechId: 1,
          idx: 0,
          text: "チャンク1",
          sourceUrl: "http://example.com/1",
        },
        {
          id: 2,
          speechId: 1,
          idx: 1,
          text: "チャンク2",
          sourceUrl: "http://example.com/1",
        },
        {
          id: 3,
          speechId: 2,
          idx: 0,
          text: "チャンク3",
          sourceUrl: "http://example.com/2",
        },
      ];

      const mockEmbedding = [0.1, 0.2, 0.3];

      // Mock repository to return chunks in pagination
      vi.mocked(mockSpeechesRepo.getChunksByIds)
        .mockResolvedValueOnce(mockChunks.slice(0, 2)) // First batch
        .mockResolvedValueOnce(mockChunks.slice(2)); // Second batch

      // Mock embedding client
      vi.mocked(mockEmbeddingClient.embed).mockResolvedValue(mockEmbedding);

      // Mock vector search
      vi.mocked(mockVectorSearch.upsert).mockResolvedValue();

      // Process chunks
      await processor.processAllChunks([1, 2, 3], progressCallback);

      // Verify embedding generation calls
      expect(mockEmbeddingClient.embed).toHaveBeenCalledTimes(3);
      expect(mockEmbeddingClient.embed).toHaveBeenCalledWith("チャンク1");
      expect(mockEmbeddingClient.embed).toHaveBeenCalledWith("チャンク2");
      expect(mockEmbeddingClient.embed).toHaveBeenCalledWith("チャンク3");

      // Verify vector upsert calls
      expect(mockVectorSearch.upsert).toHaveBeenCalledTimes(3);
      expect(mockVectorSearch.upsert).toHaveBeenCalledWith(1, mockEmbedding);
      expect(mockVectorSearch.upsert).toHaveBeenCalledWith(2, mockEmbedding);
      expect(mockVectorSearch.upsert).toHaveBeenCalledWith(3, mockEmbedding);

      // Verify progress callback
      expect(progressCallback).toHaveBeenCalledWith({
        processed: 2,
        total: 3,
        currentChunkId: 2,
      });
      expect(progressCallback).toHaveBeenCalledWith({
        processed: 3,
        total: 3,
        currentChunkId: 3,
      });
    });

    it("should handle errors gracefully and continue processing", async () => {
      const mockChunks = [
        {
          id: 1,
          speechId: 1,
          idx: 0,
          text: "チャンク1",
          sourceUrl: "http://example.com/1",
        },
        {
          id: 2,
          speechId: 1,
          idx: 1,
          text: "チャンク2",
          sourceUrl: "http://example.com/1",
        },
      ];

      vi.mocked(mockSpeechesRepo.getChunksByIds).mockResolvedValue(mockChunks);

      // First embedding fails, second succeeds
      vi.mocked(mockEmbeddingClient.embed)
        .mockRejectedValueOnce(new Error("Embedding failed"))
        .mockResolvedValueOnce([0.1, 0.2, 0.3]);

      vi.mocked(mockVectorSearch.upsert).mockResolvedValue();

      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await processor.processAllChunks([1, 2], progressCallback);

      // Should log error for first chunk
      expect(consoleSpy).toHaveBeenCalledWith(
        "Failed to process chunk 1:",
        expect.any(Error)
      );

      // Should still process second chunk
      expect(mockVectorSearch.upsert).toHaveBeenCalledWith(2, [0.1, 0.2, 0.3]);

      consoleSpy.mockRestore();
    });

    it("should respect rate limiting", async () => {
      const startTime = Date.now();
      const mockChunks = [
        {
          id: 1,
          speechId: 1,
          idx: 0,
          text: "チャンク1",
          sourceUrl: "http://example.com/1",
        },
      ];

      vi.mocked(mockSpeechesRepo.getChunksByIds).mockResolvedValue(mockChunks);
      vi.mocked(mockEmbeddingClient.embed).mockResolvedValue([0.1, 0.2, 0.3]);
      vi.mocked(mockVectorSearch.upsert).mockResolvedValue();

      // Use longer rate limit for timing test
      const slowProcessor = new EmbeddingProcessor(
        mockSpeechesRepo,
        mockVectorSearch,
        mockEmbeddingClient,
        { rateLimitMs: 50, batchSize: 1 }
      );

      await slowProcessor.processAllChunks([1], progressCallback);

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least the rate limit time
      expect(elapsed).toBeGreaterThanOrEqual(40); // Allow some margin
    });

    it("should handle empty chunk IDs array", async () => {
      await processor.processAllChunks([], progressCallback);

      expect(mockSpeechesRepo.getChunksByIds).not.toHaveBeenCalled();
      expect(mockEmbeddingClient.embed).not.toHaveBeenCalled();
      expect(mockVectorSearch.upsert).not.toHaveBeenCalled();
      expect(progressCallback).not.toHaveBeenCalled();
    });
  });
});
