export interface KMeansResult {
  labels: number[];
  centroids: number[][];
}

/**
 * Simple KMeans clustering implementation
 * @param vectors - Array of feature vectors to cluster
 * @param k - Number of clusters
 * @param seed - Random seed for reproducible results
 * @returns Cluster labels and centroids
 */
export function kmeans(
  vectors: number[][],
  k: number,
  seed: number = 42
): KMeansResult {
  if (vectors.length === 0) {
    return { labels: [], centroids: [] };
  }

  // Limit k to number of vectors
  const actualK = Math.min(k, vectors.length);
  const dimensions = vectors[0].length;

  // Seeded random number generator
  let seedState = seed;
  const random = () => {
    seedState = (seedState * 1664525 + 1013904223) % 2 ** 32;
    return seedState / 2 ** 32;
  };

  // Initialize centroids randomly
  let centroids: number[][] = [];
  for (let i = 0; i < actualK; i++) {
    const centroid: number[] = [];
    for (let d = 0; d < dimensions; d++) {
      // Initialize with random values in the range of the data
      const min = Math.min(...vectors.map((v) => v[d]));
      const max = Math.max(...vectors.map((v) => v[d]));
      centroid.push(min + random() * (max - min));
    }
    centroids.push(centroid);
  }

  const labels = new Array(vectors.length).fill(0);
  let hasChanged = true;
  const maxIterations = 100;

  for (
    let iteration = 0;
    iteration < maxIterations && hasChanged;
    iteration++
  ) {
    hasChanged = false;

    // Assign each vector to nearest centroid
    for (let i = 0; i < vectors.length; i++) {
      let nearestCentroid = 0;
      let minDistance = euclideanDistance(vectors[i], centroids[0]);

      for (let j = 1; j < actualK; j++) {
        const distance = euclideanDistance(vectors[i], centroids[j]);
        if (distance < minDistance) {
          minDistance = distance;
          nearestCentroid = j;
        }
      }

      if (labels[i] !== nearestCentroid) {
        labels[i] = nearestCentroid;
        hasChanged = true;
      }
    }

    // Update centroids
    const newCentroids: number[][] = [];
    for (let j = 0; j < actualK; j++) {
      const clusterVectors = vectors.filter((_, i) => labels[i] === j);

      if (clusterVectors.length === 0) {
        // Keep the old centroid if no vectors assigned
        newCentroids.push([...centroids[j]]);
      } else {
        // Calculate mean of assigned vectors
        const newCentroid: number[] = [];
        for (let d = 0; d < dimensions; d++) {
          const sum = clusterVectors.reduce(
            (acc, vector) => acc + vector[d],
            0
          );
          newCentroid.push(sum / clusterVectors.length);
        }
        newCentroids.push(newCentroid);
      }
    }

    centroids = newCentroids;
  }

  return { labels, centroids };
}

function euclideanDistance(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}
