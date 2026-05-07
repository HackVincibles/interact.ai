import dayjs from "dayjs";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mic, Calendar, Star, TrendingUp, CheckCircle2, AlertCircle, Download, ArrowLeft, Briefcase, RefreshCw } from "lucide-react";

import { getFeedbackByInterviewId, getInterviewById } from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/actions/auth.action";
import DownloadReportButton from "@/components/DownloadReportButton";
import EnhancedCard from "@/components/EnhancedCard";
import { BehavioralCoachResults } from "@/src/components/AICoach/BehavioralCoachResults";

const FeedbackPage = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = await getCurrentUser();

  const interview = await getInterviewById(id);
  if (!interview) redirect("/");

  const feedback = await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  });

  const categoryLabels: Record<string, string> = {
    communicationSkills: "Communication Skills",
    technicalKnowledge: "Technical Knowledge",
    problemSolving: "Problem Solving",
    culturalFit: "Cultural Fit",
    confidenceClarity: "Confidence & Clarity",
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-2">
             <ArrowLeft className="w-3 h-3" /> Back to Dashboard
          </Link>
          <h1 className="text-4xl font-extrabold tracking-tighter">
            Interview <span className="text-primary">Performance</span>
          </h1>
          <p className="text-muted-foreground text-sm font-medium uppercase tracking-widest">
             {interview.role} Role · {dayjs(feedback?.createdAt).format("MMM D, YYYY")}
          </p>
        </div>

        <div className="flex gap-3">
           <DownloadReportButton 
            interviewRole={interview.role}
            totalScore={feedback?.totalScore || 0}
            finalAssessment={feedback?.finalAssessment || ""}
            strengths={feedback?.strengths || []}
            improvements={feedback?.areasForImprovement || []}
            categoryScores={feedback?.categoryScores || {}}
            userName={user?.name || "Candidate"}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Overall Score & Assessment */}
        <div className="lg:col-span-2 space-y-8">
          <EnhancedCard variant="gradient" className="p-8 relative overflow-hidden">
             <div className="flex flex-col md:flex-row gap-8 items-center">
                <div className="relative w-32 h-32 flex items-center justify-center">
                   <svg className="w-full h-full transform -rotate-90">
                      <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-white/10" />
                      <circle 
                        cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="10" fill="transparent" 
                        strokeDasharray={364.4}
                        strokeDashoffset={364.4 - (364.4 * (feedback?.totalScore || 0)) / 100}
                        className="text-white transition-all duration-1000 ease-out" 
                      />
                   </svg>
                   <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black italic text-white">{feedback?.totalScore}%</span>
                   </div>
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                   <h2 className="text-2xl font-black italic uppercase tracking-tight text-white">Overall Verdict</h2>
                   <p className="text-white/80 leading-relaxed text-sm italic font-medium">
                      &quot;{feedback?.finalAssessment}&quot;
                   </p>
                </div>
             </div>
          </EnhancedCard>

          {/* Breakdown */}
          <div className="space-y-6">
            <h3 className="text-xl font-black italic uppercase tracking-wider flex items-center gap-2">
               <TrendingUp className="w-5 h-5 text-primary" /> Skill Breakdown
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               {feedback?.categoryScores && Object.entries(feedback.categoryScores).map(([key, score]: any) => (
                 <EnhancedCard key={key} variant="glass" className="p-5 space-y-3">
                    <div className="flex justify-between items-center">
                       <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{categoryLabels[key] || key}</span>
                       <span className="text-sm font-black italic text-primary">{score}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div 
                         className="h-full bg-gradient-to-r from-primary to-indigo-500" 
                         style={{ width: `${score}%` }}
                       />
                    </div>
                 </EnhancedCard>
               ))}
            </div>
          </div>

          {/* Behavioral Results */}
          <BehavioralCoachResults 
            sessionId={id} 
            participantId={user?.id!} 
          />
        </div>

        {/* Right Column: Strengths & Weaknesses */}
        <div className="space-y-8">
           {/* Strengths */}
           <EnhancedCard variant="glass" className="p-6 border-green-500/20 bg-green-500/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-green-400 mb-6 flex items-center gap-2">
                 <CheckCircle2 className="w-4 h-4" /> Core Strengths
              </h3>
              <ul className="space-y-4">
                 {feedback?.strengths?.map((item: string, i: number) => (
                   <li key={i} className="flex gap-3 text-xs font-medium text-white/80 leading-relaxed">
                      <span className="text-green-500 mt-0.5">•</span> {item}
                   </li>
                 ))}
              </ul>
           </EnhancedCard>

           {/* Weaknesses */}
           <EnhancedCard variant="glass" className="p-6 border-red-500/20 bg-red-500/5">
              <h3 className="text-sm font-black uppercase tracking-widest text-red-400 mb-6 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4" /> Development Areas
              </h3>
              <ul className="space-y-4">
                 {feedback?.areasForImprovement?.map((item: string, i: number) => (
                   <li key={i} className="flex gap-3 text-xs font-medium text-white/80 leading-relaxed">
                      <span className="text-red-500 mt-0.5">•</span> {item}
                   </li>
                 ))}
              </ul>
           </EnhancedCard>

           {/* Actions */}
           <div className="flex flex-col gap-3 pt-4">
              <Link href="/matches">
                <Button className="w-full bg-primary text-black font-black uppercase tracking-widest italic py-6 rounded-xl hover:bg-primary/90 transition-all">
                   <Briefcase className="w-4 h-4 mr-2" /> Find Matches
                </Button>
              </Link>
              <Link href={`/interview`}>
                <Button variant="outline" className="w-full border-white/10 bg-white/5 text-white font-black uppercase tracking-widest italic py-6 rounded-xl hover:bg-white/10 transition-all">
                   <RefreshCw className="w-4 h-4 mr-2" /> Retake Practice
                </Button>
              </Link>
           </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPage;
