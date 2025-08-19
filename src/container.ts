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
import type { VectorSearch } from "./ports/vector";
import { InMemoryVectorSearch } from "./adapters/inmemory/vector";
import { EmbeddingClient } from "./ai/embeddings";
import OpenAI from "openai";

export interface Container {
  speeches: SpeechesRepo;
  highlights: HighlightsRepo;
  sns: SnsRepo;
}

let container: Container | null = null;

export function getRepos(): Container {
  if (!container) {
    container = {
      speeches: new InMemorySpeechesRepo(),
      highlights: new InMemoryHighlightsRepo(),
      sns: new InMemorySnsRepo(),
    };
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
  const embeddingClient = getEmbeddingClient();
  return new InMemoryVectorSearch(embeddingClient);
}

export function getEmbeddingClient(): EmbeddingClient {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  return new EmbeddingClient(openai);
}
