import { useState, useCallback } from 'react';
import { getCallDetails, getCallTranscript } from '../services/api';
import type { CallMetadata, CallTranscript } from '../types';

interface UseCallDetailsReturn {
  callDetails: CallMetadata | null;
  transcript: CallTranscript | null;
  isLoading: boolean;
  error: string | null;
  fetchCallDetails: (callId: string) => Promise<void>;
  fetchTranscript: (callId: string) => Promise<void>;
  clearCallData: () => void;
}

export function useCalls(): UseCallDetailsReturn {
  const [callDetails, setCallDetails] = useState<CallMetadata | null>(null);
  const [transcript, setTranscript] = useState<CallTranscript | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCallDetails = useCallback(async (callId: string) => {
    if (!callId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCallDetails(callId);

      if (response.success && response.data) {
        setCallDetails(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch call details');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch call details'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchTranscript = useCallback(async (callId: string) => {
    if (!callId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCallTranscript(callId);

      if (response.success && response.data) {
        setTranscript(response.data);
      } else {
        throw new Error(response.error || 'Failed to fetch transcript');
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to fetch transcript'
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  const clearCallData = useCallback(() => {
    setCallDetails(null);
    setTranscript(null);
    setError(null);
  }, []);

  return {
    callDetails,
    transcript,
    isLoading,
    error,
    fetchCallDetails,
    fetchTranscript,
    clearCallData,
  };
}

export default useCalls;
