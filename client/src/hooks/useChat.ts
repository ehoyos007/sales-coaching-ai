import { useState, useCallback, useRef, useEffect } from 'react';
import { sendChatMessage, getChatHistory, ApiError } from '../services/api';
import type { Message, ChatContext, ChatResponseData, Intent, ChatMessageRecord } from '../types';

const SESSION_STORAGE_KEY = 'sales-coaching-session-id';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function getOrCreateSessionId(): string {
  const stored = localStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    return stored;
  }
  const newId = generateSessionId();
  localStorage.setItem(SESSION_STORAGE_KEY, newId);
  return newId;
}

function convertRecordToMessage(record: ChatMessageRecord): Message {
  return {
    id: record.id,
    role: record.role,
    content: record.content,
    timestamp: new Date(record.created_at),
    data: record.data as ChatResponseData | undefined,
    intent: record.intent as Intent | undefined,
  };
}

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory: boolean;
  error: string | null;
  sessionId: string;
  context: ChatContext;
  sendMessage: (content: string) => Promise<void>;
  setContext: (context: ChatContext) => void;
  clearMessages: () => void;
  clearError: () => void;
  startNewChat: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [context, setContext] = useState<ChatContext>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const historyLoadedRef = useRef<Set<string>>(new Set());

  // Load chat history when sessionId changes
  useEffect(() => {
    const loadHistory = async () => {
      // Skip if already loaded for this session
      if (historyLoadedRef.current.has(sessionId)) {
        return;
      }

      setIsLoadingHistory(true);
      try {
        const response = await getChatHistory(sessionId);
        if (response.success && response.data?.messages.length) {
          const loadedMessages = response.data.messages.map(convertRecordToMessage);
          setMessages(loadedMessages);

          // Restore context if available
          if (response.data.session?.context) {
            setContext(response.data.session.context);
          }
        }
        historyLoadedRef.current.add(sessionId);
      } catch (err) {
        console.error('Failed to load chat history:', err);
        // Non-fatal: continue without history
        historyLoadedRef.current.add(sessionId);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadHistory();
  }, [sessionId]);

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

  const startNewChat = useCallback(() => {
    // Generate new session ID and update localStorage
    const newId = generateSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, newId);
    setSessionId(newId);

    // Clear current messages and context
    setMessages([]);
    setError(null);
    setContext({});
  }, []);

  return {
    messages,
    isLoading,
    isLoadingHistory,
    error,
    sessionId,
    context,
    sendMessage,
    setContext: updateContext,
    clearMessages,
    clearError,
    startNewChat,
  };
}

export default useChat;
