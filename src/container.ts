import type {
  SpeechesRepo,
  HighlightsRepo,
  SnsRepo,
} from "./ports/repositories";
import {
  InMemorySpeechesRepo,
  InMemoryHighlightsRepo,
  InMemorySnsRepo,
} from "./adapters/inmemory/repositories";
import {
  SupabaseSpeechesRepo,
  SupabaseHighlightsRepo,
  SupabaseSnsRepo,
} from "./adapters/supabase/repositories";
import type { VectorSearch } from "./ports/vector";
import { InMemoryVectorSearch } from "./adapters/inmemory/vector";
import { SupabaseVectorSearch } from "./adapters/supabase/vector";
import { createServerClient } from "./adapters/supabase/client";
import { EmbeddingClient } from "./ai/embeddings";
import OpenAI from "openai";

export interface Container {
  speeches: SpeechesRepo;
  highlights: HighlightsRepo;
  sns: SnsRepo;
}

let container: Container | null = null;
let vectorSearch: VectorSearch | null = null;

/**
 * コンテナをクリア（テスト用）
 */
export function clearContainer(): void {
  container = null;
  vectorSearch = null;
}

/**
 * 環境変数に基づいてSupabaseを使用するかどうかを判定
 */
function shouldUseSupabase(): boolean {
  return process.env.USE_SUPABASE === "true";
}

export function getRepos(): Container {
  if (!container) {
    if (shouldUseSupabase()) {
      // Supabase implementation
      const client = createServerClient();
      container = {
        speeches: new SupabaseSpeechesRepo(client),
        highlights: new SupabaseHighlightsRepo(client),
        sns: new SupabaseSnsRepo(client),
      };
    } else {
      // InMemory implementation (default)
      container = {
        speeches: new InMemorySpeechesRepo(),
        highlights: new InMemoryHighlightsRepo(),
        sns: new InMemorySnsRepo(),
      };
    }
  }

  return container;
}

export function getRepositories() {
  const repos = getRepos();
  return {
    speechesRepo: repos.speeches,
    highlightsRepo: repos.highlights,
    snsRepo: repos.sns,
  };
}

export function getVectorSearch(): VectorSearch {
  if (!vectorSearch) {
    const embeddingClient = getEmbeddingClient();

    if (shouldUseSupabase()) {
      // Supabase implementation
      const client = createServerClient();
      vectorSearch = new SupabaseVectorSearch(client, embeddingClient);
    } else {
      // InMemory implementation (default)
      vectorSearch = new InMemoryVectorSearch(embeddingClient);
    }
  }

  return vectorSearch;
}

export function getEmbeddingClient(): EmbeddingClient {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing required environment variable: OPENAI_API_KEY");
  }

  const openai = new OpenAI({
    apiKey: apiKey,
  });
  return new EmbeddingClient(openai);
}
