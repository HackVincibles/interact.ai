import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

let faceLandmarker: FaceLandmarker | null = null;
let isInitializing = false;

// Initialize MediaPipe FaceLandmarker
async function initializeMediaPipe() {
  if (faceLandmarker || isInitializing) return;
  isInitializing = true;
  try {
    const vision = await FilesetResolver.forVisionTasks(
      // Ensure this matches the version installed
      'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
    );
    
    faceLandmarker = await FaceLandmarker.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU' // Attempt to use GPU in worker
      },
      outputFaceBlendshapes: false, // We only need landmarks for posture/gaze
      outputFacialTransformationMatrixes: true, // Needed for head pose (pitch/yaw/roll)
      runningMode: 'VIDEO',
      numFaces: 1 // Single participant focus for coaching
    });
    
    postMessage({ type: 'INIT_SUCCESS' });
  } catch (error) {
    console.error('Failed to initialize MediaPipe FaceLandmarker in worker:', error);
    postMessage({ type: 'INIT_ERROR', error: String(error) });
  } finally {
    isInitializing = false;
  }
}

// Listen for messages from the main thread
self.onmessage = async (event) => {
  const { type, payload } = event.data;

  if (type === 'INIT') {
    await initializeMediaPipe();
  }

  if (type === 'PROCESS_FRAME') {
    if (!faceLandmarker) return;

    const { imageBitmap, timestamp } = payload;
    
    try {
      // Process the frame
      const results = faceLandmarker.detectForVideo(imageBitmap, timestamp);
      
      // We only need to send back lightweight geometry, not the raw image or heavy tensors
      if (results.faceLandmarks && results.faceLandmarks.length > 0) {
        postMessage({
          type: 'FRAME_RESULTS',
          payload: {
            landmarks: results.faceLandmarks[0],
            transformationMatrix: results.facialTransformationMatrixes?.[0],
            timestamp
          }
        });
      } else {
        postMessage({
          type: 'FRAME_RESULTS',
          payload: {
            landmarks: null,
            transformationMatrix: null,
            timestamp
          }
        });
      }
    } catch (error) {
      console.error('Inference error:', error);
    } finally {
      // Very important: Close the ImageBitmap to prevent memory leaks in the worker!
      imageBitmap.close();
    }
  }
};
