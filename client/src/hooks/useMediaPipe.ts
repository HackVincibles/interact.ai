import { useEffect, useRef, useState, useCallback, RefObject } from 'react';
import { useCoachStore } from '../store/useCoachStore';
import { checkPosture, checkFaceFraming, checkEyeContact } from '../utils/postureMath';

/**
 * Runs MediaPipe FaceLandmarker directly on the main thread with careful
 * interval throttling. No Web Worker needed — at 320x240 and 1-2 FPS inference
 * rate, the GPU-accelerated WebGL delegate keeps main-thread cost minimal.
 *
 * This approach is fully compatible with Next.js (webpack & turbopack) since
 * it uses standard dynamic import() instead of the Worker URL pattern.
 */
// --- Suppress MediaPipe WASM informational logs from Next.js dev error overlay ---
// The WASM runtime outputs "INFO: ..." messages via console.error which Next.js
// incorrectly treats as unhandled errors and shows in the red dev overlay.
if (typeof window !== 'undefined') {
  const _origConsoleError = console.error.bind(console);
  console.error = (...args: any[]) => {
    const msg = typeof args[0] === 'string' ? args[0] : '';
    if (msg.startsWith('INFO:') || msg.includes('TensorFlow Lite') || msg.includes('XNNPACK')) return;
    _origConsoleError(...args);
  };
}

// --- Global Singletons to prevent WASM resource conflicts in Next.js/React StrictMode ---
let globalLandmarker: any = null;
let globalResolver: any = null;
let initPromise: Promise<any> | null = null;

export function useMediaPipe(videoRef: RefObject<HTMLVideoElement | null>) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastInferenceTimeRef = useRef<number>(0);
  const isProcessingRef = useRef<boolean>(false);
  const [isReady, setIsReady] = useState(false);

  const { isEnabled, qualityMode, isThrottled, updateMetrics, showTip } = useCoachStore();

  // --- Sampling interval ---
  const getInterval = useCallback((): number => {
    if (isThrottled) return 3000;
    switch (qualityMode) {
      case 'Low Power':     return 1500;
      case 'High Accuracy': return 400;
      case 'Balanced':
      default:              return 800;
    }
  }, [qualityMode, isThrottled]);

  // --- Initialize MediaPipe lazily ---
  useEffect(() => {
    if (typeof window === 'undefined') return; // SSR guard

    let cancelled = false;

    const init = async () => {
      if (globalLandmarker) {
        setIsReady(true);
        return;
      }

      if (initPromise) {
        await initPromise;
        setIsReady(true);
        return;
      }

      initPromise = (async () => {
        try {
          const vision = await import('@mediapipe/tasks-vision');
          const { FaceLandmarker, FilesetResolver } = vision;

          if (!globalResolver) {
            globalResolver = await FilesetResolver.forVisionTasks(
              'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
            );
          }

          globalLandmarker = await FaceLandmarker.createFromOptions(globalResolver, {
            baseOptions: {
              modelAssetPath:
                'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
              delegate: 'GPU',
            },
            outputFaceBlendshapes: false,
            outputFacialTransformationMatrixes: true,
            runningMode: 'VIDEO',
            numFaces: 1,
          });

          // Hidden canvas for inference
          canvasRef.current = document.createElement('canvas');
          canvasRef.current.width = 320;
          canvasRef.current.height = 240;

          setIsReady(true);
        } catch (err) {
          console.warn('[AI Coach] MediaPipe init failed:', err);
          initPromise = null;
        }
      })();

      await initPromise;
    };

    init();

    return () => {
      cancelled = true;
      // We do NOT close the globalLandmarker here to allow reuse across components/mounts
      // The WASM memory persists, which is safer than rapid destroy/re-init
    };
  }, []);

  // --- Process a single frame ---
  const processFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const landmarker = globalLandmarker;

    if (!video || !canvas || !landmarker || video.readyState < 2) return;
    if (isProcessingRef.current) return; // Skip if previous inference still running

    const now = performance.now();
    if (now - lastInferenceTimeRef.current < getInterval()) return;

    isProcessingRef.current = true;
    lastInferenceTimeRef.current = now;

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(video, 0, 0, 320, 240);

      // MediaPipe requires strictly increasing timestamps. 
      // If performance.now() returns the same value (rare but possible), increment it.
      const timestamp = now <= lastInferenceTimeRef.current ? lastInferenceTimeRef.current + 1 : now;
      lastInferenceTimeRef.current = timestamp;

      const results = landmarker.detectForVideo(canvas, timestamp);

      if (results?.faceLandmarks?.[0]) {
        const landmarks = results.faceLandmarks[0];
        const matrix = results.facialTransformationMatrixes?.[0] ?? null;

        const framing = checkFaceFraming(landmarks);
        const posture = checkPosture(matrix);
        const gaze = checkEyeContact(landmarks);

        // Map 0.0-1.0 to 0-100 for UI
        const eyeContactScore = Math.round(gaze.score * 100);
        const postureScore = Math.round(posture.score * 100);
        
        // Engagement is a heuristic blend of gaze and stability
        const rawEngagement = (gaze.score * 0.7 + posture.score * 0.3);
        const engagementScore = Math.round(rawEngagement * 100);

        const eyeContactState = gaze.isLookingAtCamera ? 'Good' : 'Needs Improvement';
        const postureState = posture.isStable ? 'Stable' : 'Leaning';
        const engagementState: 'Focused' | 'Engaged' | 'Slightly Distracted' =
          engagementScore > 80 ? 'Focused' : engagementScore > 50 ? 'Engaged' : 'Slightly Distracted';

        updateMetrics({ 
          eyeContactState, 
          postureState, 
          engagementState,
          eyeContactScore,
          postureScore,
          engagementScore
        });

        // Tip priority: framing > posture > gaze
        if (framing.warningMessage) showTip(framing.warningMessage, 6000);
        else if (posture.warningMessage) showTip(posture.warningMessage, 6000);
        else if (!gaze.isLookingAtCamera) showTip('Try looking closer to the camera', 5000);
      } else {
        updateMetrics({ 
          eyeContactState: 'Unknown', 
          postureState: 'Unknown', 
          engagementState: 'Unknown',
          eyeContactScore: 0,
          postureScore: 0,
          engagementScore: 0
        });
      }
    } catch (err) {
      // Silently swallow inference errors — never break the interview
    } finally {
      isProcessingRef.current = false;
    }
  }, [videoRef, getInterval, updateMetrics, showTip]);

  // --- RAF loop ---
  useEffect(() => {
    if (!isReady || !isEnabled) return;

    const loop = () => {
      processFrame();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [isReady, isEnabled, processFrame]);

  return { isReady };
}
