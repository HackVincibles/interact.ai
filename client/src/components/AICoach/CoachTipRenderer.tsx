import React from 'react';
import { useCoachStore } from '../../store/useCoachStore';
import { Sparkles } from 'lucide-react';

/**
 * Renders subtle coaching hints that auto-hide.
 */
export const CoachTipRenderer: React.FC = () => {
  const { currentTip } = useCoachStore();

  if (!currentTip) return <div className="h-[46px]" />; // Reserve space to avoid layout shift

  return (
    <div className="mt-2 flex items-center gap-2 px-3 py-2 bg-blue-500/10 border border-blue-500/20 rounded-lg animate-in fade-in zoom-in duration-300">
      <Sparkles size={14} className="text-blue-400 shrink-0" />
      <div className="text-[12px] font-medium text-blue-100 leading-tight">
        {currentTip}
      </div>
    </div>
  );
};
