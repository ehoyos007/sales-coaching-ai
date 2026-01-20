import React, { useState, useMemo, useRef, useEffect } from 'react';
import type { CallTranscript, CallTurn } from '../../types';

interface TranscriptViewerProps {
  transcript: CallTranscript;
}

type FilterType = 'all' | 'agent' | 'customer';

const TurnBubble: React.FC<{ turn: CallTurn; isHighlighted: boolean }> = ({
  turn,
  isHighlighted,
}) => {
  const isAgent = turn.speaker === 'Agent';

  return (
    <div
      className={`flex ${isAgent ? 'justify-start' : 'justify-end'} ${
        isHighlighted ? 'bg-yellow-50 -mx-2 px-2 py-1 rounded' : ''
      }`}
    >
      <div
        className={`max-w-[85%] ${isAgent ? 'pr-4' : 'pl-4'}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span
            className={`text-xs font-medium ${
              isAgent ? 'text-purple-600' : 'text-orange-600'
            }`}
          >
            {turn.speaker}
          </span>
          <span className="text-xs text-slate-400">
            Turn {turn.turn_number}
          </span>
          {turn.timestamp_start && (
            <span className="text-xs text-slate-400">
              {turn.timestamp_start}
            </span>
          )}
        </div>
        <div
          className={`p-3 rounded-xl text-sm ${
            isAgent
              ? 'bg-purple-50 text-slate-800 rounded-tl-sm'
              : 'bg-orange-50 text-slate-800 rounded-tr-sm'
          }`}
        >
          {turn.text}
        </div>
        {turn.duration_seconds > 0 && (
          <span className="text-xs text-slate-400 mt-1 block">
            {turn.duration_seconds.toFixed(1)}s
          </span>
        )}
      </div>
    </div>
  );
};

export const TranscriptViewer: React.FC<TranscriptViewerProps> = ({
  transcript,
}) => {
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Safely get turns array, defaulting to empty array if undefined
  const turns = transcript?.turns ?? [];

  // Filter turns based on selected filter and search query
  const filteredTurns = useMemo(() => {
    let filteredList = turns;

    // Apply speaker filter
    if (filter === 'agent') {
      filteredList = filteredList.filter((turn) => turn.speaker === 'Agent');
    } else if (filter === 'customer') {
      filteredList = filteredList.filter((turn) => turn.speaker === 'Customer');
    }

    return filteredList;
  }, [turns, filter]);

  // Find turns that match search query
  const matchingTurnIds = useMemo(() => {
    if (!searchQuery.trim()) return new Set<number>();
    const query = searchQuery.toLowerCase();
    return new Set(
      filteredTurns
        .filter((turn) => turn.text.toLowerCase().includes(query))
        .map((turn) => turn.id)
    );
  }, [filteredTurns, searchQuery]);

  // Scroll to first match when search changes
  useEffect(() => {
    if (matchingTurnIds.size > 0 && containerRef.current) {
      const firstMatchId = Array.from(matchingTurnIds)[0];
      const element = containerRef.current.querySelector(
        `[data-turn-id="${firstMatchId}"]`
      );
      element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [matchingTurnIds]);

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-slate-200 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-800">
              Call Transcript
            </h3>
            <p className="text-xs text-slate-500">
              {transcript.agent_name} | {transcript.call_date} |{' '}
              {transcript.total_duration_formatted}
            </p>
          </div>
          <span className="text-xs text-slate-500">
            {filteredTurns.length} of {turns.length} turns
          </span>
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search transcript..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
          />
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          {searchQuery && matchingTurnIds.size > 0 && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">
              {matchingTurnIds.size} match{matchingTurnIds.size !== 1 ? 'es' : ''}
            </span>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
          {[
            { id: 'all', label: 'All', count: turns.length },
            {
              id: 'agent',
              label: 'Agent',
              count: turns.filter((t) => t.speaker === 'Agent').length,
            },
            {
              id: 'customer',
              label: 'Customer',
              count: turns.filter((t) => t.speaker === 'Customer').length,
            },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as FilterType)}
              className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-smooth ${
                filter === tab.id
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              {tab.label}
              <span className="ml-1 text-slate-400">({tab.count})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Transcript content */}
      <div
        ref={containerRef}
        className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4"
      >
        {filteredTurns.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <svg
              className="h-12 w-12 mx-auto mb-3 text-slate-300"
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
            <p className="text-sm">No turns to display</p>
          </div>
        ) : (
          filteredTurns.map((turn) => (
            <div key={turn.id} data-turn-id={turn.id}>
              <TurnBubble
                turn={turn}
                isHighlighted={matchingTurnIds.has(turn.id)}
              />
            </div>
          ))
        )}
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-4 py-2 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center justify-center gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-purple-200" />
            <span>Agent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-3 w-3 rounded bg-orange-200" />
            <span>Customer</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TranscriptViewer;
