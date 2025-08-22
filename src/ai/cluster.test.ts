import { describe, it, expect } from "vitest";
import { kmeans } from "./cluster";

describe("kmeans clustering", () => {
  it("should cluster vectors into k groups", () => {
    // Simple 2D vectors for testing
    const vectors = [
      [1, 1], // Group 1
      [1, 2], // Group 1
      [2, 1], // Group 1
      [8, 8], // Group 2
      [8, 9], // Group 2
      [9, 8], // Group 2
    ];

    const result = kmeans(vectors, 2, 42); // fixed seed

    expect(result.labels).toHaveLength(6);
    expect(result.centroids).toHaveLength(2);
    expect(result.centroids[0]).toHaveLength(2); // 2D vectors

    // All labels should be 0 or 1
    result.labels.forEach((label) => {
      expect(label).toBeGreaterThanOrEqual(0);
      expect(label).toBeLessThan(2);
    });
  });

  it("should be deterministic with same seed", () => {
    const vectors = [
      [1, 1],
      [1, 2],
      [2, 1],
      [8, 8],
      [8, 9],
      [9, 8],
    ];

    const result1 = kmeans(vectors, 2, 42);
    const result2 = kmeans(vectors, 2, 42);

    expect(result1.labels).toEqual(result2.labels);
    expect(result1.centroids).toEqual(result2.centroids);
  });

  it("should handle single cluster", () => {
    const vectors = [
      [1, 1],
      [2, 2],
      [3, 3],
    ];

    const result = kmeans(vectors, 1, 42);

    expect(result.labels).toEqual([0, 0, 0]);
    expect(result.centroids).toHaveLength(1);
  });

  it("should handle empty vectors", () => {
    const result = kmeans([], 2, 42);

    expect(result.labels).toEqual([]);
    expect(result.centroids).toEqual([]);
  });

  it("should handle more clusters than vectors", () => {
    const vectors = [
      [1, 1],
      [2, 2],
    ];

    const result = kmeans(vectors, 5, 42);

    expect(result.labels).toHaveLength(2);
    expect(result.centroids).toHaveLength(2); // Should limit to number of vectors
  });

  it("should work with high-dimensional vectors (3072 dims like embeddings)", () => {
    // Create simple high-dimensional vectors
    const dim = 3072;
    const vectors = [
      new Array(dim).fill(0).map((_, i) => (i < 100 ? 1 : 0)), // Group 1
      new Array(dim).fill(0).map((_, i) => (i < 100 ? 1.1 : 0)), // Group 1
      new Array(dim).fill(0).map((_, i) => (i >= dim - 100 ? 1 : 0)), // Group 2
      new Array(dim).fill(0).map((_, i) => (i >= dim - 100 ? 1.1 : 0)), // Group 2
    ];

    const result = kmeans(vectors, 2, 42);

    expect(result.labels).toHaveLength(4);
    expect(result.centroids).toHaveLength(2);
    expect(result.centroids[0]).toHaveLength(dim);
  });
});
