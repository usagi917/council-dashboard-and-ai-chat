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
  private speeches: Speech[];
  private chunks: SpeechChunk[];
  private nextSpeechId: number;
  private nextChunkId: number;

  constructor(withFixtures = true) {
    if (withFixtures) {
      this.speeches = [...speeches];
      this.chunks = [...speechChunks];
      this.nextSpeechId = Math.max(...speeches.map((s) => s.id), 0) + 1;
      this.nextChunkId = Math.max(...speechChunks.map((c) => c.id), 0) + 1;
    } else {
      this.speeches = [];
      this.chunks = [];
      this.nextSpeechId = 1;
      this.nextChunkId = 1;
    }
  }

  async list(page: number, size: number): Promise<PaginatedResult<Speech>> {
    const startIndex = (page - 1) * size;
    const endIndex = startIndex + size;

    const items = this.speeches.slice(startIndex, endIndex);

    return {
      items,
      total: this.speeches.length,
    };
  }

  async getChunksByIds(ids: number[]): Promise<SpeechChunk[]> {
    return this.chunks.filter((chunk) => ids.includes(chunk.id));
  }

  async getAllChunks(): Promise<SpeechChunk[]> {
    return [...this.chunks];
  }

  async insertSpeech(speech: Speech): Promise<number> {
    const newSpeech: Speech = {
      ...speech,
      id: this.nextSpeechId,
    };

    this.speeches.push(newSpeech);
    const insertedId = this.nextSpeechId;
    this.nextSpeechId++;

    return insertedId;
  }

  async insertChunk(chunk: SpeechChunk): Promise<void> {
    const newChunk: SpeechChunk = {
      ...chunk,
      id: this.nextChunkId,
    };

    this.chunks.push(newChunk);
    this.nextChunkId++;
  }

  async updateSpeech(speech: Speech): Promise<void> {
    const index = this.speeches.findIndex((s) => s.id === speech.id);
    if (index >= 0) {
      this.speeches[index] = speech;
    }
  }

  async deleteSpeech(id: number): Promise<void> {
    const index = this.speeches.findIndex((s) => s.id === id);
    if (index >= 0) {
      this.speeches.splice(index, 1);
    }

    // Also delete associated chunks
    this.chunks = this.chunks.filter((c) => c.speechId !== id);
  }
}

export class InMemoryHighlightsRepo implements HighlightsRepo {
  private highlights: Highlight[];

  constructor(withFixtures = true) {
    if (withFixtures) {
      this.highlights = [...highlights];
    } else {
      this.highlights = [];
    }
  }

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
  private embeddings: EmbeddingRecord[];

  constructor(withFixtures = true) {
    if (withFixtures) {
      this.embeddings = [
        // Mock embeddings for testing
        { chunkId: 1, embedding: [0.1, 0.2, 0.3] },
        { chunkId: 2, embedding: [0.2, 0.3, 0.4] },
        { chunkId: 3, embedding: [0.9, 0.8, 0.7] },
      ];
    } else {
      this.embeddings = [];
    }
  }

  async getAllEmbeddings(): Promise<EmbeddingRecord[]> {
    return [...this.embeddings];
  }
}

export function createInMemoryRepositories(withFixtures = true) {
  return {
    speechesRepo: new InMemorySpeechesRepo(withFixtures),
    highlightsRepo: new InMemoryHighlightsRepo(withFixtures),
    snsRepo: new InMemorySnsRepo(),
    embeddingsRepo: new InMemoryEmbeddingsRepo(withFixtures),
  };
}
