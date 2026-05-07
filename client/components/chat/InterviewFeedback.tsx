"use client";

import React from "react";
import { Award, ArrowRight, CheckCircle2, TrendingUp, Sparkles, Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeedbackData {
  totalScore: number;
  categoryScores: {
    communicationSkills: number;
    technicalKnowledge: number;
    problemSolving: number;
    culturalFit: number;
    confidenceClarity: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  finalAssessment: string;
  rating: number; // 1-5 stars
}

interface InterviewFeedbackProps {
  feedback: FeedbackData;
  onNewChat: () => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  communicationSkills: "Communication Skills",
  technicalKnowledge: "Technical Knowledge",
  problemSolving: "Problem Solving",
  culturalFit: "Cultural Fit",
  confidenceClarity: "Confidence & Clarity",
};

export default function InterviewFeedback({ feedback, onNewChat }: InterviewFeedbackProps) {
  const { totalScore, categoryScores, strengths, areasForImprovement, finalAssessment, rating } = feedback;

  return (
    <div className="max-w-4xl mx-auto my-6 px-4 animate-scale-in">
      <div className="glass-card p-6 md:p-8 space-y-8 border border-border/50 shadow-2xl relative overflow-hidden">
        {/* Background decorative glow */}
        <div className="absolute -top-32 -left-32 w-64 h-64 rounded-full bg-amber-500/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 w-64 h-64 rounded-full bg-primary/10 blur-3xl" />

        {/* Core summary card */}
        <div className="flex flex-col md:flex-row items-center gap-6 justify-between p-6 bg-gradient-to-br from-amber-500/5 via-primary/5 to-transparent border border-border/40 rounded-2xl">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-500">
              <Award size={14} />
              <span>Interview Performance Report</span>
            </div>
            <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Overall Assessment
            </h2>
            <p className="text-sm text-muted-foreground max-w-lg">
              {finalAssessment}
            </p>

            {/* Rating Stars */}
            <div className="flex items-center justify-center md:justify-start gap-1 pt-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={cn(
                    star <= rating
                      ? "text-amber-400 fill-amber-400"
                      : "text-muted border-muted-foreground/30"
                  )}
                />
              ))}
              <span className="text-xs font-bold text-amber-400 ml-2">
                ({rating}/5 Rating)
              </span>
            </div>
          </div>

          {/* Big Circular Score Display */}
          <div className="relative flex-shrink-0 w-32 h-32 rounded-full border-4 border-amber-500/20 flex flex-col items-center justify-center bg-card shadow-xl select-none group hover:scale-105 transition-all">
            <span className="text-3xl font-black text-amber-400 leading-none">
              {totalScore}%
            </span>
            <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60 mt-1">
              Match Score
            </span>
          </div>
        </div>

        {/* Performance Breakdown & Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category Scores */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground/70 flex items-center gap-1.5">
              <TrendingUp size={14} className="text-primary" />
              Category Metrics Breakdown
            </h3>
            <div className="space-y-3 bg-muted/20 border border-border/30 rounded-2xl p-4 md:p-5">
              {Object.entries(categoryScores).map(([key, val]) => (
                <div key={key} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-foreground/80">
                      {CATEGORY_LABELS[key] || key}
                    </span>
                    <span className="font-bold text-foreground">{val}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        val >= 80
                          ? "bg-gradient-to-r from-emerald-500 to-teal-400"
                          : val >= 60
                          ? "bg-gradient-to-r from-amber-500 to-orange-400"
                          : "bg-gradient-to-r from-red-500 to-rose-400"
                      )}
                      style={{ width: `${val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Strengths & Improvements */}
          <div className="space-y-5">
            {/* Strengths */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-500 flex items-center gap-1.5">
                <CheckCircle2 size={14} />
                Key Strengths
              </h3>
              <ul className="space-y-2 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                {strengths.map((str, i) => (
                  <li key={i} className="text-xs text-foreground/90 flex gap-2.5 items-start leading-relaxed">
                    <span className="text-emerald-500 font-bold mt-0.5">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Improvements */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-amber-500 flex items-center gap-1.5">
                <Sparkles size={14} />
                Areas for Improvement
              </h3>
              <ul className="space-y-2 bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4">
                {areasForImprovement.map((imp, i) => (
                  <li key={i} className="text-xs text-foreground/90 flex gap-2.5 items-start leading-relaxed">
                    <span className="text-amber-500 font-bold mt-0.5">•</span>
                    <span>{imp}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="pt-4 border-t border-border/40 flex justify-end">
          <button
            onClick={onNewChat}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
          >
            <span>Start a New Practice Session</span>
            <ArrowRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
