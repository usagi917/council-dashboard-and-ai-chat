/**
 * Configuration utilities for search/retrieval behavior
 */

/**
 * Returns the Top-K value for vector search.
 * Defaults to 5. Clamped to [1, 20].
 */
export function getVectorTopK(): number {
  const raw = process.env.VECTOR_TOP_K;
  if (!raw) return 5;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 5;
  const int = Math.trunc(n);
  if (int <= 0) return 5;
  return Math.max(1, Math.min(20, int));
}
