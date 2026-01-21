import React from 'react';
import { MarkdownRenderer } from '../common/MarkdownRenderer';
import type { Message, CallSummary } from '../../types';

interface ChatMessageProps {
  message: Message;
  onCallClick?: (callId: string) => void;
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

const CallDataCard: React.FC<{
  calls: CallSummary[];
  onCallClick?: (callId: string) => void;
}> = ({ calls, onCallClick }) => {
  if (!calls || calls.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">
        Related Calls ({calls.length})
      </p>
      <div className="grid gap-2">
        {calls.slice(0, 5).map((call) => (
          <button
            key={call.call_id}
            onClick={() => onCallClick?.(call.call_id)}
            className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-smooth text-left group"
          >
            <div className="flex items-center gap-3">
              <div
                className={`flex items-center justify-center h-8 w-8 rounded-full ${
                  call.is_inbound_call
                    ? 'bg-green-100 text-green-600'
                    : 'bg-blue-100 text-blue-600'
                }`}
              >
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {call.is_inbound_call ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                    />
                  )}
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-800 group-hover:text-primary-700">
                  {new Date(call.call_datetime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                    timeZone: 'America/New_York',
                  })}{' '}
                  at{' '}
                  {new Date(call.call_datetime).toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true,
                    timeZone: 'America/New_York',
                  })}{' '}
                  EST
                </p>
                <p className="text-xs text-slate-500">
                  {call.total_duration_formatted} | {call.total_turns} turns
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-500">
                {call.agent_talk_percentage}% talk
              </span>
              <svg
                className="h-4 w-4 text-slate-400 group-hover:text-primary-600 ml-2 inline"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </button>
        ))}
        {calls.length > 5 && (
          <p className="text-xs text-slate-500 text-center py-1">
            +{calls.length - 5} more calls
          </p>
        )}
      </div>
    </div>
  );
};

export const ChatMessage: React.FC<ChatMessageProps> = ({
  message,
  onCallClick,
}) => {
  const isUser = message.role === 'user';

  return (
    <div
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} group`}
      role="article"
      aria-label={`${isUser ? 'Your' : 'Assistant'} message`}
    >
      <div
        className={`flex gap-3 max-w-[85%] lg:max-w-[75%] ${
          isUser ? 'flex-row-reverse' : 'flex-row'
        }`}
      >
        {/* Avatar */}
        <div
          className={`flex-shrink-0 h-8 w-8 rounded-full flex items-center justify-center ${
            isUser
              ? 'bg-primary-600 text-white'
              : 'bg-slate-200 text-slate-600'
          }`}
        >
          {isUser ? (
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
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          ) : (
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
          )}
        </div>

        {/* Message content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-3 rounded-2xl ${
              isUser
                ? 'bg-primary-600 text-white rounded-tr-sm'
                : 'bg-slate-100 text-slate-800 rounded-tl-sm'
            }`}
          >
            {isUser ? (
              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
            ) : (
              <MarkdownRenderer
                content={message.content}
                className={isUser ? 'text-white' : ''}
              />
            )}
          </div>

          {/* Call data cards */}
          {!isUser && message.data?.calls && (
            <CallDataCard
              calls={message.data.calls}
              onCallClick={onCallClick}
            />
          )}

          {/* Timestamp */}
          <span
            className={`text-xs text-slate-400 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${
              isUser ? 'mr-1' : 'ml-1'
            }`}
          >
            {formatTime(new Date(message.timestamp))}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
