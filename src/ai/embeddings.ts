import type OpenAI from "openai";

/**
 * OpenAI Embeddings APIのクライアント
 * text-embedding-3-large モデル（3072次元）を使用
 */
export class EmbeddingClient {
  constructor(private readonly openai: OpenAI) {}

  /**
   * テキストを埋め込みベクターに変換
   * @param text - 埋め込み対象のテキスト
   * @returns 3072次元の数値配列
   */
  async embed(text: string): Promise<number[]> {
    const response = await this.openai.embeddings.create({
      model: "text-embedding-3-large",
      input: text,
    });

    return response.data[0].embedding;
  }
}
