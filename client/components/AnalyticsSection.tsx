"use client";

import { BarChart3, TrendingUp, Calendar, Zap, Award } from "lucide-react";
import EnhancedCard from "./EnhancedCard";
import ActivityHeatmap from "./ActivityHeatmap";

interface AnalyticsSectionProps {
  stats?: {
    avgScore: number;
    totalSessions: number;
    activityLog: any[];
    categoryScores?: Record<string, number>;
  };
}

export default function AnalyticsSection({ stats }: AnalyticsSectionProps) {
  // Default data if none provided
  const performanceData = [
    { label: "Intro", score: stats?.categoryScores?.communicationSkills ?? 0 },
    { label: "Technical", score: stats?.categoryScores?.technicalKnowledge ?? 0 },
    { label: "Behavioral", score: stats?.categoryScores?.problemSolving ?? 0 },
    { label: "Coding", score: stats?.categoryScores?.technicalKnowledge ?? 0 }, // Using tech as proxy for now
    { label: "Communication", score: stats?.categoryScores?.confidenceClarity ?? 0 },
  ];

  const hasData = (stats?.totalSessions ?? 0) > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-black italic uppercase tracking-wider">Performance Overview</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Chart Card */}
        <EnhancedCard variant="glass" className="lg:col-span-2 p-6 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h4 className="font-bold text-light-100 uppercase text-sm">Skills Breakdown</h4>
              <p className="text-xs text-muted-foreground">Recent performance across categories</p>
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>

          <div className="space-y-5">
            {performanceData.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="text-primary">{item.score}%</span>
                </div>
                <div className="h-1.5 w-full bg-muted/20 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-indigo-500 transition-all duration-1000 ease-out" 
                    style={{ width: `${item.score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Activity Heatmap Integration */}
          <div className="pt-4 mt-auto border-t border-white/5">
             <ActivityHeatmap activityLog={stats?.activityLog ?? []} />
          </div>
        </EnhancedCard>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 gap-4">
          <EnhancedCard variant="gradient" className="p-6 flex flex-col justify-between group">
            <div className="flex justify-between items-start">
              <Zap className="w-8 h-8 text-yellow-500 fill-yellow-500 animate-pulse" />
              <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded uppercase tracking-widest">Power Rank</span>
            </div>
            <div className="mt-4">
              <h4 className="text-4xl font-black italic">
                {stats?.avgScore && stats.avgScore > 90 ? "ELITE" : 
                 stats?.avgScore && stats.avgScore > 75 ? "PRO" : 
                 hasData ? "ROOKIE" : "UNRANKED"}
              </h4>
              <p className="text-sm opacity-70 mt-1">
                {hasData 
                  ? `Your average score is ${stats?.avgScore}%.` 
                  : "Complete your first session to get ranked."}
              </p>
            </div>
          </EnhancedCard>

          <EnhancedCard variant="floating" className="p-6 flex flex-col justify-between border-primary/20 bg-primary/5">
            <div className="flex justify-between items-start">
              <Award className="w-8 h-8 text-primary" />
              <span className="text-[10px] font-black bg-primary/20 px-2 py-0.5 rounded uppercase tracking-widest text-primary">Achievements</span>
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-1">Total Impact</p>
              <h4 className="text-lg font-black italic">{stats?.totalSessions ?? 0} Sessions</h4>
              <p className="text-xs opacity-70 mt-1">Keep it up! Consistency is key.</p>
            </div>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
