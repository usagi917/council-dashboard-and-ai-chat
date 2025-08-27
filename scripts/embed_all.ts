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
    console.log("=== 埋め込み生成スクリプト開始 ===");

    // 環境変数チェック
    const requiredEnvVars = [
      "OPENAI_API_KEY",
      "NEXT_PUBLIC_SUPABASE_URL",
      "SUPABASE_SERVICE_ROLE_KEY",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      console.error("❌ 必要な環境変数が設定されていません:");
      missingEnvVars.forEach((varName) => {
        console.error(`  - ${varName}`);
      });
      console.error("");
      console.error("💡 .env.localファイルを確認してください");
      process.exit(1);
    }

    // Supabaseを強制的に使用
    process.env.USE_SUPABASE = "true";

    // 動的インポート（Node.jsランタイム対応）
    const { getRepositories, getVectorSearch, getEmbeddingClient } =
      await import("../src/container");

    const { speechesRepo } = getRepositories();
    const vectorSearch = getVectorSearch();
    const embeddingClient = getEmbeddingClient();

    console.log("📊 既存のチャンクを検索中...");
    const allChunks = await speechesRepo.getAllChunks();

    if (allChunks.length === 0) {
      console.log("⚠️  処理対象のチャンクがありません");
      console.log("💡 先に `pnpm ingest ./fixtures` を実行してください");
      return;
    }

    console.log(`✅ ${allChunks.length}件のチャンクが見つかりました`);

    const config: EmbeddingConfig = {
      rateLimitMs: 1000, // OpenAI rate limit対策（1秒間隔）
      batchSize: 10, // メモリ使用量を管理
    };

    const processor = new EmbeddingProcessor(
      speechesRepo,
      vectorSearch,
      embeddingClient,
      config
    );

    const chunkIds = allChunks.map((chunk) => chunk.id);

    console.log("🚀 埋め込み生成を開始します...");
    console.log(
      `📝 設定: レート制限=${config.rateLimitMs}ms, バッチサイズ=${config.batchSize}`
    );
    console.log("");

    const startTime = Date.now();

    await processor.processAllChunks(chunkIds, (progress) => {
      const percent = Math.round((progress.processed / progress.total) * 100);
      console.log(
        `⏳ 進捗: ${progress.processed}/${progress.total} (${percent}%) - チャンクID: ${progress.currentChunkId}`
      );
    });

    const endTime = Date.now();
    const duration = Math.round((endTime - startTime) / 1000);

    console.log("");
    console.log("🎉 埋め込み生成が完了しました!");
    console.log(`⏱️  処理時間: ${duration}秒`);
    console.log(`📊 処理済み: ${chunkIds.length}チャンク`);
    console.log("");
    console.log("💡 次のステップ:");
    console.log("   pnpm tsx scripts/cluster.ts でクラスタリングを実行");
  } catch (error) {
    console.error("❌ embed_allスクリプトでエラーが発生しました:", error);
    console.error("");
    console.error("🔍 トラブルシューティング:");
    console.error("  1. 環境変数が正しく設定されているか確認");
    console.error("  2. Supabaseデータベースが利用可能か確認");
    console.error("  3. OpenAI APIキーが有効か確認");
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
