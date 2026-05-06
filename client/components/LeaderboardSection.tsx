"use client";

import React from "react";
import EnhancedCard from "./EnhancedCard";
import { Trophy, Medal, Star, Flame, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface LeaderboardUser {
  rank: number;
  id: string;
  name: string;
  avatar?: string;
  xp: number;
  level: number;
  streak: number;
  isCurrentUser?: boolean;
}

interface LeaderboardSectionProps {
  isPreview?: boolean;
  data?: LeaderboardUser[];
}

const LeaderboardSection = ({ isPreview = false, data = [] }: LeaderboardSectionProps) => {
  const displayedData = isPreview ? data.slice(0, 3) : data;

  return (
    <EnhancedCard variant="glass" className="p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Global Leaderboard
          </h2>
          <p className="text-xs text-muted-foreground mt-1">Top candidates ready for hire this week.</p>
        </div>
        <Link href="/leaderboard">
          <button className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            View All <ArrowUpRight className="w-3 h-3" />
          </button>
        </Link>
      </div>

      <div className="space-y-4">
        {displayedData.length === 0 ? (
          <div className="py-10 text-center space-y-2">
             <div className="w-12 h-12 bg-muted/20 rounded-full flex items-center justify-center mx-auto">
                <Star className="w-6 h-6 text-muted-foreground" />
             </div>
             <p className="text-sm text-muted-foreground">No leaderboard data yet.</p>
          </div>
        ) : (
          displayedData.map((user, idx) => (
            <div 
              key={user.id} 
              className={`flex items-center justify-between p-3 rounded-xl transition-all border ${
                user.isCurrentUser 
                  ? "bg-primary/5 border-primary/20 shadow-sm" 
                  : "hover:bg-muted/50 border-transparent"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {user.rank === 1 ? (
                    <Trophy className="w-5 h-5 text-yellow-500" />
                  ) : user.rank === 2 ? (
                    <Medal className="w-5 h-5 text-slate-400" />
                  ) : user.rank === 3 ? (
                    <Medal className="w-5 h-5 text-amber-600" />
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">{user.rank}</span>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <span className="font-bold text-foreground flex items-center gap-2">
                    {user.name}
                    {user.isCurrentUser && (
                      <span className="text-[8px] bg-primary text-black px-1.5 py-0.5 rounded font-black tracking-tighter uppercase">
                        YOU
                      </span>
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">
                    Level {user.level}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-1 text-sm font-black text-foreground">
                    <Star className="w-3 h-3 text-primary fill-primary" />
                    {user.xp}
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">XP</span>
                </div>
                
                <div className="flex flex-col items-end min-w-[60px]">
                  <div className="flex items-center gap-1 text-sm font-black text-orange-500">
                    <Flame className="w-3 h-3 fill-orange-500" />
                    {user.streak}d
                  </div>
                  <span className="text-[9px] text-muted-foreground uppercase font-bold">Streak</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 pt-6 border-t border-border text-center">
        <p className="text-[10px] text-muted-foreground font-medium italic">
          &quot;Success is where preparation and opportunity meet.&quot;
        </p>
      </div>
    </EnhancedCard>
  );
};

export default LeaderboardSection;
