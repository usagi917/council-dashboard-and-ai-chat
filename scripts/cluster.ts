#!/usr/bin/env node

import type { SpeechChunk, Highlight } from "../src/domain/types";
import type {
  SpeechesRepo,
  HighlightsRepo,
  EmbeddingsRepo,
} from "../src/ports/repositories";
import { kmeans, generateClusterLabel } from "../src/ai/cluster";
import { getRepos } from "../src/container";

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
  const args = process.argv.slice(2);
  const k = args.includes("--k") ? parseInt(args[args.indexOf("--k") + 1]) : 6;
  const seed = args.includes("--seed")
    ? parseInt(args[args.indexOf("--seed") + 1])
    : 42;

  try {
    const repos = getRepos();
    await updateHighlights(repos.speeches, repos.highlights, repos.embeddings, {
      k,
      seed,
    });
  } catch (error) {
    console.error("Error during clustering:", error);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}
