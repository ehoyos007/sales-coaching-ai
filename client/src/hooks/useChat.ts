import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage, ApiError } from '../services/api';
import type { Message, ChatContext, ChatResponseData, Intent } from '../types';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sessionId: string;
  context: ChatContext;
  sendMessage: (content: string) => Promise<void>;
  setContext: (context: ChatContext) => void;
  clearMessages: () => void;
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId] = useState<string>(() => generateSessionId());
  const [context, setContext] = useState<ChatContext>({});

  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      // Add user message
      const userMessage: Message = {
        id: generateId(),
        role: 'user',
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setIsLoading(true);
      setError(null);

      try {
        const response = await sendChatMessage(content.trim(), sessionId, context);

        if (response.success) {
          const assistantMessage: Message = {
            id: generateId(),
            role: 'assistant',
            content: response.response,
            timestamp: new Date(response.timestamp),
            data: response.data as ChatResponseData | undefined,
            intent: response.intent as Intent,
          };

          setMessages((prev) => [...prev, assistantMessage]);
        } else {
          throw new Error(response.error || 'Failed to get response');
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        const errorMessage =
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : 'An unexpected error occurred';

        setError(errorMessage);

        // Add error message to chat
        const errorResponse: Message = {
          id: generateId(),
          role: 'assistant',
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, errorResponse]);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, sessionId, context]
  );

  const clearMessages = useCallback(() => {
    setMessages([]);
    setError(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateContext = useCallback((newContext: ChatContext) => {
    setContext(newContext);
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    context,
    sendMessage,
    setContext: updateContext,
    clearMessages,
    clearError,
  };
}

export default useChat;
