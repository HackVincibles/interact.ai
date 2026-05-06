"use client";

import React, { useMemo } from "react";
import EnhancedCard from "./EnhancedCard";
import { Building2, ChevronRight, Target, ExternalLink, Sparkles } from "lucide-react";
import Link from "next/link";

interface JobMatchSectionProps {
  isPreview?: boolean;
  showTitle?: boolean;
  targetRole?: string;
  targetCompanies?: string[];
}

const JobMatchSection = ({ 
  isPreview = false, 
  showTitle = true,
  targetRole = "Software Engineer",
  targetCompanies = ["Google", "Amazon", "Meta"]
}: JobMatchSectionProps) => {
  
  // Generate dynamic matches based on user preferences
  const dynamicMatches = useMemo(() => {
    const defaultRequirements = ["System Design", "Algorithms", "Communication"];
    const baseCompanies = targetCompanies.length > 0 ? targetCompanies : ["Google", "Amazon", "Meta"];
    const role = targetRole || "Software Engineer";

    return baseCompanies.map((company, idx) => ({
      company,
      role: role.includes("Engineer") ? role : `${role} Specialist`,
      matchScore: 95 - (idx * 7) - Math.floor(Math.random() * 5),
      requirements: idx === 0 ? ["Scalability", ...defaultRequirements] : ["Problem Solving", ...defaultRequirements],
      color: idx === 0 ? "from-blue-500 to-indigo-600" : idx === 1 ? "from-orange-400 to-orange-600" : "from-purple-500 to-pink-500"
    }));
  }, [targetRole, targetCompanies]);

  const displayedMatches = isPreview ? dynamicMatches.slice(0, 1) : dynamicMatches;

  return (
    <div className="space-y-6">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-black italic uppercase tracking-wider flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            AI Job Match Scorer
          </h2>
          {isPreview ? (
            <Link href="/matches" className="group">
              <span className="text-xs font-bold text-primary flex items-center gap-1 hover:gap-2 transition-all uppercase tracking-widest italic">
                View All <ExternalLink className="w-3 h-3 group-hover:scale-110 transition-transform" />
              </span>
            </Link>
          ) : (
            <div className="flex items-center gap-2 px-2 py-1 rounded bg-primary/10 text-primary">
              <Sparkles className="w-3 h-3 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-widest">Neural Matching</span>
            </div>
          )}
        </div>
      )}

      <div className={isPreview ? "grid grid-cols-1" : "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"}>
        {displayedMatches.map((job, idx) => (
          <EnhancedCard key={idx} variant="glass" className="p-5 group hover:border-primary/50 transition-all overflow-hidden relative">
            {/* Decorative bg */}
            <div className={`absolute -right-8 -bottom-8 w-24 h-24 bg-gradient-to-br ${job.color} opacity-5 blur-2xl group-hover:opacity-10 transition-opacity`} />
            
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all duration-500">
                <Building2 className="w-6 h-6 text-white/40 group-hover:text-primary" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-3xl font-black italic text-white">{job.matchScore}%</span>
                <span className="text-[9px] text-white/40 uppercase font-black tracking-widest">Match Prob.</span>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-white text-lg tracking-tight line-clamp-1 mb-1">{job.role}</h3>
              <p className="text-xs text-primary font-black uppercase tracking-widest italic">{job.company}</p>
            </div>

            <div className="space-y-3 mb-8">
              <p className="text-[9px] uppercase font-black text-white/30 tracking-[0.2em]">Top Alignment Factors</p>
              <div className="flex flex-wrap gap-1.5">
                {job.requirements.map((req, i) => (
                  <span key={i} className="text-[9px] px-2.5 py-1 rounded-full bg-white/5 border border-white/5 text-white/50 font-bold uppercase">
                    {req}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-2 mb-8">
              <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-gradient-to-r ${job.color} transition-all duration-1000 ease-out`}
                  style={{ width: `${job.matchScore}%` }}
                />
              </div>
            </div>

            <Link href="/matches" className="block w-full">
              <button className="w-full py-3 rounded-xl border border-white/10 bg-white/5 text-white/60 hover:bg-primary hover:text-black hover:border-primary transition-all flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-[0.15em] italic relative overflow-hidden group/btn">
                <span className="pl-3">Analyze Fit</span>
                <ChevronRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </Link>
          </EnhancedCard>
        ))}
      </div>
    </div>
  );
};

export default JobMatchSection;
