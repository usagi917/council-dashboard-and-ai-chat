import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";
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

// Transform DB rows to domain types
function speechRowToSpeech(
  row: Database["public"]["Tables"]["speeches"]["Row"]
): Speech {
  return {
    id: row.id,
    date: new Date(row.date),
    session: row.session,
    speaker: row.speaker,
    content: row.content,
    sourceUrl: row.source_url,
  };
}

function chunkRowToSpeechChunk(
  row: Database["public"]["Tables"]["speech_chunks"]["Row"]
): SpeechChunk {
  return {
    id: row.id,
    speechId: row.speech_id,
    idx: row.idx,
    text: row.text,
    sourceUrl: row.source_url,
  };
}

function highlightRowToHighlight(
  row: Database["public"]["Tables"]["highlights"]["Row"]
): Highlight {
  return {
    clusterLabel: row.cluster_label,
    count: row.count,
    sampleChunkId: row.sample_chunk_id,
  };
}

function snsPostRowToSnsPost(
  row: Database["public"]["Tables"]["sns_posts"]["Row"]
): SnsPost {
  return {
    id: row.id,
    platform: row.platform,
    postDate: new Date(row.post_date),
    content: row.content || undefined,
    mediaUrl: row.media_url || undefined,
    postUrl: row.post_url,
  };
}

export class SupabaseSpeechesRepo implements SpeechesRepo {
  constructor(private client: SupabaseClient<Database>) {}

  async list(page: number, size: number): Promise<PaginatedResult<Speech>> {
    // Calculate offset for pagination
    const offset = (page - 1) * size;

    // Fetch speeches with pagination
    const { data: speeches, error: speechError } = await this.client
      .from("speeches")
      .select("*")
      .order("date", { ascending: false })
      .range(offset, offset + size - 1);

    if (speechError) {
      throw new Error(speechError.message);
    }

    // Get total count
    const { data: countData, error: countError } = await this.client
      .from("speeches")
      .select("count(*)");

    if (countError) {
      throw new Error(countError.message);
    }

    const total = (countData as any)?.[0]?.count ?? 0;

    return {
      items: (speeches || []).map(speechRowToSpeech),
      total,
    };
  }

  async getChunksByIds(ids: number[]): Promise<SpeechChunk[]> {
    if (ids.length === 0) {
      return [];
    }

    const { data, error } = await this.client
      .from("speech_chunks")
      .select("*")
      .in("id", ids);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(chunkRowToSpeechChunk);
  }

  async getAllChunks(): Promise<SpeechChunk[]> {
    const { data, error } = await this.client
      .from("speech_chunks")
      .select("*")
      .order("id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(chunkRowToSpeechChunk);
  }

  async insertSpeech(speech: Speech): Promise<number> {
    const { data, error } = await this.client
      .from("speeches")
      .insert({
        date: speech.date.toISOString().split("T")[0],
        session: speech.session,
        speaker: speech.speaker,
        content: speech.content,
        source_url: speech.sourceUrl,
      })
      .select("id")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data.id;
  }

  async insertChunk(chunk: SpeechChunk): Promise<void> {
    const { error } = await this.client.from("speech_chunks").insert({
      speech_id: chunk.speechId,
      idx: chunk.idx,
      text: chunk.text,
      source_url: chunk.sourceUrl,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async updateSpeech(speech: Speech): Promise<void> {
    const { error } = await this.client
      .from("speeches")
      .update({
        date: speech.date.toISOString().split("T")[0],
        session: speech.session,
        speaker: speech.speaker,
        content: speech.content,
        source_url: speech.sourceUrl,
      })
      .eq("id", speech.id);

    if (error) {
      throw new Error(error.message);
    }
  }

  async deleteSpeech(id: number): Promise<void> {
    // First delete associated chunks
    const { error: chunkError } = await this.client
      .from("speech_chunks")
      .delete()
      .eq("speech_id", id);

    if (chunkError) {
      throw new Error(chunkError.message);
    }

    // Then delete the speech
    const { error } = await this.client.from("speeches").delete().eq("id", id);

    if (error) {
      throw new Error(error.message);
    }
  }
}

export class SupabaseHighlightsRepo implements HighlightsRepo {
  constructor(private client: SupabaseClient<Database>) {}

  async list(): Promise<Highlight[]> {
    const { data, error } = await this.client
      .from("highlights")
      .select("*")
      .order("count", { ascending: false });

    if (error) {
      const msg = error.message || "";
      const code = (error as any).code as string | undefined;

      // Gracefully handle missing table / schema cache cases
      // Common patterns:
      // - PostgREST: "Could not find the table 'public.highlights' in the schema cache"
      // - Postgres: code 42P01 (undefined_table)
      if (
        msg.includes("schema cache") ||
        msg.includes("Could not find the table") ||
        (code && code === "42P01")
      ) {
        console.warn(
          "[SupabaseHighlightsRepo] 'highlights' table is missing or not accessible. Returning empty list. Run 'pnpm migrate' then 'pnpm setup-db' to create required tables."
        );
        return [];
      }

      throw new Error(error.message);
    }

    return (data || []).map(highlightRowToHighlight);
  }

  async upsert(highlight: Highlight): Promise<void> {
    const { error } = await this.client.from("highlights").upsert({
      cluster_label: highlight.clusterLabel,
      count: highlight.count,
      sample_chunk_id: highlight.sampleChunkId,
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  async clear(): Promise<void> {
    const { error } = await this.client
      .from("highlights")
      .delete()
      .neq("cluster_label", ""); // Delete all rows

    if (error) {
      const msg = error.message || "";
      const code = (error as any).code as string | undefined;
      if (
        msg.includes("schema cache") ||
        msg.includes("Could not find the table") ||
        (code && code === "42P01")
      ) {
        console.warn(
          "[SupabaseHighlightsRepo] 'highlights' table is missing during clear(); treating as no-op."
        );
        return; // treat clear as no-op if table doesn't exist
      }
      throw new Error(error.message);
    }
  }
}

export class SupabaseSnsRepo implements SnsRepo {
  constructor(private client: SupabaseClient<Database>) {}

  async latest(n: number): Promise<SnsPost[]> {
    const { data, error } = await this.client
      .from("sns_posts")
      .select("*")
      .order("post_date", { ascending: false })
      .limit(n);

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(snsPostRowToSnsPost);
  }
}

export class SupabaseEmbeddingsRepo implements EmbeddingsRepo {
  constructor(private client: SupabaseClient<Database>) {}

  async getAllEmbeddings(): Promise<EmbeddingRecord[]> {
    const { data, error } = await this.client
      .from("speech_embeddings")
      .select("chunk_id, embedding")
      .order("chunk_id", { ascending: true });

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map((row) => ({
      chunkId: row.chunk_id,
      embedding: row.embedding as number[],
    }));
  }
}
