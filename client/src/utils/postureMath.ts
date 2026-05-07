/**
 * Lightweight geometry calculations for posture and eye contact
 * using MediaPipe FaceLandmarks (Normalized values 0-1)
 */

export interface GazeResult {
  isLookingAtCamera: boolean;
  score: number;
}

export interface PostureResult {
  isCentered: boolean;
  isStable: boolean;
  tilt: 'None' | 'Forward' | 'Backward' | 'Left' | 'Right';
  score: number; // 0.0 to 1.0
  warningMessage?: string;
}

export interface TransformationMatrix {
  rows: number;
  columns: number;
  data: number[];
}

/**
 * Check if the face is roughly centered in the frame.
 */
export function checkFaceFraming(landmarks: { x: number; y: number; z: number }[]): PostureResult {
  // Nose tip is landmark 1
  const nose = landmarks[1];
  
  const isCenteredX = nose.x > 0.35 && nose.x < 0.65;
  const isCenteredY = nose.y > 0.30 && nose.y < 0.70;
  
  let warningMessage;
  if (!isCenteredX || !isCenteredY) {
    if (nose.x <= 0.35) warningMessage = 'Center yourself slightly (move right)';
    else if (nose.x >= 0.65) warningMessage = 'Center yourself slightly (move left)';
    else if (nose.y <= 0.30) warningMessage = 'Move slightly back';
    else if (nose.y >= 0.70) warningMessage = 'Move slightly up';
  }

  // Calculate score based on distance from center (0.5, 0.5)
  const dist = Math.sqrt(Math.pow(nose.x - 0.5, 2) + Math.pow(nose.y - 0.5, 2));
  const score = Math.max(0, 1.0 - dist * 3); // 1.0 at center, drops to 0 at ~0.33 offset

  return {
    isCentered: isCenteredX && isCenteredY,
    isStable: true,
    tilt: 'None',
    score,
    warningMessage
  };
}

/**
 * Extracts Euler angles (pitch, yaw, roll) from a 4x4 transformation matrix.
 * Matrix is flattened in column-major or row-major order (MediaPipe uses row-major).
 */
export function extractHeadRotation(matrix: TransformationMatrix) {
  // MediaPipe transformation matrix is 4x4 row-major
  const m = matrix.data;
  
  // Pitch (X-axis rotation)
  const pitch = Math.atan2(m[6], m[10]);
  
  // Yaw (Y-axis rotation)
  const yaw = Math.atan2(-m[2], Math.sqrt(m[6] * m[6] + m[10] * m[10]));
  
  // Roll (Z-axis rotation)
  const roll = Math.atan2(m[1], m[0]);
  
  // Convert radians to degrees
  return {
    pitch: pitch * (180 / Math.PI),
    yaw: yaw * (180 / Math.PI),
    roll: roll * (180 / Math.PI)
  };
}

/**
 * Checks head posture based on transformation matrix.
 */
export function checkPosture(matrix: TransformationMatrix | null): PostureResult {
  if (!matrix) return { isCentered: true, isStable: true, tilt: 'None', score: 1.0 };

  const { pitch, yaw, roll } = extractHeadRotation(matrix);

  let tilt: PostureResult['tilt'] = 'None';
  let warningMessage;

  // Typical values indicating bad posture/tilt
  if (pitch > 15) {
    tilt = 'Forward';
    warningMessage = 'Sit slightly straighter (avoid leaning forward)';
  } else if (pitch < -15) {
    tilt = 'Backward';
    warningMessage = 'Avoid leaning too far back';
  } else if (Math.abs(yaw) > 25) {
    tilt = yaw > 0 ? 'Right' : 'Left';
    warningMessage = 'Face the camera more directly';
  }

  // Calculate score based on rotations (lower score for more tilt)
  const pitchPenalty = Math.min(1, Math.abs(pitch) / 30);
  const yawPenalty = Math.min(1, Math.abs(yaw) / 45);
  const rollPenalty = Math.min(1, Math.abs(roll) / 20);
  
  const score = Math.max(0, 1.0 - (pitchPenalty * 0.4 + yawPenalty * 0.4 + rollPenalty * 0.2));

  return {
    isCentered: true,
    isStable: tilt === 'None' && Math.abs(roll) < 10,
    tilt,
    score,
    warningMessage
  };
}

/**
 * Eye contact estimation using simple iris-to-eye-corner ratio.
 * MediaPipe landmarks:
 * Left Eye: 33 (inner), 133 (outer), Iris Center: 468
 * Right Eye: 362 (inner), 263 (outer), Iris Center: 473
 */
export function checkEyeContact(landmarks: { x: number; y: number }[]): GazeResult {
  // Left eye
  const leftEyeInner = landmarks[133];
  const leftEyeOuter = landmarks[33];
  const leftIris = landmarks[468];

  // Right eye
  const rightEyeInner = landmarks[362];
  const rightEyeOuter = landmarks[263];
  const rightIris = landmarks[473];

  if (!leftIris || !rightIris) return { isLookingAtCamera: true, score: 1.0 };

  // Calculate ratio of iris position relative to eye corners
  // Ratio ~0.5 means iris is centered
  const getRatio = (inner: {x: number}, outer: {x: number}, iris: {x: number}) => {
    const eyeWidth = Math.abs(outer.x - inner.x);
    if (eyeWidth === 0) return 0.5;
    const irisDist = Math.abs(iris.x - inner.x);
    return irisDist / eyeWidth;
  };

  const leftRatio = getRatio(leftEyeInner, leftEyeOuter, leftIris);
  const rightRatio = getRatio(rightEyeInner, rightEyeOuter, rightIris);
  
  const avgRatio = (leftRatio + rightRatio) / 2;
  
  // If ratio is extremely skewed (< 0.35 or > 0.65), user is likely looking away
  // Thresholds might need tuning based on real-world camera geometry
  const isLookingAtCamera = avgRatio > 0.35 && avgRatio < 0.65;
  
  // Calculate a score (1.0 = perfect center, 0.0 = edge)
  const deviation = Math.abs(avgRatio - 0.5);
  const score = Math.max(0, 1.0 - (deviation * 2));

  return {
    isLookingAtCamera,
    score
  };
}
