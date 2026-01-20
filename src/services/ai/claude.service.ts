import Anthropic from '@anthropic-ai/sdk';
import { config } from '../../config/index.js';

let anthropicClient: Anthropic | null = null;

function getClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({
      apiKey: config.anthropic.apiKey,
    });
  }
  return anthropicClient;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Send a message to Claude and get a response
 */
export async function chat(
  systemPrompt: string,
  userMessage: string,
  options: {
    maxTokens?: number;
    temperature?: number;
  } = {}
): Promise<ClaudeResponse> {
  const client = getClient();

  const { maxTokens = 1024, temperature = 0.7 } = options;

  const response = await client.messages.create({
    model: config.anthropic.model,
    max_tokens: maxTokens,
    temperature,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  });

  // Extract text content from response
  const textContent = response.content.find((block) => block.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  return {
    content,
    usage: {
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
    },
  };
}

/**
 * Send a message to Claude with JSON response expected
 */
export async function chatJSON<T>(
  systemPrompt: string,
  userMessage: string,
  options: {
    maxTokens?: number;
  } = {}
): Promise<T> {
  const response = await chat(systemPrompt, userMessage, {
    ...options,
    temperature: 0.1, // Lower temperature for more consistent JSON
  });

  try {
    // Try to parse the response as JSON
    const jsonStr = response.content.trim();
    // Handle potential markdown code blocks
    const cleanJson = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    return JSON.parse(cleanJson) as T;
  } catch (error) {
    throw new Error(`Failed to parse Claude response as JSON: ${response.content}`);
  }
}

/**
 * Generate a natural language response using Claude
 */
export async function generateResponse(
  prompt: string,
  context: string = ''
): Promise<string> {
  const systemPrompt = 'You are a helpful, concise sales coaching assistant. Respond in a friendly, professional tone. Use markdown for formatting when helpful.';

  const fullMessage = context ? `${context}\n\n${prompt}` : prompt;

  const response = await chat(systemPrompt, fullMessage, {
    maxTokens: 2048,
    temperature: 0.7,
  });

  return response.content;
}

export const claudeService = {
  chat,
  chatJSON,
  generateResponse,
};
