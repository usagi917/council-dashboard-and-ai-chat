#!/usr/bin/env tsx

import type { SpeechesRepo } from "../src/ports/repositories";
import type { VectorSearch } from "../src/ports/vector";
import type { EmbeddingClient } from "../src/ai/embeddings";

/**
 * 埋め込み処理の進捗状況
 */
export interface EmbeddingProgress {
  processed: number;
  total: number;
  currentChunkId: number;
}

/**
 * 埋め込み処理の設定
 */
export interface EmbeddingConfig {
  /** レート制限（ミリ秒） */
  rateLimitMs: number;
  /** バッチサイズ */
  batchSize: number;
}

/**
 * 埋め込み生成と保存を行うプロセッサー
 */
export class EmbeddingProcessor {
  constructor(
    private speechesRepo: SpeechesRepo,
    private vectorSearch: VectorSearch,
    private embeddingClient: EmbeddingClient,
    private config: EmbeddingConfig
  ) {}

  /**
   * 指定されたチャンクIDsの埋め込みを生成・保存
   */
  async processAllChunks(
    chunkIds: number[],
    onProgress?: (progress: EmbeddingProgress) => void
  ): Promise<void> {
    if (chunkIds.length === 0) {
      return;
    }

    console.log(
      `Starting embedding generation for ${chunkIds.length} chunks...`
    );

    let processed = 0;
    const total = chunkIds.length;

    // Process in batches to manage memory and respect rate limits
    for (let i = 0; i < chunkIds.length; i += this.config.batchSize) {
      const batchIds = chunkIds.slice(i, i + this.config.batchSize);

      try {
        // Fetch chunk data
        const chunks = await this.speechesRepo.getChunksByIds(batchIds);

        // Process each chunk in the batch
        for (const chunk of chunks) {
          try {
            // Generate embedding
            const embedding = await this.embeddingClient.embed(chunk.text);

            // Store embedding
            await this.vectorSearch.upsert(chunk.id, embedding);

            processed++;

            // Report progress
            if (onProgress) {
              onProgress({
                processed,
                total,
                currentChunkId: chunk.id,
              });
            }

            console.log(`Processed chunk ${chunk.id} (${processed}/${total})`);
          } catch (error) {
            console.error(`Failed to process chunk ${chunk.id}:`, error);
            // Continue processing other chunks
          }

          // Rate limiting
          if (this.config.rateLimitMs > 0) {
            await new Promise((resolve) =>
              setTimeout(resolve, this.config.rateLimitMs)
            );
          }
        }
      } catch (error) {
        console.error(
          `Failed to fetch batch ${i}-${i + this.config.batchSize}:`,
          error
        );
      }
    }

    console.log(
      `Embedding generation completed. Processed ${processed}/${total} chunks.`
    );
  }
}

/**
 * すべての speech_chunks の埋め込みを生成
 * 使用例: pnpm tsx scripts/embed_all.ts
 */
async function main() {
  try {
    // This is a placeholder - in real usage, these would be injected
    // based on environment variables or command line arguments

    console.log("embed_all.ts script - placeholder implementation");
    console.log("In actual usage, this would:");
    console.log("1. Initialize Supabase client and repositories");
    console.log("2. Initialize OpenAI embedding client");
    console.log("3. Fetch all speech_chunk IDs from database");
    console.log("4. Process embeddings with rate limiting");
    console.log("");
    console.log("Environment variables required:");
    console.log("- OPENAI_API_KEY");
    console.log("- NEXT_PUBLIC_SUPABASE_URL");
    console.log("- SUPABASE_SERVICE_ROLE_KEY");
    console.log("");
    console.log("Usage: pnpm tsx scripts/embed_all.ts");
  } catch (error) {
    console.error("Error running embed_all script:", error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
