import React from 'react';
import { useCoachStore } from '../../store/useCoachStore';
import { Eye, User, Target } from 'lucide-react';

/**
 * Minimal responsive progress-based coaching indicators.
 * Uses shallow store subscriptions for optimal performance.
 */
export const CoachIndicators: React.FC = () => {
  const { 
    eyeContactScore, 
    postureScore, 
    engagementScore,
    eyeContactState,
    postureState,
    engagementState
  } = useCoachStore();

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getTextColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 50) return 'text-orange-400';
    return 'text-red-400';
  };

  return (
    <div className="space-y-4 mb-4">
      {/* Eye Contact Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1.5">
            <Eye size={12} className="text-blue-400" />
            <span>Eye Contact</span>
          </div>
          <span className={getTextColor(eyeContactScore)}>{eyeContactState}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${getBarColor(eyeContactScore)}`}
            style={{ width: `${eyeContactScore}%` }}
          />
        </div>
      </div>

      {/* Posture Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1.5">
            <User size={12} className="text-purple-400" />
            <span>Posture</span>
          </div>
          <span className={getTextColor(postureScore)}>{postureState}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-700 ease-out ${getBarColor(postureScore)}`}
            style={{ width: `${postureScore}%` }}
          />
        </div>
      </div>

      {/* Focus Section */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-widest text-gray-400">
          <div className="flex items-center gap-1.5">
            <Target size={12} className="text-yellow-400" />
            <span>Focus</span>
          </div>
          <span className={getTextColor(engagementScore)}>{engagementState}</span>
        </div>
        <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-1000 ease-out ${getBarColor(engagementScore)}`}
            style={{ width: `${engagementScore}%` }}
          />
        </div>
      </div>
    </div>
  );
};
