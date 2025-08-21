import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
import type { VectorSearch, SimilarityResult } from "../../ports/vector";
import type { EmbeddingClient } from "../../ai/embeddings";

/**
 * Supabase + pgvector を使ったベクター検索実装
 */
export class SupabaseVectorSearch implements VectorSearch {
  constructor(
    private client: SupabaseClient<Database>,
    private embeddingClient: EmbeddingClient
  ) {}

  async upsert(chunkId: number, embedding: number[]): Promise<void> {
    const { error } = await this.client.from("speech_embeddings").upsert({
      chunk_id: chunkId,
      embedding: embedding,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async querySimilar(text: string, k: number): Promise<SimilarityResult[]> {
    // Generate embedding for query text
    const queryEmbedding = await this.embeddingClient.embed(text);

    // Use Supabase RPC function for similarity search
    // This function should be created in the database
    const { data, error } = await this.client.rpc("match_speech_chunks", {
      query_embedding: queryEmbedding,
      match_count: k,
      match_threshold: 0.1, // Minimum similarity threshold
    });

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      return [];
    }

    // Transform results to match interface
    return data.map((row: any) => ({
      chunkId: row.chunk_id,
      score: row.similarity,
    }));
  }
}
