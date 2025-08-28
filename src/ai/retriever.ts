import { SpeechChunk } from "../domain/types";
import { SpeechesRepo } from "../ports/repositories";
import { VectorSearch } from "../ports/vector";
// Note: Embedding calculation is delegated to the VectorSearch implementation.

export interface RetrievedChunk {
  chunk: SpeechChunk;
}

export async function retrieve(
  question: string,
  k: number,
  vectorSearch: VectorSearch,
  speechesRepo: SpeechesRepo
): Promise<RetrievedChunk[]> {
  // Find similar chunks
  const similarChunks = await vectorSearch.querySimilar(question, k);

  if (similarChunks.length === 0) {
    return [];
  }

  // Get chunk details from repository
  const chunkIds = similarChunks.map((result) => result.chunkId);
  const chunks = await speechesRepo.getChunksByIds(chunkIds);

  // Return chunks wrapped in RetrievedChunk interface
  return chunks.map((chunk) => ({ chunk }));
}
