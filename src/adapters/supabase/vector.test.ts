import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import { SupabaseVectorSearch } from "./vector";
import type { EmbeddingClient } from "../../ai/embeddings";

// Mock Supabase client
const createMockSupabaseClient = () => ({
  from: vi.fn(),
  select: vi.fn(),
  upsert: vi.fn(),
  eq: vi.fn(),
  order: vi.fn(),
  limit: vi.fn(),
  rpc: vi.fn(),
});

// Mock EmbeddingClient
const createMockEmbeddingClient = (): EmbeddingClient =>
  ({
    embed: vi.fn(),
  }) as unknown as EmbeddingClient;

describe("SupabaseVectorSearch", () => {
  let mockClient: ReturnType<typeof createMockSupabaseClient>;
  let mockEmbedClient: EmbeddingClient;
  let vectorSearch: SupabaseVectorSearch;

  beforeEach(() => {
    mockClient = createMockSupabaseClient();
    mockEmbedClient = createMockEmbeddingClient();
    vectorSearch = new SupabaseVectorSearch(mockClient as any, mockEmbedClient);
  });

  describe("upsert", () => {
    it("should upsert embedding successfully", async () => {
      const chunkId = 1;
      const embedding = [0.1, 0.2, 0.3];

      const upsertMock = vi.fn().mockReturnValue({
        data: null,
        error: null,
      });

      mockClient.from.mockReturnValue({
        upsert: upsertMock,
      });

      await vectorSearch.upsert(chunkId, embedding);

      expect(mockClient.from).toHaveBeenCalledWith("speech_embeddings");
      expect(upsertMock).toHaveBeenCalledWith({
        chunk_id: chunkId,
        embedding: embedding,
      });
    });

    it("should throw error when upsert fails", async () => {
      const chunkId = 1;
      const embedding = [0.1, 0.2, 0.3];

      const upsertMock = vi.fn().mockReturnValue({
        data: null,
        error: { message: "Upsert failed" },
      });

      mockClient.from.mockReturnValue({
        upsert: upsertMock,
      });

      await expect(vectorSearch.upsert(chunkId, embedding)).rejects.toThrow(
        "Upsert failed"
      );
    });
  });

  describe("querySimilar", () => {
    it("should return similar chunks using RPC function", async () => {
      const queryText = "教育について";
      const queryEmbedding = [0.1, 0.2, 0.3];
      const k = 5;

      const mockResults = [
        { chunk_id: 1, similarity: 0.95 },
        { chunk_id: 2, similarity: 0.85 },
      ];

      // Mock embedding generation
      vi.mocked(mockEmbedClient.embed).mockResolvedValue(queryEmbedding);

      // Mock RPC call
      mockClient.rpc.mockReturnValue({
        data: mockResults,
        error: null,
      });

      const results = await vectorSearch.querySimilar(queryText, k);

      expect(mockEmbedClient.embed).toHaveBeenCalledWith(queryText);
      expect(mockClient.rpc).toHaveBeenCalledWith("match_speech_chunks", {
        query_embedding: queryEmbedding,
        match_count: k,
        match_threshold: 0.1,
      });

      expect(results).toEqual([
        { chunkId: 1, score: 0.95 },
        { chunkId: 2, score: 0.85 },
      ]);
    });

    it("should return empty array when RPC returns no results", async () => {
      const queryText = "存在しないトピック";
      const queryEmbedding = [0.1, 0.2, 0.3];

      vi.mocked(mockEmbedClient.embed).mockResolvedValue(queryEmbedding);
      mockClient.rpc.mockReturnValue({
        data: null,
        error: null,
      });

      const results = await vectorSearch.querySimilar(queryText, 5);

      expect(results).toEqual([]);
    });

    it("should throw error when RPC call fails", async () => {
      const queryText = "教育について";
      const queryEmbedding = [0.1, 0.2, 0.3];

      vi.mocked(mockEmbedClient.embed).mockResolvedValue(queryEmbedding);
      mockClient.rpc.mockReturnValue({
        data: null,
        error: { message: "RPC failed" },
      });

      await expect(vectorSearch.querySimilar(queryText, 5)).rejects.toThrow(
        "RPC failed"
      );
    });

    it("should throw error when embedding generation fails", async () => {
      const queryText = "教育について";

      vi.mocked(mockEmbedClient.embed).mockRejectedValue(
        new Error("Embedding failed")
      );

      await expect(vectorSearch.querySimilar(queryText, 5)).rejects.toThrow(
        "Embedding failed"
      );
    });
  });
});
