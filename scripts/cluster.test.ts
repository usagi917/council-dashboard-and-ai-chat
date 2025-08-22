import { describe, it, expect, vi, beforeEach } from "vitest";
import type { SpeechChunk, Highlight } from "../src/domain/types";
import type {
  SpeechesRepo,
  HighlightsRepo,
  EmbeddingsRepo,
  EmbeddingRecord,
} from "../src/ports/repositories";
import { updateHighlights } from "./cluster";

// Mock repositories
const mockSpeechesRepo: SpeechesRepo = {
  list: vi.fn(),
  getChunksByIds: vi.fn(),
  getAllChunks: vi.fn(),
};

const mockHighlightsRepo: HighlightsRepo = {
  list: vi.fn(),
  upsert: vi.fn(),
  clear: vi.fn(),
};

const mockEmbeddingsRepo: EmbeddingsRepo = {
  getAllEmbeddings: vi.fn(),
};

describe("cluster script", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should cluster embeddings and update highlights", async () => {
    // Mock data
    const mockChunks: SpeechChunk[] = [
      {
        id: 1,
        speechId: 1,
        idx: 0,
        text: "教育に関する発言です。子どもたちの未来について話します。",
        sourceUrl: "http://example.com/1",
      },
      {
        id: 2,
        speechId: 1,
        idx: 1,
        text: "教育予算について議論しています。学校運営の改善が必要です。",
        sourceUrl: "http://example.com/1",
      },
      {
        id: 3,
        speechId: 2,
        idx: 0,
        text: "環境問題について考えています。リサイクルの推進が重要です。",
        sourceUrl: "http://example.com/2",
      },
    ];

    const mockEmbeddings: EmbeddingRecord[] = [
      { chunkId: 1, embedding: [0.1, 0.2, 0.3] },
      { chunkId: 2, embedding: [0.2, 0.3, 0.4] },
      { chunkId: 3, embedding: [0.9, 0.8, 0.7] },
    ];

    // Setup mocks
    vi.mocked(mockSpeechesRepo.getAllChunks).mockResolvedValue(mockChunks);
    vi.mocked(mockEmbeddingsRepo.getAllEmbeddings).mockResolvedValue(
      mockEmbeddings
    );
    vi.mocked(mockHighlightsRepo.clear).mockResolvedValue();
    vi.mocked(mockHighlightsRepo.upsert).mockResolvedValue();

    // Execute clustering
    await updateHighlights(
      mockSpeechesRepo,
      mockHighlightsRepo,
      mockEmbeddingsRepo,
      {
        k: 2,
        seed: 42,
      }
    );

    // Verify highlights were cleared
    expect(mockHighlightsRepo.clear).toHaveBeenCalledOnce();

    // Verify highlights were upserted (should be 2 clusters)
    expect(mockHighlightsRepo.upsert).toHaveBeenCalledTimes(2);

    // Check that the upserted highlights have the correct structure
    const upsertCalls = vi.mocked(mockHighlightsRepo.upsert).mock.calls;

    upsertCalls.forEach(([highlight]) => {
      expect(highlight).toMatchObject({
        clusterLabel: expect.any(String),
        count: expect.any(Number),
        sampleChunkId: expect.any(Number),
      });
      expect(highlight.count).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(highlight.sampleChunkId);
    });
  });

  it("should handle empty embeddings gracefully", async () => {
    vi.mocked(mockSpeechesRepo.getAllChunks).mockResolvedValue([]);
    vi.mocked(mockEmbeddingsRepo.getAllEmbeddings).mockResolvedValue([]);
    vi.mocked(mockHighlightsRepo.clear).mockResolvedValue();

    await updateHighlights(
      mockSpeechesRepo,
      mockHighlightsRepo,
      mockEmbeddingsRepo
    );

    expect(mockHighlightsRepo.clear).toHaveBeenCalledOnce();
    expect(mockHighlightsRepo.upsert).not.toHaveBeenCalled();
  });

  it("should use default parameters when not provided", async () => {
    const mockChunks: SpeechChunk[] = [
      {
        id: 1,
        speechId: 1,
        idx: 0,
        text: "テストテキスト",
        sourceUrl: "http://example.com/1",
      },
    ];

    const mockEmbeddings: EmbeddingRecord[] = [
      { chunkId: 1, embedding: [0.1, 0.2, 0.3] },
    ];

    vi.mocked(mockSpeechesRepo.getAllChunks).mockResolvedValue(mockChunks);
    vi.mocked(mockEmbeddingsRepo.getAllEmbeddings).mockResolvedValue(
      mockEmbeddings
    );
    vi.mocked(mockHighlightsRepo.clear).mockResolvedValue();
    vi.mocked(mockHighlightsRepo.upsert).mockResolvedValue();

    await updateHighlights(
      mockSpeechesRepo,
      mockHighlightsRepo,
      mockEmbeddingsRepo
    );

    expect(mockHighlightsRepo.clear).toHaveBeenCalledOnce();
    expect(mockHighlightsRepo.upsert).toHaveBeenCalledOnce();
  });
});
