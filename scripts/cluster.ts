#!/usr/bin/env tsx

import type { SpeechChunk, Highlight } from "../src/domain/types";
import type {
  SpeechesRepo,
  HighlightsRepo,
  EmbeddingsRepo,
} from "../src/ports/repositories";
import { kmeans, generateClusterLabel } from "../src/ai/cluster";
import { getRepositories } from "../src/container";

export interface ClusterOptions {
  k?: number;
  seed?: number;
}

/**
 * Update highlights table based on clustering of embeddings
 */
export async function updateHighlights(
  speechesRepo: SpeechesRepo,
  highlightsRepo: HighlightsRepo,
  embeddingsRepo: EmbeddingsRepo,
  options: ClusterOptions = {}
): Promise<void> {
  const { k = 6, seed = 42 } = options;

  console.log(`Starting clustering with k=${k}, seed=${seed}`);

  // Get all chunks and embeddings
  const [chunks, embeddings] = await Promise.all([
    speechesRepo.getAllChunks(),
    embeddingsRepo.getAllEmbeddings(),
  ]);

  console.log(
    `Found ${chunks.length} chunks and ${embeddings.length} embeddings`
  );

  if (chunks.length === 0 || embeddings.length === 0) {
    console.log("No data to cluster. Clearing highlights table.");
    await highlightsRepo.clear();
    return;
  }

  // Create maps for lookup
  const chunkMap = new Map<number, SpeechChunk>();
  chunks.forEach((chunk) => chunkMap.set(chunk.id, chunk));

  const embeddingMap = new Map<number, number[]>();
  embeddings.forEach((emb) => embeddingMap.set(emb.chunkId, emb.embedding));

  // Filter to only chunks that have embeddings
  const chunksWithEmbeddings = chunks.filter((chunk) =>
    embeddingMap.has(chunk.id)
  );
  const vectors = chunksWithEmbeddings.map(
    (chunk) => embeddingMap.get(chunk.id)!
  );

  console.log(
    `Clustering ${chunksWithEmbeddings.length} chunks with embeddings`
  );

  if (chunksWithEmbeddings.length === 0) {
    console.log("No chunks with embeddings found. Clearing highlights table.");
    await highlightsRepo.clear();
    return;
  }

  // Perform clustering
  const { labels } = kmeans(vectors, k, seed);

  // Group chunks by cluster
  const clusters = new Map<number, SpeechChunk[]>();
  chunksWithEmbeddings.forEach((chunk, index) => {
    const label = labels[index];
    if (!clusters.has(label)) {
      clusters.set(label, []);
    }
    clusters.get(label)!.push(chunk);
  });

  console.log(`Generated ${clusters.size} clusters`);

  // Clear existing highlights
  await highlightsRepo.clear();

  // Generate highlights for each cluster
  for (const [label, clusterChunks] of clusters.entries()) {
    const clusterTexts = clusterChunks.map((chunk) => chunk.text);
    const clusterLabel = generateClusterLabel(clusterTexts);

    // Choose a representative chunk (first one for now)
    const sampleChunk = clusterChunks[0];

    const highlight: Highlight = {
      clusterLabel,
      count: clusterChunks.length,
      sampleChunkId: sampleChunk.id,
    };

    await highlightsRepo.upsert(highlight);

    console.log(
      `Created highlight: "${clusterLabel}" (${clusterChunks.length} chunks)`
    );
  }

  console.log("Clustering complete!");
}

// CLI execution
async function main() {
  try {
    console.log("=== クラスタリングスクリプト開始 ===");

    // 環境変数チェック（Supabaseを使う場合）
    if (process.env.USE_SUPABASE === "true") {
      const requiredEnvVars = [
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
    }

    const args = process.argv.slice(2);
    const k = args.includes("--k")
      ? parseInt(args[args.indexOf("--k") + 1])
      : 6;
    const seed = args.includes("--seed")
      ? parseInt(args[args.indexOf("--seed") + 1])
      : 42;

    console.log(`📊 クラスタリング設定: k=${k}, seed=${seed}`);

    const { speechesRepo, highlightsRepo, embeddingsRepo } = getRepositories();
    await updateHighlights(speechesRepo, highlightsRepo, embeddingsRepo, {
      k,
      seed,
    });

    console.log("");
    console.log("🎉 クラスタリングが完了しました!");
    console.log("");
    console.log("💡 次のステップ:");
    console.log("   ホームページで更新されたハイライトを確認してください");
  } catch (error) {
    console.error("❌ クラスタリングスクリプトでエラーが発生しました:", error);
    console.error("");
    console.error("🔍 トラブルシューティング:");
    console.error(
      "  1. 事前に埋め込みデータが生成されているか確認 (pnpm embed)"
    );
    console.error("  2. データベース接続が正常か確認");
    console.error("  3. 環境変数が正しく設定されているか確認");
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
