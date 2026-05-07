import { useEffect, useRef } from 'react';
import { useCoachStore } from '../store/useCoachStore';

/**
 * Hook to monitor global FPS.
 * If FPS drops below a threshold, it triggers the 'isThrottled' state in the CoachStore.
 *
 * Key design decisions:
 * - Counters are reset INSIDE the effect (not at hook creation) so the measurement
 *   baseline starts exactly when the RAF loop begins — not during the heavy initial render.
 * - A startup grace period (startupGraceMs) skips the first few seconds so MediaPipe
 *   WASM initialization / React's initial commit don't trigger a false throttle.
 * - isThrottled is read via a ref so the RAF loop never needs to restart on state changes.
 */
export function useFPSMonitor(
  threshold: number = 20,
  checkIntervalMs: number = 2000,
  startupGraceMs: number = 5000, // ignore FPS readings for first 5s after mount
) {
  const { setThrottled, isThrottled } = useCoachStore();
  const frameCountRef = useRef(0);
  const lastCheckTimeRef = useRef(0); // intentionally 0 — set properly inside effect
  const startTimeRef = useRef(0);     // tracks when the loop actually started
  const rafRef = useRef<number | null>(null);

  // Keep a stable ref so the RAF closure always reads the latest throttle state
  // without needing the effect to re-register.
  const isThrottledRef = useRef(isThrottled);
  useEffect(() => { isThrottledRef.current = isThrottled; }, [isThrottled]);

  useEffect(() => {
    // Reset measurement baseline the moment the loop starts — NOT at hook-render time.
    // This is the critical fix: between hook render and effect execution the browser
    // was busy loading MediaPipe WASM, so without this reset the first interval would
    // count ~0 frames over a large elapsed time and falsely report 0.2 FPS.
    const loopStart = performance.now();
    startTimeRef.current = loopStart;
    lastCheckTimeRef.current = loopStart;
    frameCountRef.current = 0;

    const measureFPS = () => {
      const now = performance.now();
      frameCountRef.current++;

      const elapsed = now - lastCheckTimeRef.current;
      if (elapsed >= checkIntervalMs) {
        // Don't make any throttle decisions during the startup grace window.
        // The page is still loading assets; FPS will be artificially low.
        const sinceStart = now - startTimeRef.current;
        if (sinceStart >= startupGraceMs) {
          const fps = (frameCountRef.current / elapsed) * 1000;

          if (fps < threshold && !isThrottledRef.current) {
            console.warn(`[AI Coach Failsafe] FPS dropped to ${fps.toFixed(1)}. Throttling inference.`);
            setThrottled(true);
          } else if (fps >= threshold + 5 && isThrottledRef.current) {
            // Only recover when FPS is comfortably above threshold (hysteresis gap = 5)
            console.log(`[AI Coach Failsafe] FPS recovered to ${fps.toFixed(1)}. Resuming normal inference.`);
            setThrottled(false);
          }
        }

        // Always reset counters after each check window
        frameCountRef.current = 0;
        lastCheckTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(measureFPS);
    };

    rafRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threshold, checkIntervalMs, startupGraceMs, setThrottled]); // isThrottled excluded intentionally — read via ref
}
