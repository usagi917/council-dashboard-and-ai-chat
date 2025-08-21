-- Enable pgvector extension for embedding storage
CREATE EXTENSION IF NOT EXISTS vector;

-- speeches table: メタデータとフル発言内容
CREATE TABLE IF NOT EXISTS speeches (
  id BIGSERIAL PRIMARY KEY,
  date DATE NOT NULL,
  session TEXT NOT NULL,
  speaker TEXT NOT NULL,
  content TEXT NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- speech_chunks table: RAG用のテキストチャンク
CREATE TABLE IF NOT EXISTS speech_chunks (
  id BIGSERIAL PRIMARY KEY,
  speech_id BIGINT NOT NULL REFERENCES speeches(id) ON DELETE CASCADE,
  idx INTEGER NOT NULL,
  text TEXT NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(speech_id, idx)
);

-- speech_embeddings table: pgvectorで3072次元ベクター保存
CREATE TABLE IF NOT EXISTS speech_embeddings (
  chunk_id BIGINT PRIMARY KEY REFERENCES speech_chunks(id) ON DELETE CASCADE,
  embedding VECTOR(3072) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- sns_posts table: Instagram等のSNS投稿正規化
CREATE TABLE IF NOT EXISTS sns_posts (
  id BIGSERIAL PRIMARY KEY,
  platform TEXT NOT NULL DEFAULT 'instagram',
  post_date TIMESTAMP WITH TIME ZONE NOT NULL,
  content TEXT,
  media_url TEXT,
  post_url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- highlights table: クラスタリング結果と代表サンプル
CREATE TABLE IF NOT EXISTS highlights (
  cluster_label TEXT PRIMARY KEY,
  count INTEGER NOT NULL,
  sample_chunk_id BIGINT NOT NULL REFERENCES speech_chunks(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_speeches_date ON speeches(date);
CREATE INDEX IF NOT EXISTS idx_speeches_speaker ON speeches(speaker);
CREATE INDEX IF NOT EXISTS idx_speech_chunks_speech_id ON speech_chunks(speech_id);
CREATE INDEX IF NOT EXISTS idx_sns_posts_platform_date ON sns_posts(platform, post_date DESC);

-- Index for vector similarity search using cosine distance
CREATE INDEX IF NOT EXISTS idx_speech_embeddings_cosine 
ON speech_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- RLS (Row Level Security) policies - デフォルトでは無効
-- 管理者のみアクセスするためAPIキー経由での操作を想定

-- RPC function for vector similarity search
CREATE OR REPLACE FUNCTION match_speech_chunks(
  query_embedding VECTOR(3072),
  match_count INT DEFAULT 5,
  match_threshold FLOAT DEFAULT 0.1
)
RETURNS TABLE (
  chunk_id BIGINT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT 
    se.chunk_id,
    1 - (se.embedding <=> query_embedding) AS similarity
  FROM speech_embeddings se
  WHERE 1 - (se.embedding <=> query_embedding) > match_threshold
  ORDER BY se.embedding <=> query_embedding
  LIMIT match_count;
$$;

-- Insert sample data for testing (optional)
-- This will be populated by the ingest scripts in production