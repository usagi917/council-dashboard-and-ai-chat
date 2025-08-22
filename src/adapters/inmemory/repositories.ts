import type {
  SpeechesRepo,
  HighlightsRepo,
  SnsRepo,
  EmbeddingsRepo,
  PaginatedResult,
  EmbeddingRecord,
} from "../../ports/repositories";
import type {
  Speech,
  SpeechChunk,
  Highlight,
  SnsPost,
} from "../../domain/types";
import { speeches, speechChunks, highlights, snsPosts } from "./fixtures";

export class InMemorySpeechesRepo implements SpeechesRepo {
  async list(page: number, size: number): Promise<PaginatedResult<Speech>> {
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    const items = speeches.slice(startIndex, endIndex);

    return {
      items,
      total: speeches.length,
    };
  }

  async getChunksByIds(ids: number[]): Promise<SpeechChunk[]> {
    return speechChunks.filter((chunk) => ids.includes(chunk.id));
  }

  async getAllChunks(): Promise<SpeechChunk[]> {
    return [...speechChunks];
  }
}

export class InMemoryHighlightsRepo implements HighlightsRepo {
  private highlights: Highlight[] = [...highlights];

  async list(): Promise<Highlight[]> {
    return [...this.highlights];
  }

  async upsert(highlight: Highlight): Promise<void> {
    const existingIndex = this.highlights.findIndex(
      (h) => h.clusterLabel === highlight.clusterLabel
    );

    if (existingIndex >= 0) {
      this.highlights[existingIndex] = highlight;
    } else {
      this.highlights.push(highlight);
    }
  }

  async clear(): Promise<void> {
    this.highlights = [];
  }
}

export class InMemorySnsRepo implements SnsRepo {
  async latest(n: number): Promise<SnsPost[]> {
    if (n <= 0) return [];

    // Sort by postDate descending and take n items
    return snsPosts
      .sort((a, b) => b.postDate.getTime() - a.postDate.getTime())
      .slice(0, n);
  }
}

export class InMemoryEmbeddingsRepo implements EmbeddingsRepo {
  private embeddings: EmbeddingRecord[] = [
    // Mock embeddings for testing
    { chunkId: 1, embedding: [0.1, 0.2, 0.3] },
    { chunkId: 2, embedding: [0.2, 0.3, 0.4] },
    { chunkId: 3, embedding: [0.9, 0.8, 0.7] },
  ];

  async getAllEmbeddings(): Promise<EmbeddingRecord[]> {
    return [...this.embeddings];
  }
}
