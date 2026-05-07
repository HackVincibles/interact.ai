"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Mic, Code, Users, ArrowRight, GraduationCap, Heart, Trophy, BarChart3, Star, TrendingUp, Zap, Calendar, Target, Award, Loader2, PlaySquare } from "lucide-react";

import { Button } from "@/components/ui/button";
import UserProfile from "@/components/UserProfile";
import CodePracticeEditor from "@/components/CodePracticeEditor";

import EnhancedCard from "@/components/EnhancedCard";
import ReadinessScore from "@/components/ReadinessScore";
import AnalyticsSection from "@/components/AnalyticsSection";
import JobMatchSection from "@/components/JobMatchSection";
import LeaderboardSection from "@/components/LeaderboardSection";
import OnboardingWizard from "@/components/OnboardingWizard";
import FloatingChatWidget from "@/components/chat/FloatingChatWidget";

import { getCurrentUser } from "@/lib/actions/auth.action";
import { getDashboardStats, getLeaderboard } from "@/lib/actions/stats.action";
import { User } from "@/types";

function Home() {
  const router = useRouter();
  const [showCodeEditor, setShowCodeEditor] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any>(null);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  const [isLoading, setIsLoading] = useState(false);
  const [isCodeLoading, setIsCodeLoading] = useState(false);
  const [isGDLoading, setIsGDLoading] = useState(false);


  const [greeting, setGreeting] = useState("Welcome back");

  const fetchData = async () => {
    try {
      const [userData, statsData, leaderboardData] = await Promise.all([
        getCurrentUser(),
        getDashboardStats(),
        getLeaderboard(3)
      ]);
      
      setUser(userData);
      setStats(statsData);
      setLeaderboard(leaderboardData?.leaderboard || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  if (isInitialLoading) {
    return (
      <div className="h-[80vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
        <p className="text-muted-foreground font-bold animate-pulse uppercase tracking-[0.2em] text-xs">Initializing Neural Link...</p>
      </div>
    );
  }

  // Show onboarding if not completed
  if (user && !stats?.user?.onboardingCompleted) {
    return <OnboardingWizard onComplete={fetchData} />;
  }

  if (showCodeEditor) {
    return (
      <div className="h-[calc(100vh-140px)]">
        <CodePracticeEditor onClose={() => setShowCodeEditor(false)} />
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-wider text-primary animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
            </span>
            System Online
          </div>
          <h1 className="text-4xl font-extrabold tracking-tighter">
            {greeting}, <span className="text-primary">{user?.name?.split(" ")[0] || "Candidate"}</span>! 👋
          </h1>
          <p className="text-muted-foreground text-sm font-medium">
            {stats?.user?.sessionsRemaining > 0 
              ? `You're ${stats.user.sessionsRemaining} sessions away from your weekly goal. Keep the momentum!`
              : `You've crushed your weekly goal! Amazing work.`}
          </p>
        </div>

        {/* Smart Resume Practice Card */}
        {stats?.lastSession && (
          <div className="w-full lg:max-w-md group">
            <div className="glass-card p-4 border-l-4 border-l-primary relative overflow-hidden flex items-center gap-4 transition-all hover:translate-x-1">
              <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:rotate-12 transition-transform">
                <Mic className="w-12 h-12" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold bg-primary/20 text-primary px-2 py-0.5 rounded uppercase">RESUME PREP</span>
                  {/* Using stats.lastSession.createdAt if available, otherwise just generic */}
                  <span className="text-[10px] text-muted-foreground">Last session recorded</span>
                </div>
                <h3 className="font-bold text-sm truncate uppercase tracking-tight">
                  {stats.lastSession.type === 'interview' ? 'Mock Interview' : stats.lastSession.type} - {stats.lastSession.role || 'General'}
                </h3>
                <p className="text-[10px] text-muted-foreground uppercase font-black">
                   {stats.lastSession.feedback ? `Score: ${stats.lastSession.feedback.totalScore}%` : 'Feedback pending'}
                </p>
              </div>
              <Link href="/interview">
                <Button size="sm" className="h-8 rounded-lg px-4 font-bold text-[10px] uppercase tracking-widest italic translate-z-0">
                  Continue
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* 🚀 Priority Action Center (The Big 4) */}
      <section className="space-y-6">
        <div className="flex items-center gap-3">
          <Zap className="w-5 h-5 text-yellow-500 fill-yellow-500" />
          <h2 className="text-xl font-bold uppercase tracking-wider italic">Quick Launch</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* AI Interview */}
          <EnhancedCard variant="floating" className="p-5 hover:scale-[1.02] transition-all border-blue-500/20 bg-blue-500/5">
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">AI Interview</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Real-time mock interviews with instant feedback.</p>
              </div>
              <Button
                onClick={() => { setIsLoading(true); router.push("/interview"); }}
                disabled={isLoading}
                className="mt-auto w-full btn-glass text-xs"
              >
                {isLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ArrowRight className="w-3 h-3 mr-2" />}
                Practice Now
              </Button>
            </div>
          </EnhancedCard>

          {/* Try Code */}
          <EnhancedCard variant="gradient" className="p-5 hover:scale-[1.02] transition-all">
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shrink-0 shadow-lg shadow-red-500/20">
                <Code className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Try Code</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Multi-language editor for coding challenges.</p>
              </div>
              <Button
                onClick={() => {
                  setIsCodeLoading(true);
                  setTimeout(() => { setShowCodeEditor(true); setIsCodeLoading(false); }, 500);
                }}
                disabled={isCodeLoading}
                className="mt-auto w-full btn-glass text-xs"
              >
                {isCodeLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ArrowRight className="w-3 h-3 mr-2" />}
                Boot Editor
              </Button>
            </div>
          </EnhancedCard>

          {/* Group Discussion */}
          <EnhancedCard variant="glass" className="p-5 hover:scale-[1.02] transition-all border-purple-500/20">
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/20">
                <Users className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Group Discussion</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">AI-moderated soft skills development sessions.</p>
              </div>
              <Button
                onClick={() => {
                  setIsGDLoading(true);
                  router.push("/gd");
                }}
                disabled={isGDLoading}
                className="mt-auto w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 text-xs font-bold"
              >
                {isGDLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <ArrowRight className="w-3 h-3 mr-2" />}
                Enter GD Mode

              </Button>
            </div>
          </EnhancedCard>

          {/* PlaylistTube */}
          <EnhancedCard variant="floating" className="p-5 border-primary/20 bg-primary/5 hover:scale-[1.02] transition-all group">
            <div className="flex flex-col h-full gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shrink-0 group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] transition-all">
                <PlaySquare className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1 text-emerald-500">Playlist Tube</h3>
                <p className="text-xs text-muted-foreground line-clamp-2">Import YouTube playlists and track your learning progress.</p>
              </div>
              <button
                onClick={() => router.push("/playlist-tube")}
                className="mt-auto w-full inline-flex items-center justify-center h-10 px-4 py-2 bg-emerald-500 text-white hover:bg-emerald-600 rounded-lg text-xs font-bold transition-all shadow-lg shadow-emerald-500/20 active:scale-95 cursor-pointer"
              >
                Track Playlists
                <ArrowRight className="w-3 h-3 ml-2" />
              </button>
            </div>
          </EnhancedCard>
        </div>
      </section>

      {/* 📊 Performance Snapshots Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-4">
        <ReadinessScore 
          score={stats?.user?.readinessScore ?? 0} 
          streak={stats?.user?.streak ?? 0}
          level={stats?.user?.level ?? 1}
          xp={stats?.user?.xp ?? 0}
          totalInterviews={stats?.user?.totalInterviews ?? 0}
        />
        <AnalyticsSection 
          stats={{
            avgScore: stats?.avgScore ?? 0,
            totalSessions: stats?.totalSessions ?? 0,
            activityLog: stats?.user?.activityLog ?? [],
            categoryScores: stats?.recentFeedbacks?.[0]?.categoryScores
          }} 
        />
      </div>

      {/* 🧩 Discovery & Insights Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-4">
        {/* Job Match Preview */}
        <div className="lg:col-span-1">
          <JobMatchSection 
            isPreview={true} 
            showTitle={true} 
            targetRole={stats?.user?.targetRole}
            targetCompanies={stats?.user?.targetCompanies}
          />
        </div>

        {/* Global Leaderboard Preview */}
        <div className="lg:col-span-2 space-y-8">
          <LeaderboardSection isPreview={true} data={leaderboard} />
          
          {/* Quick Boost Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10 relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 opacity-5 group-hover:scale-125 transition-transform duration-1000">
              <Trophy className="w-32 h-32" />
            </div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-bold flex items-center gap-2 italic">
                <Zap className="w-5 h-5 text-primary" />
                DAILY BOOST
              </h3>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-primary text-black">+5% XP</span>
            </div>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm">
              Complete a {stats?.user?.targetRole || 'Software Engineer'} behavioral session today to boost your Readiness Score by +5%.
            </p>
            <Link href="/interview">
              <button className="px-6 py-2.5 bg-white text-black font-black rounded-xl text-xs hover:bg-primary transition-all uppercase tracking-widest italic">
                Start Boost Session
              </button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <footer className="pt-16 pb-8 border-t border-border/40">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
          <p>© 2026 INTERACT.AI | TEAM INVINCIBLES</p>
          <div className="flex items-center gap-1">
            MADE WITH <Heart className="w-3 h-3 text-red-500/50 fill-red-500/20 mx-0.5" /> BY <span className="text-foreground/80 font-black italic">INVINCIBLES</span>
          </div>
        </div>
      </footer>

      {/* Floating Interactive Robot Widget Popover */}
      <FloatingChatWidget />

    </div>
  );
}

export default Home;
