/**
 * Token estimation utilities
 *
 * Uses a simple heuristic of ~4 characters per token.
 * This is a rough approximation for Claude's tokenizer.
 */

const CHARS_PER_TOKEN = 4;

/**
 * Estimate token count for a string
 */
export function estimateTokens(text: string): number {
  if (!text) return 0;
  return Math.ceil(text.length / CHARS_PER_TOKEN);
}

/**
 * Estimate token count for a message with role
 */
export function estimateMessageTokens(_role: string, content: string): number {
  // Add overhead for role formatting (approximately 4 tokens)
  // The role parameter is kept for future use if we need role-specific token calculations
  const roleOverhead = 4;
  return roleOverhead + estimateTokens(content);
}

/**
 * Configuration for history token budget
 */
export const HISTORY_CONFIG = {
  /** Maximum tokens to allocate for conversation history */
  MAX_HISTORY_TOKENS: 6000,
  /** Maximum number of messages to include regardless of tokens */
  MAX_MESSAGES: 50,
  /** Tokens to reserve for current message and response */
  RESERVED_TOKENS: 2000,
};

export const tokenUtils = {
  estimateTokens,
  estimateMessageTokens,
  HISTORY_CONFIG,
};
