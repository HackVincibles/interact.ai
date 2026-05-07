"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getGDResults } from "@/lib/actions/gd.action";
import EnhancedCard from "@/components/EnhancedCard";
import EnhancedButton from "@/components/EnhancedButton";
import { 
  Trophy, Users, MessageSquare, BarChart3, 
  TrendingUp, Download, Share2, ArrowLeft,
  CheckCircle2, AlertCircle, HelpCircle, UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { Loader2, FileText, Zap, Target, BookOpen } from "lucide-react";
import { generateCandidatePDF, generateRecruiterPDF } from "@/lib/services/gdPdfReportService";
import { BehavioralCoachResults } from "@/src/components/AICoach/BehavioralCoachResults";


export default function GDResultsPage() {
  const { sessionId } = useParams();
  const router = useRouter();
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const res = await getGDResults(sessionId as string);
        if (res.success) {
          setSession(res.session);
        } else {
          toast.error("Failed to load results");
        }
      } catch (error) {
        toast.error("An error occurred");
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [sessionId]);

  if (loading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold text-white">Session not found</h2>
        <EnhancedButton onClick={() => router.push('/gd')} className="mt-4">Back to Dashboard</EnhancedButton>
      </div>
    );
  }

  const handleExportRecruiterPDF = () => {
    if (!session) return;
    
    generateRecruiterPDF({
      topic: session.topic,
      date: new Date(session.createdAt).toLocaleDateString(),
      sessionId: session._id,
      groupMetrics: {
        synergy: session.analytics?.groupSynergy || 0,
        dominanceBalance: session.analytics?.dominanceBalance || 0,
        participationEquality: session.analytics?.participationEquality || 0,
        topicCoherence: session.analytics?.topicCoherence || 0
      },
      leaderboard: session.leaderboard?.map((l: any) => ({
        rank: l.rank,
        name: l.userName,
        score: l.totalScore,
        verdict: session.recruiterSummary?.recommendations?.find((r: any) => r.userId === l.userId)?.decision || "Hold"
      })) || [],
      overview: session.recruiterSummary?.overview || "No overview available."
    });
    toast.success("Recruiter PDF exported");
  };

  const handleExportCandidatePDF = (participant: any) => {
    const rec = session.recruiterSummary?.recommendations?.find((r: any) => r.userId === participant.userId);
    
    const scores = {
      relevance: participant.relevanceScore || 60,
      communication: participant.communicationScore || 60,
      leadership: participant.leadershipScore || 60,
      collaboration: participant.collaborationScore || 60,
      confidence: participant.confidenceScore || 60,
      criticalThinking: participant.criticalThinkingScore || 60
    };

    const totalScore = Math.round(
      (scores.relevance + scores.communication + scores.leadership + scores.collaboration + scores.confidence + scores.criticalThinking) / 6
    );

    generateCandidatePDF({
      userName: participant.name,
      topic: session.topic,
      date: new Date(session.createdAt).toLocaleDateString(),
      sessionId: session._id,
      scores: {
        total: totalScore,
        ...scores
      },
      metrics: {
        speakingTime: participant.speakingDuration || 0,
        turnCount: participant.turnCount || 0,
        avgTurnLength: participant.avgTurnLength || 0,
        fillerCount: participant.fillerCount || 0
      },
      coaching: participant.personalCoaching || {
        strengths: ["Constructive participation"],
        weaknesses: ["Expand on analytical points"],
        betterPhrasing: [],
        roadmap: "Engage in more diverse topic discussions."
      },
      verdict: rec?.decision || "Hold"
    });
    toast.success(`${participant.name}'s PDF exported`);
  };

  const handleShare = async () => {
    const shareData = {
      title: `GD Report: ${session.topic}`,
      text: `View the performance report for the Group Discussion on ${session.topic}`,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copied to clipboard");
      }
    } catch (err) {
      toast.error("Sharing failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => router.push('/gd')}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors mb-4 text-sm font-bold uppercase tracking-widest"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </button>
          <h1 className="text-4xl font-black text-white italic tracking-tighter">
            GD PERFORMANCE <span className="text-blue-500">REPORT</span>
          </h1>
          <div className="flex items-center gap-3 text-gray-400">
             <div className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase border border-blue-500/20">Archived</div>
             <p className="text-sm">Topic: {session.topic} • {new Date(session.createdAt).toLocaleDateString()}</p>
          </div>
        </div>
        <div className="flex gap-4 w-full md:w-auto">
          <EnhancedButton variant="outline" className="gap-2 flex-1 md:flex-none border-blue-500/50 text-blue-400" onClick={handleExportRecruiterPDF}>
            <Download className="w-4 h-4" /> Export Recruiter PDF
          </EnhancedButton>
          <EnhancedButton className="gap-2 flex-1 md:flex-none" onClick={handleShare}>
            <Share2 className="w-4 h-4" /> Share Report
          </EnhancedButton>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left Column: Leaderboard & Summary */}
        <div className="lg:col-span-2 space-y-10">
          
          {/* Leaderboard */}
          <EnhancedCard variant="glass" className="p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <Trophy className="w-7 h-7 text-yellow-500" />
              Candidate Rankings
            </h2>
            <div className="space-y-4">
              {session.leaderboard?.map((entry: any, index: number) => {
                const rec = session.recruiterSummary?.recommendations?.find((r: any) => r.userId === entry.userId);
                return (
                  <div 
                    key={entry.userId}
                    className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${index === 0 ? 'bg-blue-600/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}
                  >
                    <div className="flex items-center gap-6">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black italic ${index === 0 ? 'bg-blue-500 text-white' : 'bg-white/10 text-gray-400'}`}>
                        #{entry.rank}
                      </div>
                      <div>
                        <h3 className="font-bold text-white text-lg">{entry.userName}</h3>
                        <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-gray-500 mt-1">
                          <span>Total Score: {entry.totalScore}</span>
                          <span>•</span>
                          <span className={rec?.decision === 'Shortlist' ? 'text-green-500' : 'text-gray-500'}>{rec?.decision || 'Evaluated'}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <EnhancedButton 
                        variant="outline" 
                        size="sm"
                        className="rounded-xl h-9 text-xs font-bold border-blue-500/20 text-blue-400"
                        onClick={() => {
                          const participant = session.participants.find((p: any) => p.userId === entry.userId);
                          if (participant) handleExportCandidatePDF(participant);
                        }}
                      >
                        Download PDF
                      </EnhancedButton>
                      <EnhancedButton 
                        variant="outline" 
                        size="sm"
                        className="rounded-xl h-9 text-xs font-bold"
                        onClick={() => router.push(`/dashboard/profile/${entry.userId}`)}
                      >
                        View Profile
                      </EnhancedButton>
                    </div>
                  </div>
                );
              })}
            </div>
          </EnhancedCard>


          {/* Group Analytics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <EnhancedCard variant="themed" className="p-6 bg-blue-600/5">
               <TrendingUp className="w-6 h-6 text-blue-400 mb-4" />
               <div className="text-3xl font-black text-white italic">{session.analytics?.groupSynergy}%</div>
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Group Synergy</div>
            </EnhancedCard>
            <EnhancedCard variant="themed" className="p-6 bg-purple-600/5">
               <BarChart3 className="w-6 h-6 text-purple-400 mb-4" />
               <div className="text-3xl font-black text-white italic">{session.analytics?.dominanceBalance}%</div>
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Dominance Balance</div>
            </EnhancedCard>
            <EnhancedCard variant="themed" className="p-6 bg-green-600/5">
               <Users className="w-6 h-6 text-green-400 mb-4" />
               <div className="text-3xl font-black text-white italic">{session.participants?.length}</div>
               <div className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Participants</div>
            </EnhancedCard>
          </div>

          {/* Recruiter Summary */}
          <EnhancedCard variant="glass" className="p-8">
             <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
              <MessageSquare className="w-7 h-7 text-blue-400" />
              Recruiter's Executive Summary
            </h2>
            <div className="space-y-8">
               <div className="p-6 bg-blue-500/5 rounded-2xl border border-blue-500/10 italic text-gray-300 leading-relaxed">
                 "{session.recruiterSummary?.overview}"
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase text-green-400 tracking-widest flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> Key Strengths
                    </h4>
                    <ul className="space-y-2">
                      {session.recruiterSummary?.strengths?.map((s: string, i: number) => (
                        <li key={i} className="text-sm text-gray-400 flex gap-2">
                          <span className="text-green-500 font-bold">•</span> {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="text-sm font-black uppercase text-red-400 tracking-widest flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> Areas for Improvement
                    </h4>
                    <ul className="space-y-2">
                      {session.recruiterSummary?.weaknesses?.map((w: string, i: number) => (
                        <li key={i} className="text-sm text-gray-400 flex gap-2">
                          <span className="text-red-500 font-bold">•</span> {w}
                        </li>
                      ))}
                    </ul>
                  </div>
               </div>
            </div>
          </EnhancedCard>

          {/* Transcript & Interaction Log (Issue 3) */}
          <EnhancedCard variant="glass" className="p-8">
            <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
              <FileText className="w-7 h-7 text-purple-400" />
              Transcript & Interaction Log
            </h2>
            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-4 custom-scrollbar">
              {session.transcripts?.length > 0 ? (
                session.transcripts.map((t: any, i: number) => (
                  <div key={i} className="flex gap-4 group">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center shrink-0 text-xs font-black italic text-gray-500 border border-white/5">
                      {new Date(t.timestamp).toLocaleTimeString([], { minute: '2-digit', second: '2-digit' })}
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="text-xs font-black uppercase tracking-widest text-blue-400">{t.userName}</div>
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/5 text-sm text-gray-300 leading-relaxed group-hover:border-blue-500/20 transition-all">
                        {t.text}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-10 text-gray-600 italic">No transcript logs recorded for this session.</div>
              )}
            </div>
          </EnhancedCard>

          {/* Personal Performance Deep Dive (Issue 6) */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Zap className="w-7 h-7 text-yellow-500" />
              Personal Performance Coaching
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {session.participants?.map((p: any) => (
                <EnhancedCard key={p.userId} variant="glass" className="p-8 border-white/5 hover:border-yellow-500/20 transition-all">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 font-black italic">
                      {p.name[0]}
                    </div>
                    <div>
                      <h3 className="font-bold text-white">{p.name}</h3>
                      <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Candidate Growth Analysis</div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase text-green-400 flex items-center gap-2">
                        <Target className="w-3 h-3" /> Growth Strengths
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.personalCoaching?.strengths?.map((s: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-green-500/10 text-green-400 text-[10px] font-bold border border-green-500/20">{s}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase text-red-400 flex items-center gap-2">
                        <Zap className="w-3 h-3" /> Refinement Areas
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {p.personalCoaching?.weaknesses?.map((w: string, i: number) => (
                          <span key={i} className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 text-[10px] font-bold border border-red-500/20">{w}</span>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="text-[10px] font-black uppercase text-blue-400 flex items-center gap-2">
                        <MessageSquare className="w-3 h-3" /> Better Phrasing Suggestions
                      </div>
                      <div className="space-y-2">
                        {p.personalCoaching?.betterPhrasing?.map((phrase: any, i: number) => (
                          <div key={i} className="p-3 rounded-xl bg-white/5 border border-white/5 text-[11px]">
                            <div className="text-gray-500 mb-1 line-through">"{phrase.original}"</div>
                            <div className="text-blue-400 font-bold italic">"{phrase.suggested}"</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/10">
                      <div className="text-[10px] font-black uppercase text-yellow-500 mb-2 flex items-center gap-2">
                        <BookOpen className="w-3 h-3" /> Improvement Roadmap
                      </div>
                      <p className="text-[11px] text-gray-400 italic leading-relaxed">
                        {p.personalCoaching?.roadmap}
                      </p>
                    </div>

                    {/* Behavioral Insights */}
                    <div className="pt-4 border-t border-white/5">
                      <BehavioralCoachResults sessionId={session._id} participantId={p.userId} />
                    </div>
                  </div>
                </EnhancedCard>
              ))}
            </div>
          </div>
        </div>


        {/* Right Column: Decisions & Funnel */}
        <div className="space-y-10">
          <EnhancedCard variant="themed" className="p-8 border-blue-500/20 bg-blue-500/5">
            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
              <UserCheck className="w-6 h-6 text-blue-400" />
              Hiring Decisions
            </h2>
            <div className="space-y-6">
              {session.recruiterSummary?.recommendations?.map((rec: any) => {
                const participant = session.participants.find((p: any) => p.userId === rec.userId);
                return (
                  <div key={rec.userId} className="p-4 bg-dark-300 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white truncate">{participant?.name || 'Candidate'}</span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase italic ${
                        rec.decision === 'Shortlist' ? 'bg-green-500/20 text-green-400' :
                        rec.decision === 'Hold' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {rec.decision}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight">
                      {rec.reason}
                    </p>
                    {rec.decision === 'Shortlist' && (
                      <EnhancedButton 
                        size="sm" 
                        className="w-full bg-blue-600 hover:bg-blue-700 h-8 text-[10px] uppercase font-black"
                        onClick={() => router.push(`/interview?target=${rec.userId}`)}
                      >
                        Push to Private Interview
                      </EnhancedButton>
                    )}

                  </div>
                );
              })}
            </div>
          </EnhancedCard>

          <EnhancedCard variant="glass" className="p-6">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-gray-400" />
              Scoring Methodology
            </h3>
            <p className="text-xs text-gray-500 leading-relaxed">
              Our AI evaluates candidates across 8 core placement parameters including **Leadership Initiation**, **Collaborative Sync**, and **Topic Coherence**. Interruption frequency and dominance variance are also factored into the final hiring recommendation.
            </p>
          </EnhancedCard>
        </div>
      </div>
    </div>
  );
}
