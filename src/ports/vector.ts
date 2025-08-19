/**
 * ベクター検索の結果項目
 */
export interface SimilarityResult {
  /** チャンクID */
  chunkId: number;
  /** 類似度スコア（0-1、1に近いほど類似） */
  score: number;
}

/**
 * ベクター検索のポート
 * 埋め込みベクターの保存と類似検索を抽象化
 */
export interface VectorSearch {
  /**
   * チャンクの埋め込みベクターを保存/更新
   * @param chunkId - チャンクのID
   * @param embedding - 埋め込みベクター
   */
  upsert(chunkId: number, embedding: number[]): Promise<void>;

  /**
   * テキストに類似するチャンクをk件検索
   * @param text - 検索クエリテキスト
   * @param k - 取得件数
   * @returns 類似度スコア順（降順）の結果
   */
  querySimilar(text: string, k: number): Promise<SimilarityResult[]>;
}
