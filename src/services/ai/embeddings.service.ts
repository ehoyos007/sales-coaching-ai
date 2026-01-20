import OpenAI from 'openai';
import { config } from '../../config/index.js';

let openaiClient: OpenAI | null = null;

function getClient(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI({
      apiKey: config.openai.apiKey,
    });
  }
  return openaiClient;
}

/**
 * Generate an embedding vector for a text string
 */
export async function getEmbedding(text: string): Promise<number[]> {
  const client = getClient();

  const response = await client.embeddings.create({
    model: config.openai.embeddingModel,
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * Generate embeddings for multiple texts
 */
export async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const client = getClient();

  const response = await client.embeddings.create({
    model: config.openai.embeddingModel,
    input: texts,
  });

  return response.data.map(item => item.embedding);
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Vectors must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const embeddingsService = {
  getEmbedding,
  getEmbeddings,
  cosineSimilarity,
};
