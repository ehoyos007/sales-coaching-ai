/**
 * Embeddings Service for Vercel serverless functions
 * Uses OpenAI for text embeddings
 */
import OpenAI from 'openai';
import { config } from '../config';

// =============================================
// EMBEDDINGS SERVICE CLASS
// =============================================

export class EmbeddingsService {
  private client: OpenAI;
  private model: string;

  constructor() {
    this.client = new OpenAI({
      apiKey: config.openai.apiKey,
    });
    this.model = config.openai.embeddingModel;
  }

  /**
   * Get embedding vector for text
   */
  async getEmbedding(text: string): Promise<number[]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: text,
    });

    return response.data[0].embedding;
  }

  /**
   * Get embeddings for multiple texts
   */
  async getEmbeddings(texts: string[]): Promise<number[][]> {
    const response = await this.client.embeddings.create({
      model: this.model,
      input: texts,
    });

    return response.data.map((d) => d.embedding);
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let embeddingsServiceInstance: EmbeddingsService | null = null;

export function getEmbeddingsService(): EmbeddingsService {
  if (!embeddingsServiceInstance) {
    embeddingsServiceInstance = new EmbeddingsService();
  }
  return embeddingsServiceInstance;
}

export const embeddingsService = getEmbeddingsService();
