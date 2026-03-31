import { KMEANS_MAX_ITERATIONS } from '#convex/constants.ts';

export interface Cluster {
  members: number[];
  distances: number[];
}

// 👀 Needs Verification
export function kMeans(vectors: number[][], k: number): Cluster[] {
  const n = vectors.length;
  if (n === 0 || k <= 0) return [];
  k = Math.min(k, n);
  const dims = vectors[0]!.length;

  // Initialize centroids with k-means++ seeding
  const centroids: number[][] = [];
  centroids.push([...vectors[Math.floor(Math.random() * n)]!]);

  for (let c = 1; c < k; c++) {
    const dists = vectors.map((v) =>
      Math.min(...centroids.map((cen) => euclideanDist(v, cen))),
    );
    const totalDist = dists.reduce((a, b) => a + b, 0);
    let r = Math.random() * totalDist;
    let idx = 0;
    for (let i = 0; i < n; i++) {
      r -= dists[i]!;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    centroids.push([...vectors[idx]!]);
  }

  // Run k-means iterations
  let assignments = Array.from<number>({ length: n }).fill(0);
  for (let iter = 0; iter < KMEANS_MAX_ITERATIONS; iter++) {
    // Assign each vector to nearest centroid
    const newAssignments = vectors.map((v) => {
      let minDist = Infinity;
      let minIdx = 0;
      for (let c = 0; c < k; c++) {
        const d = euclideanDist(v, centroids[c]!);
        if (d < minDist) {
          minDist = d;
          minIdx = c;
        }
      }
      return minIdx;
    });

    // Check convergence
    if (newAssignments.every((a, i) => a === assignments[i])) break;
    assignments = newAssignments;

    // Update centroids
    for (let c = 0; c < k; c++) {
      const members = vectors.filter((_, i) => assignments[i] === c);
      if (members.length === 0) continue;
      for (let d = 0; d < dims; d++) {
        centroids[c]![d] =
          members.reduce((sum, v) => sum + v[d]!, 0) / members.length;
      }
    }
  }

  // Build cluster results
  const clusters: Cluster[] = Array.from({ length: k }, () => ({
    members: [],
    distances: [],
  }));

  for (let i = 0; i < n; i++) {
    const c = assignments[i]!;
    clusters[c]!.members.push(i);
    clusters[c]!.distances.push(euclideanDist(vectors[i]!, centroids[c]!));
  }

  // Filter out empty clusters
  return clusters.filter((c) => c.members.length > 0);
}

function euclideanDist(a: number[], b: number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = a[i]! - b[i]!;
    sum += d * d;
  }
  return Math.sqrt(sum);
}
