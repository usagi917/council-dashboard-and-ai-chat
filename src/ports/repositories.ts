import type { Speech, SpeechChunk, Highlight, SnsPost } from "../domain/types";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface SpeechesRepo {
  list(page: number, size: number): Promise<PaginatedResult<Speech>>;
  getChunksByIds(ids: number[]): Promise<SpeechChunk[]>;
  getAllChunks(): Promise<SpeechChunk[]>;
}

export interface HighlightsRepo {
  list(): Promise<Highlight[]>;
  upsert(highlight: Highlight): Promise<void>;
  clear(): Promise<void>;
}

export interface SnsRepo {
  latest(n: number): Promise<SnsPost[]>;
}

export interface EmbeddingRecord {
  chunkId: number;
  embedding: number[];
}

export interface EmbeddingsRepo {
  getAllEmbeddings(): Promise<EmbeddingRecord[]>;
}
