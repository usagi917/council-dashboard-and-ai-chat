import { describe, test, expect } from "vitest";
import type { VectorSearch, SimilarityResult } from "../vector";

// テスト用のモック実装
class MockVectorSearch implements VectorSearch {
  private vectors = new Map<number, number[]>();

  async upsert(chunkId: number, embedding: number[]): Promise<void> {
    this.vectors.set(chunkId, embedding);
  }

  async querySimilar(text: string, k: number): Promise<SimilarityResult[]> {
    // 簡易的なモック実装：固定結果を返す
    return [
      { chunkId: 1, score: 0.9 },
      { chunkId: 2, score: 0.8 },
    ].slice(0, k);
  }
}

describe("VectorSearch Port Contract", () => {
  test("upsert should store embedding vector", async () => {
    const vectorSearch = new MockVectorSearch();
    const embedding = [0.1, 0.2, 0.3];

    await expect(vectorSearch.upsert(1, embedding)).resolves.toBeUndefined();
  });

  test("querySimilar should return similarity results with chunkId and score", async () => {
    const vectorSearch = new MockVectorSearch();

    const results = await vectorSearch.querySimilar("test query", 2);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ chunkId: 1, score: 0.9 });
    expect(results[1]).toEqual({ chunkId: 2, score: 0.8 });
  });

  test("querySimilar should respect k parameter", async () => {
    const vectorSearch = new MockVectorSearch();

    const results = await vectorSearch.querySimilar("test query", 1);

    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({ chunkId: 1, score: 0.9 });
  });

  test("SimilarityResult should have correct structure", () => {
    const result: SimilarityResult = { chunkId: 42, score: 0.95 };

    expect(typeof result.chunkId).toBe("number");
    expect(typeof result.score).toBe("number");
    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(1);
  });
});
