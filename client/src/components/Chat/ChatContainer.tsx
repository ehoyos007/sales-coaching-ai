import React, { useRef, useEffect } from 'react';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { TypingIndicator } from '../common/LoadingSpinner';
import type { Message } from '../../types';

interface ChatContainerProps {
  messages: Message[];
  isLoading: boolean;
  isLoadingHistory?: boolean;
  onSendMessage: (message: string) => void;
  onCallClick?: (callId: string) => void;
}

const WelcomeMessage: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-100 text-primary-600 mb-4">
      <svg
        className="h-8 w-8"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
        />
      </svg>
    </div>
    <h2 className="text-xl font-semibold text-slate-800 mb-2">
      Welcome to Sales Coaching AI
    </h2>
    <p className="text-slate-500 max-w-md mb-8">
      I can help you analyze agent performance, review call transcripts, and
      discover insights from your sales data.
    </p>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg w-full">
      {[
        {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          ),
          title: 'Team Summary',
          desc: 'Get an overview of team performance',
        },
        {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          ),
          title: 'Agent Stats',
          desc: "Analyze an agent's performance",
        },
        {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
            />
          ),
          title: 'List Calls',
          desc: "View an agent's recent calls",
        },
        {
          icon: (
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          ),
          title: 'Search Calls',
          desc: 'Find calls by topic or content',
        },
      ].map((item, index) => (
        <div
          key={index}
          className="flex items-start gap-3 p-3 rounded-lg bg-slate-50 border border-slate-100 text-left"
        >
          <div className="flex-shrink-0 h-8 w-8 rounded-lg bg-primary-100 text-primary-600 flex items-center justify-center">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {item.icon}
            </svg>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-800">{item.title}</p>
            <p className="text-xs text-slate-500">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>

    <p className="text-xs text-slate-400 mt-6">
      Try: "Show me Bradley's calls from this week" or "Give me a team summary"
    </p>
  </div>
);

const LoadingHistory: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full text-center px-4 py-12">
    <div className="flex items-center justify-center h-16 w-16 rounded-2xl bg-primary-100 text-primary-600 mb-4">
      <svg
        className="h-8 w-8 animate-spin"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
    <p className="text-slate-500">Loading conversation history...</p>
  </div>
);

export const ChatContainer: React.FC<ChatContainerProps> = ({
  messages,
  isLoading,
  isLoadingHistory = false,
  onSendMessage,
  onCallClick,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isLoading]);

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Messages area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto chat-scroll"
        role="log"
        aria-live="polite"
        aria-label="Chat messages"
      >
        {isLoadingHistory ? (
          <LoadingHistory />
        ) : messages.length === 0 ? (
          <WelcomeMessage />
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onCallClick={onCallClick}
              />
            ))}

            {/* Typing indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="flex gap-3">
                  <div className="flex-shrink-0 h-8 w-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center">
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="px-4 py-3 rounded-2xl bg-slate-100 rounded-tl-sm">
                    <TypingIndicator />
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  );
};

export default ChatContainer;
