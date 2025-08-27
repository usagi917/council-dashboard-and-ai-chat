import { describe, it, expect, vi } from "vitest";
import { EmbeddingProcessor } from "../embed_all";
import type { SpeechesRepo } from "../../src/ports/repositories";
import type { VectorSearch } from "../../src/ports/vector";
import type { SpeechChunk } from "../../src/domain/types";

describe("EmbeddingProcessor", () => {
  const mockConfig = {
    rateLimitMs: 0, // No delay in tests
    batchSize: 2,
  };

  function createMocks() {
    return {
      speechesRepo: {
        list: vi.fn(),
        getChunksByIds: vi.fn(),
        getAllChunks: vi.fn(),
        insertSpeech: vi.fn(),
        insertChunk: vi.fn(),
        updateSpeech: vi.fn(),
        deleteSpeech: vi.fn(),
      } as SpeechesRepo,
      vectorSearch: {
        upsert: vi.fn(),
        querySimilar: vi.fn(),
      } as VectorSearch,
      embeddingClient: {
        embed: vi.fn(),
      } as any,
    };
  }

  describe("processAllChunks", () => {
    it("should handle empty chunk array", async () => {
      const mocks = createMocks();
      const processor = new EmbeddingProcessor(
        mocks.speechesRepo,
        mocks.vectorSearch,
        mocks.embeddingClient,
        mockConfig
      );

      await processor.processAllChunks([]);

      expect(mocks.speechesRepo.getChunksByIds).not.toHaveBeenCalled();
      expect(mocks.embeddingClient.embed).not.toHaveBeenCalled();
      expect(mocks.vectorSearch.upsert).not.toHaveBeenCalled();
    });

    it("should process all chunks successfully", async () => {
      const mocks = createMocks();
      const processor = new EmbeddingProcessor(
        mocks.speechesRepo,
        mocks.vectorSearch,
        mocks.embeddingClient,
        mockConfig
      );

      const chunkIds = [1, 2, 3];
      const mockChunks: SpeechChunk[] = [
        {
          id: 1,
          speechId: 101,
          idx: 0,
          text: "テストチャンク1",
          sourceUrl: "https://example.com/1",
        },
        {
          id: 2,
          speechId: 101,
          idx: 1,
          text: "テストチャンク2",
          sourceUrl: "https://example.com/2",
        },
        {
          id: 3,
          speechId: 102,
          idx: 0,
          text: "テストチャンク3",
          sourceUrl: "https://example.com/3",
        },
      ];
      const mockEmbedding = new Array(3072).fill(0.1);

      vi.mocked(mocks.speechesRepo.getChunksByIds)
        .mockResolvedValueOnce([mockChunks[0], mockChunks[1]]) // batch 1: [1, 2]
        .mockResolvedValueOnce([mockChunks[2]]); // batch 2: [3]
      vi.mocked(mocks.embeddingClient.embed).mockResolvedValue(mockEmbedding);
      vi.mocked(mocks.vectorSearch.upsert).mockResolvedValue();

      const progressCallback = vi.fn();
      await processor.processAllChunks(chunkIds, progressCallback);

      expect(mocks.speechesRepo.getChunksByIds).toHaveBeenCalledWith([1, 2]);
      expect(mocks.speechesRepo.getChunksByIds).toHaveBeenCalledWith([3]);
      expect(mocks.embeddingClient.embed).toHaveBeenCalledTimes(3);
      expect(mocks.vectorSearch.upsert).toHaveBeenCalledTimes(3);
    });

    it("should handle individual chunk failures gracefully", async () => {
      const mocks = createMocks();
      const processor = new EmbeddingProcessor(
        mocks.speechesRepo,
        mocks.vectorSearch,
        mocks.embeddingClient,
        mockConfig
      );

      const chunkIds = [1, 2];
      const mockChunks: SpeechChunk[] = [
        {
          id: 1,
          speechId: 101,
          idx: 0,
          text: "テストチャンク1",
          sourceUrl: "https://example.com/1",
        },
        {
          id: 2,
          speechId: 101,
          idx: 1,
          text: "テストチャンク2",
          sourceUrl: "https://example.com/2",
        },
      ];
      const mockEmbedding = new Array(3072).fill(0.1);

      vi.mocked(mocks.speechesRepo.getChunksByIds).mockResolvedValue(
        mockChunks
      );
      vi.mocked(mocks.embeddingClient.embed)
        .mockResolvedValueOnce(mockEmbedding)
        .mockRejectedValueOnce(new Error("Embedding API error"));
      vi.mocked(mocks.vectorSearch.upsert).mockResolvedValue();

      await expect(
        processor.processAllChunks(chunkIds)
      ).resolves.toBeUndefined();

      expect(mocks.vectorSearch.upsert).toHaveBeenCalledWith(1, mockEmbedding);
      expect(mocks.vectorSearch.upsert).toHaveBeenCalledTimes(1);
    });

    it("should handle batch fetch failures gracefully", async () => {
      const mocks = createMocks();
      const processor = new EmbeddingProcessor(
        mocks.speechesRepo,
        mocks.vectorSearch,
        mocks.embeddingClient,
        mockConfig
      );

      const chunkIds = [1, 2];

      vi.mocked(mocks.speechesRepo.getChunksByIds).mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(
        processor.processAllChunks(chunkIds)
      ).resolves.toBeUndefined();

      expect(mocks.embeddingClient.embed).not.toHaveBeenCalled();
      expect(mocks.vectorSearch.upsert).not.toHaveBeenCalled();
    });

    it("should respect batch size configuration", async () => {
      const mocks = createMocks();
      const processor = new EmbeddingProcessor(
        mocks.speechesRepo,
        mocks.vectorSearch,
        mocks.embeddingClient,
        mockConfig
      );

      const chunkIds = [1, 2, 3, 4, 5];
      const mockChunks: SpeechChunk[] = [
        {
          id: 1,
          speechId: 101,
          idx: 0,
          text: "チャンク1",
          sourceUrl: "https://example.com/1",
        },
        {
          id: 2,
          speechId: 101,
          idx: 1,
          text: "チャンク2",
          sourceUrl: "https://example.com/2",
        },
        {
          id: 3,
          speechId: 102,
          idx: 0,
          text: "チャンク3",
          sourceUrl: "https://example.com/3",
        },
        {
          id: 4,
          speechId: 102,
          idx: 1,
          text: "チャンク4",
          sourceUrl: "https://example.com/4",
        },
        {
          id: 5,
          speechId: 103,
          idx: 0,
          text: "チャンク5",
          sourceUrl: "https://example.com/5",
        },
      ];

      vi.mocked(mocks.speechesRepo.getChunksByIds)
        .mockResolvedValueOnce([mockChunks[0], mockChunks[1]]) // batch 1
        .mockResolvedValueOnce([mockChunks[2], mockChunks[3]]) // batch 2
        .mockResolvedValueOnce([mockChunks[4]]); // batch 3

      vi.mocked(mocks.embeddingClient.embed).mockResolvedValue(
        new Array(3072).fill(0.1)
      );
      vi.mocked(mocks.vectorSearch.upsert).mockResolvedValue();

      await processor.processAllChunks(chunkIds);

      expect(mocks.speechesRepo.getChunksByIds).toHaveBeenCalledTimes(3);
      expect(mocks.speechesRepo.getChunksByIds).toHaveBeenNthCalledWith(
        1,
        [1, 2]
      );
      expect(mocks.speechesRepo.getChunksByIds).toHaveBeenNthCalledWith(
        2,
        [3, 4]
      );
      expect(mocks.speechesRepo.getChunksByIds).toHaveBeenNthCalledWith(3, [5]);
    });
  });
});
