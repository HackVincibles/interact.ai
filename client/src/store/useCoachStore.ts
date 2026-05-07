import { create } from 'zustand';

export type EngagementState = 'Focused' | 'Engaged' | 'Slightly Distracted' | 'Unknown';
export type QualityMode = 'Low Power' | 'Balanced' | 'High Accuracy';

interface CoachState {
  // Feature toggle
  isEnabled: boolean;
  setIsEnabled: (enabled: boolean) => void;

  // Quality settings
  qualityMode: QualityMode;
  setQualityMode: (mode: QualityMode) => void;

  // Metrics (Strings for accessibility/logic)
  eyeContactState: string;
  postureState: string;
  engagementState: EngagementState;

  // Real-time scores (0-100 for UI bars)
  eyeContactScore: number;
  postureScore: number;
  engagementScore: number;
  
  // Real-time tips
  currentTip: string | null;
  
  // Failsafe state
  isThrottled: boolean;
  
  // Updaters
  updateMetrics: (metrics: Partial<Pick<CoachState, 'eyeContactState' | 'postureState' | 'engagementState' | 'eyeContactScore' | 'postureScore' | 'engagementScore'>>) => void;
  showTip: (tip: string, durationMs?: number) => void;
  clearTip: () => void;
  setThrottled: (throttled: boolean) => void;
}

export const useCoachStore = create<CoachState>((set) => ({
  isEnabled: true, // Default to true, but can be controlled via settings
  setIsEnabled: (enabled) => set({ isEnabled: enabled }),

  qualityMode: 'Balanced',
  setQualityMode: (mode) => set({ qualityMode: mode }),

  eyeContactState: 'Unknown',
  postureState: 'Unknown',
  engagementState: 'Unknown',

  eyeContactScore: 0,
  postureScore: 0,
  engagementScore: 0,
  
  currentTip: null,
  isThrottled: false,

  updateMetrics: (metrics) => set((state) => {
    const hasChanged = 
      (metrics.eyeContactState !== undefined && metrics.eyeContactState !== state.eyeContactState) ||
      (metrics.postureState !== undefined && metrics.postureState !== state.postureState) ||
      (metrics.engagementState !== undefined && metrics.engagementState !== state.engagementState) ||
      (metrics.eyeContactScore !== undefined && metrics.eyeContactScore !== state.eyeContactScore) ||
      (metrics.postureScore !== undefined && metrics.postureScore !== state.postureScore) ||
      (metrics.engagementScore !== undefined && metrics.engagementScore !== state.engagementScore);
      
    if (hasChanged) {
      return { ...state, ...metrics };
    }
    return state;
  }),
  
  showTip: (tip, durationMs = 5000) => {
    set({ currentTip: tip });
    if (durationMs > 0) {
      setTimeout(() => {
        set((state) => {
          // Only clear if it's the same tip (avoid clearing a newer tip)
          if (state.currentTip === tip) {
            return { currentTip: null };
          }
          return state;
        });
      }, durationMs);
    }
  },
  
  clearTip: () => set({ currentTip: null }),
  setThrottled: (throttled) => set({ isThrottled: throttled }),
}));
