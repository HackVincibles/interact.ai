import { useEffect, useRef } from 'react';
import { useCoachStore } from '../store/useCoachStore';

/**
 * Hook to monitor global FPS. 
 * If FPS drops below a threshold, it triggers the 'isThrottled' state in the CoachStore.
 */
export function useFPSMonitor(threshold: number = 20, checkIntervalMs: number = 2000) {
  const { setThrottled, isThrottled } = useCoachStore();
  const frameCountRef = useRef(0);
  const lastCheckTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;

      const elapsed = now - lastCheckTimeRef.current;
      if (elapsed >= checkIntervalMs) {
        const fps = (frameCountRef.current / elapsed) * 1000;
        
        if (fps < threshold && !isThrottled) {
          console.warn(`[AI Coach Failsafe] FPS dropped to ${fps.toFixed(1)}. Throttling inference.`);
          setThrottled(true);
        } else if (fps >= threshold + 5 && isThrottled) {
          // Only recover if FPS goes comfortably above threshold
          console.log(`[AI Coach Failsafe] FPS recovered to ${fps.toFixed(1)}. Resuming normal inference.`);
          setThrottled(false);
        }

        // Reset
        frameCountRef.current = 0;
        lastCheckTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(measureFPS);
    };

    rafRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [threshold, checkIntervalMs, isThrottled, setThrottled]);
}
