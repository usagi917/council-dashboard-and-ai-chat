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
