import React, { useEffect, useRef, useState } from 'react';
import { CallMetrics } from './CallMetrics';
import { TranscriptViewer } from './TranscriptViewer';
import { LoadingSpinner } from '../common/LoadingSpinner';
import type { CallMetadata, CallTranscript } from '../../types';

interface CallDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  callDetails: CallMetadata | null;
  transcript: CallTranscript | null;
  isLoading: boolean;
  error: string | null;
}

type TabType = 'transcript' | 'metrics';

export const CallDetailsModal: React.FC<CallDetailsModalProps> = ({
  isOpen,
  onClose,
  callDetails,
  transcript,
  isLoading,
  error,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('transcript');
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  // Handle escape key and focus management
  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      modalRef.current?.focus();

      const handleEscape = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };

      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';

      return () => {
        document.removeEventListener('keydown', handleEscape);
        document.body.style.overflow = '';
        previousActiveElement.current?.focus();
      };
    }
  }, [isOpen, onClose]);

  // Reset tab when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveTab('transcript');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2
              id="modal-title"
              className="text-lg font-semibold text-slate-900"
            >
              Call Details
            </h2>
            {callDetails && (
              <p className="text-sm text-slate-500">
                {new Date(callDetails.call_date).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-smooth focus-ring"
            aria-label="Close modal"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 px-6">
          <button
            onClick={() => setActiveTab('transcript')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-smooth ${
              activeTab === 'transcript'
                ? 'text-primary-600 border-primary-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Transcript
            </span>
          </button>
          <button
            onClick={() => setActiveTab('metrics')}
            className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-smooth ${
              activeTab === 'metrics'
                ? 'text-primary-600 border-primary-600'
                : 'text-slate-500 border-transparent hover:text-slate-700'
            }`}
          >
            <span className="flex items-center gap-2">
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
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              Metrics
            </span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <LoadingSpinner size="lg" />
              <p className="text-sm text-slate-500 mt-4">Loading call data...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-full py-12">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-red-100 text-red-500 mb-4">
                <svg
                  className="h-6 w-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-slate-800 mb-1">
                Failed to load call data
              </p>
              <p className="text-xs text-slate-500">{error}</p>
            </div>
          ) : (
            <>
              {activeTab === 'transcript' && transcript ? (
                <TranscriptViewer transcript={transcript} />
              ) : activeTab === 'transcript' && !transcript ? (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <svg
                    className="h-12 w-12 text-slate-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="text-sm text-slate-500">
                    No transcript available
                  </p>
                </div>
              ) : activeTab === 'metrics' && callDetails ? (
                <div className="p-6 overflow-y-auto h-full">
                  <CallMetrics callDetails={callDetails} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full py-12">
                  <svg
                    className="h-12 w-12 text-slate-300 mb-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  <p className="text-sm text-slate-500">
                    No metrics available
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200 bg-slate-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-smooth focus-ring"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallDetailsModal;
