import { useEffect, useRef } from 'react';
import { useCoachStore } from '../store/useCoachStore';

interface AnalyticsPayload {
  sessionId: string;
  participantId: string;
  timestamp: number;
  eyeContactState: string;
  postureState: string;
  engagementState: string;
}

/**
 * Hook to passively batch and sync analytics data to the backend.
 * Ensures the main UI thread and core network are never flooded.
 */
export function useAnalyticsSync(sessionId: string | null, participantId: string | null) {
  const { eyeContactState, postureState, engagementState } = useCoachStore();
  const syncIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // We use refs to capture the latest state for the interval without constantly clearing it
  const stateRef = useRef({
    eyeContactState,
    postureState,
    engagementState,
  });

  useEffect(() => {
    stateRef.current = { eyeContactState, postureState, engagementState };
  }, [eyeContactState, postureState, engagementState]);

  useEffect(() => {
    if (!sessionId || !participantId) return;

    const syncData = async () => {
      // Do not sync if we haven't gathered valid data yet
      if (stateRef.current.engagementState === 'Unknown') return;

      const payload: AnalyticsPayload = {
        sessionId,
        participantId,
        timestamp: Date.now(),
        ...stateRef.current
      };

      try {
        // Send to backend via fire-and-forget fetch
        // (Using standard fetch; replace with Axios or WebSocket if preferred)
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/coach-sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          // keepalive ensures the request finishes even if the component unmounts (e.g. user closes tab)
          keepalive: true 
        });
      } catch (error) {
        // Silently fail to avoid console spam or UI disruption.
        // It's just analytics, it's fine if a batch is dropped.
      }
    };

    // Schedule sync every 10 seconds (10000ms)
    syncIntervalRef.current = setInterval(syncData, 10000);

    return () => {
      if (syncIntervalRef.current) clearInterval(syncIntervalRef.current);
    };
  }, [sessionId, participantId]);
}
