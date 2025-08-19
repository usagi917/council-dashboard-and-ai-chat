import type { Speech, SpeechChunk, Highlight, SnsPost } from "../domain/types";

export interface PaginatedResult<T> {
  items: T[];
  total: number;
}

export interface SpeechesRepo {
  list(page: number, size: number): Promise<PaginatedResult<Speech>>;
  getChunksByIds(ids: number[]): Promise<SpeechChunk[]>;
}

export interface HighlightsRepo {
  list(): Promise<Highlight[]>;
}

export interface SnsRepo {
  latest(n: number): Promise<SnsPost[]>;
}
