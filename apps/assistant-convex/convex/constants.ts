/**
 * Dimensionality of the embedding vectors (Gemini embedding-2-preview).
 */
export const EMBEDDING_DIMENSIONS = 768;

/**
 * Minimum cosine similarity score for vector search results to be considered
 * relevant.
 */
export const VECTOR_SEARCH_SIMILARITY_THRESHOLD = 0.7;

/**
 * Maximum iterations for k-means clustering convergence.
 */
export const KMEANS_MAX_ITERATIONS = 50;

/**
 * Maximum number of topic clusters to generate.
 */
export const KMEANS_MAX_CLUSTERS = 10;

/**
 * Approximate number of nodes per cluster.
 */
export const KMEANS_NODES_PER_CLUSTER = 3;
