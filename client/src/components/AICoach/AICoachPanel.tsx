import React, { useState } from 'react';
import { useCoachStore } from '../../store/useCoachStore';
import { useMediaPipe } from '../../hooks/useMediaPipe';
import { useDeviceCapability } from '../../hooks/useDeviceCapability';
import { useFPSMonitor } from '../../utils/fpsMonitor';
import { useAnalyticsSync } from '../../hooks/useAnalyticsSync';
import { CoachIndicators } from './CoachIndicators';
import { CoachTipRenderer } from './CoachTipRenderer';
import { CoachQualitySelector } from './CoachQualitySelector';
import { Bot, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

interface AICoachPanelProps {
  /** 
   * Reference to the HTMLVideoElement displaying the local user's webcam. 
   * MUST be provided for the coach to analyze posture.
   */
  videoRef: React.RefObject<HTMLVideoElement | null>;
  sessionId?: string | null;
  participantId?: string | null;
}

export const AICoachPanel: React.FC<AICoachPanelProps> = ({ videoRef, sessionId = null, participantId = null }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isEnabled, isThrottled } = useCoachStore();
  
  // Auto-detect best quality mode on mount
  useDeviceCapability();
  
  // Monitor FPS and trigger throttling if system lags
  useFPSMonitor();
  
  // Sync analytics to backend
  useAnalyticsSync(sessionId, participantId);
  
  // Initialize and run MediaPipe inference
  const { isReady } = useMediaPipe(videoRef);

  if (!isEnabled) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 w-[260px] md:w-72 bg-slate-900/90 backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl overflow-hidden text-white transition-all duration-300 z-50">
      
      {/* Header */}
      <div 
        className="flex items-center justify-between p-3 bg-white/5 border-b border-white/5 cursor-pointer hover:bg-white/10 transition-colors"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <div className="flex items-center gap-2">
          <div className="relative">
            <Bot size={18} className="text-blue-400" />
            {isReady && !isThrottled && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            )}
          </div>
          <span className="font-semibold text-sm tracking-wide">AI Coach</span>
          
          {isThrottled && (
            <span title="FPS low — inference throttled">
              <AlertTriangle size={14} className="text-yellow-500 ml-1" />
            </span>
          )}
        </div>
        <button className="text-gray-400 hover:text-white transition-colors">
          {isCollapsed ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* Body */}
      {!isCollapsed && (
        <div className="p-4">
          {!isReady ? (
            <div className="text-sm text-gray-400 text-center py-4 animate-pulse">
              Initializing AI Coach...
            </div>
          ) : (
            <div className="animate-in fade-in duration-300">
              <CoachIndicators />
              <CoachTipRenderer />
              <CoachQualitySelector />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
