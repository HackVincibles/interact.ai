import { useEffect } from 'react';
import { useCoachStore } from '../store/useCoachStore';

/**
 * Checks hardware concurrency and device memory to automatically 
 * set an appropriate initial Quality Mode for the AI Coach.
 */
export function useDeviceCapability() {
  const { setQualityMode } = useCoachStore();

  useEffect(() => {
    // Only run once on mount
    const cores = navigator.hardwareConcurrency || 4;
    // @ts-ignore - deviceMemory is not perfectly typed in all environments
    const memory = navigator.deviceMemory || 4; 

    // Heuristic for device strength
    if (cores >= 8 && memory >= 8) {
      // High end
      setQualityMode('High Accuracy');
    } else if (cores <= 4 || memory <= 4) {
      // Low end
      setQualityMode('Low Power');
    } else {
      // Mid range
      setQualityMode('Balanced');
    }
  }, [setQualityMode]);
}
