/**
 * Claude AI Service for Vercel serverless functions
 */
import Anthropic from '@anthropic-ai/sdk';
import { config } from '../config';

// =============================================
// TYPES
// =============================================

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  model: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}

// =============================================
// CLAUDE SERVICE CLASS
// =============================================

export class ClaudeService {
  private client: Anthropic;
  private model: string;

  constructor() {
    this.client = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
    this.model = config.anthropic.model;
  }

  /**
   * Send a message to Claude and get a response
   */
  async chat(
    systemPrompt: string,
    messages: ClaudeMessage[],
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<ClaudeResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options?.maxTokens || 4096,
      temperature: options?.temperature || 0.7,
      system: systemPrompt,
      messages: messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    });

    // Extract text content from response
    const textBlock = response.content.find((block) => block.type === 'text');
    const content = textBlock?.type === 'text' ? textBlock.text : '';

    return {
      content,
      model: response.model,
      usage: response.usage
        ? {
            input_tokens: response.usage.input_tokens,
            output_tokens: response.usage.output_tokens,
          }
        : undefined,
    };
  }

  /**
   * Simple completion with a single prompt
   */
  async complete(
    systemPrompt: string,
    userMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    const response = await this.chat(
      systemPrompt,
      [{ role: 'user', content: userMessage }],
      options
    );
    return response.content;
  }

  /**
   * Parse JSON from Claude's response
   */
  async parseJsonResponse<T>(
    systemPrompt: string,
    userMessage: string,
    options?: {
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<T> {
    const response = await this.complete(systemPrompt, userMessage, {
      ...options,
      temperature: options?.temperature || 0.1, // Lower temperature for JSON
    });

    // Clean the response - remove markdown code blocks if present
    let cleaned = response.trim();
    if (cleaned.startsWith('```json')) {
      cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
      cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.slice(0, -3);
    }

    return JSON.parse(cleaned.trim()) as T;
  }
}

// =============================================
// SINGLETON EXPORT
// =============================================

let claudeServiceInstance: ClaudeService | null = null;

export function getClaudeService(): ClaudeService {
  if (!claudeServiceInstance) {
    claudeServiceInstance = new ClaudeService();
  }
  return claudeServiceInstance;
}

export const claudeService = getClaudeService();
