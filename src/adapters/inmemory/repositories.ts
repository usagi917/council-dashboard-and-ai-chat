import type {
  SpeechesRepo,
  HighlightsRepo,
  SnsRepo,
  PaginatedResult,
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
}

export class InMemoryHighlightsRepo implements HighlightsRepo {
  async list(): Promise<Highlight[]> {
    return [...highlights];
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
