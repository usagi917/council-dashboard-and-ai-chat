export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      speeches: {
        Row: {
          id: number;
          date: string;
          session: string;
          speaker: string;
          content: string;
          source_url: string;
        };
        Insert: {
          id?: number;
          date: string;
          session: string;
          speaker: string;
          content: string;
          source_url: string;
        };
        Update: {
          id?: number;
          date?: string;
          session?: string;
          speaker?: string;
          content?: string;
          source_url?: string;
        };
        Relationships: [];
      };
      speech_chunks: {
        Row: {
          id: number;
          speech_id: number;
          idx: number;
          text: string;
          source_url: string;
        };
        Insert: {
          id?: number;
          speech_id: number;
          idx: number;
          text: string;
          source_url: string;
        };
        Update: {
          id?: number;
          speech_id?: number;
          idx?: number;
          text?: string;
          source_url?: string;
        };
        Relationships: [
          {
            foreignKeyName: "speech_chunks_speech_id_fkey";
            columns: ["speech_id"];
            isOneToOne: false;
            referencedRelation: "speeches";
            referencedColumns: ["id"];
          },
        ];
      };
      speech_embeddings: {
        Row: {
          chunk_id: number;
          embedding: number[]; // VECTOR type becomes number[] in TypeScript
        };
        Insert: {
          chunk_id: number;
          embedding: number[];
        };
        Update: {
          chunk_id?: number;
          embedding?: number[];
        };
        Relationships: [
          {
            foreignKeyName: "speech_embeddings_chunk_id_fkey";
            columns: ["chunk_id"];
            isOneToOne: true;
            referencedRelation: "speech_chunks";
            referencedColumns: ["id"];
          },
        ];
      };
      sns_posts: {
        Row: {
          id: number;
          platform: string;
          post_date: string;
          content: string | null;
          media_url: string | null;
          post_url: string;
        };
        Insert: {
          id?: number;
          platform: string;
          post_date: string;
          content?: string | null;
          media_url?: string | null;
          post_url: string;
        };
        Update: {
          id?: number;
          platform?: string;
          post_date?: string;
          content?: string | null;
          media_url?: string | null;
          post_url?: string;
        };
        Relationships: [];
      };
      highlights: {
        Row: {
          cluster_label: string;
          count: number;
          sample_chunk_id: number;
        };
        Insert: {
          cluster_label: string;
          count: number;
          sample_chunk_id: number;
        };
        Update: {
          cluster_label?: string;
          count?: number;
          sample_chunk_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: "highlights_sample_chunk_id_fkey";
            columns: ["sample_chunk_id"];
            isOneToOne: false;
            referencedRelation: "speech_chunks";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      match_speech_chunks: {
        Args: {
          query_embedding: number[];
          match_count?: number;
          match_threshold?: number;
        };
        Returns: {
          chunk_id: number;
          similarity: number;
        }[];
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
