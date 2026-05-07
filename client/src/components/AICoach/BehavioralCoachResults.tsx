"use client";

import React, { useEffect, useState } from 'react';
import { Loader2, UserCheck, Focus, User, Activity } from 'lucide-react';
import EnhancedCard from '@/components/EnhancedCard';

interface BehavioralCoachResultsProps {
  sessionId: string;
  participantId: string;
}

export const BehavioralCoachResults: React.FC<BehavioralCoachResultsProps> = ({ sessionId, participantId }) => {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;

    const fetchSummary = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/analytics/summary/${sessionId}/${participantId}`);
        const data = await response.json();

        if (response.status === 200 && data.status === 'completed') {
          setSummary(data.summary);
          setStats(data.rawStats);
          setLoading(false);
        } else if (response.status === 202) {
          // Still processing, poll again in 3 seconds
          setRetryCount(prev => prev + 1);
          pollInterval = setTimeout(fetchSummary, 3000);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Failed to fetch behavioral summary:', error);
        setLoading(false);
      }
    };

    fetchSummary();

    return () => {
      if (pollInterval) clearTimeout(pollInterval);
    };
  }, [sessionId, participantId]);

  if (loading) {
    return (
      <EnhancedCard variant="glass" className="p-8 flex flex-col items-center justify-center gap-4 min-h-[200px]">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-black uppercase tracking-widest text-muted-foreground animate-pulse">
          AI Coach is analyzing your behavior...
        </p>
      </EnhancedCard>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h3 className="text-xl font-black italic uppercase tracking-wider flex items-center gap-2">
         <UserCheck className="w-5 h-5 text-primary" /> Behavioral Insights
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Engagement Meter */}
        <EnhancedCard variant="glass" className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Focus Score</span>
            <Focus className="w-3 h-3 text-primary" />
          </div>
          <div className="text-xl font-black italic text-white">{Math.round((stats?.engagementRatio || 0) * 100)}%</div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${(stats?.engagementRatio || 0) * 100}%` }} />
          </div>
        </EnhancedCard>

        {/* Eye Contact Meter */}
        <EnhancedCard variant="glass" className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Eye Contact</span>
            <User className="w-3 h-3 text-blue-400" />
          </div>
          <div className="text-xl font-black italic text-white">{Math.round((stats?.eyeContactRatio || 0) * 100)}%</div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400" style={{ width: `${(stats?.eyeContactRatio || 0) * 100}%` }} />
          </div>
        </EnhancedCard>

        {/* Posture Meter */}
        <EnhancedCard variant="glass" className="p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Posture Stability</span>
            <Activity className="w-3 h-3 text-green-400" />
          </div>
          <div className="text-xl font-black italic text-white">{Math.round((stats?.postureRatio || 0) * 100)}%</div>
          <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
            <div className="h-full bg-green-400" style={{ width: `${(stats?.postureRatio || 0) * 100}%` }} />
          </div>
        </EnhancedCard>
      </div>

      <EnhancedCard variant="themed" className="p-6 border-primary/20 bg-primary/5">
        <p className="text-sm font-medium text-white/90 leading-relaxed whitespace-pre-line italic">
          &quot;{summary}&quot;
        </p>
      </EnhancedCard>
    </div>
  );
};
