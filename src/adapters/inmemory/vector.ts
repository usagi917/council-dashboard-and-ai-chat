import type { VectorSearch, SimilarityResult } from "../../ports/vector";
import type { EmbeddingClient } from "../../ai/embeddings";

/**
 * インメモリベクター検索実装
 * テスト・開発用の簡易実装
 */
export class InMemoryVectorSearch implements VectorSearch {
  private vectors = new Map<number, number[]>();

  constructor(private readonly embeddingClient: EmbeddingClient) {}

  async upsert(chunkId: number, embedding: number[]): Promise<void> {
    this.vectors.set(chunkId, embedding);
  }

  async querySimilar(text: string, k: number): Promise<SimilarityResult[]> {
    if (this.vectors.size === 0) {
      return [];
    }

    // クエリテキストを埋め込みベクターに変換
    const queryVector = await this.embeddingClient.embed(text);

    // 全ベクターとの類似度を計算
    const similarities: SimilarityResult[] = [];

    for (const [chunkId, vector] of this.vectors) {
      const score = this.cosineSimilarity(queryVector, vector);
      similarities.push({ chunkId, score });
    }

    // スコア降順でソート、k件取得
    return similarities.sort((a, b) => b.score - a.score).slice(0, k);
  }

  /**
   * コサイン類似度を計算
   * @param a ベクターA
   * @param b ベクターB
   * @returns 類似度（-1から1、1に近いほど類似）
   */
  private cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error(`Vector dimensions mismatch: ${a.length} vs ${b.length}`);
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      dotProduct += a[i] * b[i];
      normA += a[i] * a[i];
      normB += b[i] * b[i];
    }

    const denominator = Math.sqrt(normA) * Math.sqrt(normB);

    if (denominator === 0) {
      return 0; // ゼロベクターの場合
    }

    return dotProduct / denominator;
  }
}
