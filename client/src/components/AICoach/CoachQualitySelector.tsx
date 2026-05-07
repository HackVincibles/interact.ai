import React from 'react';
import { useCoachStore, QualityMode } from '../../store/useCoachStore';
import { Cpu } from 'lucide-react';

/**
 * Compact quality selector with minimal styling.
 */
export const CoachQualitySelector: React.FC = () => {
  const { qualityMode, setQualityMode, isThrottled } = useCoachStore();

  return (
    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-4 pt-3 border-t border-white/5">
      <div className="flex items-center gap-1">
        <Cpu size={10} />
        <span>Performance Mode</span>
      </div>
      <select
        className="bg-transparent text-gray-400 outline-none cursor-pointer hover:text-white transition-colors"
        value={qualityMode}
        onChange={(e) => setQualityMode(e.target.value as QualityMode)}
        disabled={isThrottled}
      >
        <option value="Low Power" className="bg-slate-900">Low Power</option>
        <option value="Balanced" className="bg-slate-900">Balanced</option>
        <option value="High Accuracy" className="bg-slate-900">Accurate</option>
      </select>
    </div>
  );
};
