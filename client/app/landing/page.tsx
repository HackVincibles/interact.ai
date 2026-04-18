"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Mic,
  Code,
  Users,
  GraduationCap,
  Target,
  Trophy,
  ArrowRight,
  Zap,
  Star,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  Brain,
  BarChart3,
  Shield,
} from "lucide-react";

const features = [
  {
    icon: Mic,
    color: "from-blue-500 to-cyan-500",
    glow: "shadow-blue-500/20",
    border: "border-blue-500/20 bg-blue-500/5",
    title: "AI Interview Practice",
    description:
      "Real-time voice mock interviews powered by GPT-4. Get instant, honest feedback on your communication, technical answers, and confidence.",
    tags: ["Voice AI", "Instant Feedback", "Role-specific"],
  },
  {
    icon: Code,
    color: "from-orange-500 to-red-500",
    glow: "shadow-red-500/20",
    border: "border-orange-500/20 bg-orange-500/5",
    title: "Interactive Code Editor",
    description:
      "A fully-featured in-browser IDE supporting 12+ languages. Solve DSA problems and system design challenges without leaving the platform.",
    tags: ["12+ Languages", "DSA Focus", "Real-time Execution"],
  },
  {
    icon: Users,
    color: "from-purple-500 to-pink-500",
    glow: "shadow-purple-500/20",
    border: "border-purple-500/20 bg-purple-500/5",
    title: "Group Discussion Rooms",
    description:
      "AI-moderated group discussion sessions that analyze your soft skills, leadership presence, and communication patterns in real time.",
    tags: ["Soft Skills", "AI Moderation", "Peer Learning"],
  },
  {
    icon: Target,
    color: "from-green-500 to-emerald-500",
    glow: "shadow-green-500/20",
    border: "border-green-500/20 bg-green-500/5",
    title: "AI Job Matcher",
    description:
      "Our AI scans thousands of roles and gives you a compatibility score based on your interview performance, skills, and target companies.",
    tags: ["Smart Scoring", "Skill Gap Analysis", "FAANG Roles"],
  },
  {
    icon: GraduationCap,
    color: "from-primary to-indigo-600",
    glow: "shadow-primary/20",
    border: "border-primary/20 bg-primary/5",
    title: "Prep Resource LMS",
    description:
      "Curated learning paths for SDE, Product, and Data roles. Access interview guides, system design docs and behavioral question banks.",
    tags: ["Curated Content", "System Design", "Behavioral Bank"],
  },
  {
    icon: Trophy,
    color: "from-yellow-500 to-amber-500",
    glow: "shadow-yellow-500/20",
    border: "border-yellow-500/20 bg-yellow-500/5",
    title: "Global Leaderboard",
    description:
      "Compete with candidates worldwide. Your readiness score, session count, and skill badges are tracked and ranked across the community.",
    tags: ["Weekly Ranking", "XP System", "Badges"],
  },
];

const stats = [
  { value: "12+", label: "Programming Languages" },
  { value: "GPT-4", label: "AI Engine" },
  { value: "50+", label: "Interview Templates" },
  { value: "Real-time", label: "AI Feedback" },
];

export default function LandingPage() {
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* ── Navbar ── */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/80 backdrop-blur-xl border-b border-border shadow-lg"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
              <Image src="/logo.svg" alt="Logo" width={22} height={20} />
            </div>
            <span className="text-xl font-black tracking-tighter italic">
              INTERACT<span className="text-primary">AI</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#stats" className="hover:text-foreground transition-colors">Why Us</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link>
          </div>

          <Link href="/sign-up">
            <button className="bg-primary text-black font-black text-sm px-5 py-2.5 rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(var(--primary),0.3)] flex items-center gap-2">
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section
        ref={heroRef}
        className="relative min-h-screen flex flex-col items-center justify-center text-center px-6 pt-24 pb-16 overflow-hidden"
      >
        {/* Background glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-blue-500/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: "1s" }} />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-xs font-black uppercase tracking-widest text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            AI-Powered Interview Platform · Built for Winners
          </div>

          {/* Headline */}
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
            Crack Every Interview.
            <br />
            <span className="text-primary italic">Guaranteed.</span>
          </h1>

          {/* Sub */}
          <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto leading-relaxed">
            InteractAI is a full-stack interview preparation platform with{" "}
            <span className="text-foreground font-bold">AI voice interviews</span>,{" "}
            <span className="text-foreground font-bold">live code challenges</span>, and{" "}
            <span className="text-foreground font-bold">AI-moderated group discussions</span> — all in one place.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/sign-up">
              <button className="px-8 py-4 bg-primary text-black font-black rounded-xl hover:scale-105 transition-transform shadow-[0_0_30px_rgba(var(--primary),0.4)] flex items-center gap-2 text-base">
                Start Practicing Free <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <Link href="/sign-in">
              <button className="px-8 py-4 border border-border bg-muted/50 text-foreground font-bold rounded-xl hover:border-primary/40 hover:bg-primary/5 transition-all text-base">
                Sign In →
              </button>
            </Link>
          </div>

          {/* Scroll cue */}
          <div className="pt-16 flex flex-col items-center gap-2 text-muted-foreground/50">
            <span className="text-[10px] uppercase tracking-widest font-bold">Explore Features</span>
            <ChevronDown className="w-4 h-4 animate-bounce" />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="py-16 border-y border-border bg-muted/20">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label} className="space-y-2">
              <p className="text-4xl font-black text-primary">{s.value}</p>
              <p className="text-xs uppercase tracking-widest font-bold text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
              <Zap className="w-3 h-3" /> Everything You Need
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              One Platform. <span className="text-primary italic">Total Prep.</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">
              From first mock interview to offer letter — we cover every step of the journey.
            </p>
          </div>

          {/* Feature grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat) => {
              const Icon = feat.icon;
              return (
                <div
                  key={feat.title}
                  className={`group relative p-8 rounded-2xl border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${feat.glow} ${feat.border}`}
                >
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feat.color} flex items-center justify-center mb-6 shadow-lg ${feat.glow} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-3 tracking-tight">{feat.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-6">{feat.description}</p>
                  <div className="flex flex-wrap gap-2">
                    {feat.tags.map((tag) => (
                      <span key={tag} className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground uppercase tracking-wide">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Why Us / Differentiators ── */}
      <section className="py-24 px-6 bg-muted/10 border-y border-border">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
                <Brain className="w-3 h-3" /> Why InteractAI?
              </div>
              <h2 className="text-4xl font-black tracking-tighter">
                Not just practice.{" "}
                <span className="text-primary italic">Real readiness.</span>
              </h2>
              <p className="text-muted-foreground font-medium leading-relaxed">
                Most platforms give you questions. We give you a full simulation — voice, code, communication — with AI that thinks like a real interviewer.
              </p>
            </div>
            <ul className="space-y-4">
              {[
                { icon: Shield, text: "Zero fluff — every feature targets real interview scenarios" },
                { icon: BarChart3, text: "Performance analytics that actually tell you what to improve" },
                { icon: Star, text: "AI-generated personalized readiness score updated after each session" },
                { icon: CheckCircle2, text: "Built by engineers who've cracked FAANG, for engineers who will" },
              ].map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Icon className="w-3 h-3 text-primary" />
                  </div>
                  <span className="text-sm font-medium text-foreground/80">{text}</span>
                </li>
              ))}
            </ul>
          </div>
          {/* Visual */}
          <div className="relative">
            <div className="glass-card p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                  <Image src="/logo.svg" alt="Logo" width={22} height={20} />
                </div>
                <div>
                  <p className="font-black text-sm">InteractAI Score</p>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">After 3 Sessions</p>
                </div>
                <span className="ml-auto text-2xl font-black text-primary">87%</span>
              </div>
              {[
                { label: "Communication", val: 90 },
                { label: "Technical Depth", val: 82 },
                { label: "Problem Solving", val: 88 },
                { label: "Confidence", val: 85 },
              ].map((item) => (
                <div key={item.label} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="text-foreground">{item.val}%</span>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-primary to-blue-500 rounded-full"
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Pricing Section ── */}
      <section id="pricing" className="py-24 px-6 bg-muted/10 border-y border-border">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Section header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-[10px] font-black uppercase tracking-widest text-primary">
              <Target className="w-3 h-3" /> Simple Pricing
            </div>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter">
              Choose Your <span className="text-primary italic">Success Plan</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto font-medium">
              Affordable pricing designed for Indian students and professionals. Start free, upgrade when you're ready.
            </p>
          </div>

          {/* Pricing cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Free Plan */}
            <div className="relative p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black">Starter</h3>
                  <p className="text-muted-foreground text-sm">Perfect for getting started</p>
                </div>
                <div className="space-y-2">
                  <span className="text-4xl font-black">Free</span>
                  <p className="text-muted-foreground text-sm">Forever</p>
                </div>
                <ul className="space-y-3">
                  {[
                    "3 AI Interview Sessions/month",
                    "Basic Code Editor Access",
                    "Limited GD Sessions",
                    "Basic Feedback Reports",
                    "Community Access"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <button className="w-full px-6 py-3 border border-border bg-muted/50 text-foreground font-bold rounded-xl hover:bg-primary/5 transition-all">
                    Get Started
                  </button>
                </Link>
              </div>
            </div>

            {/* Pro Plan */}
            <div className="relative p-8 rounded-2xl border-2 border-primary bg-gradient-to-br from-primary/5 to-transparent hover:shadow-xl transition-all scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-black text-[10px] font-black uppercase tracking-widest rounded-full">
                Most Popular
              </div>
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black">Pro</h3>
                  <p className="text-muted-foreground text-sm">For serious candidates</p>
                </div>
                <div className="space-y-2">
                  <span className="text-4xl font-black">₹299</span>
                  <p className="text-muted-foreground text-sm">per month</p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Unlimited AI Interviews",
                    "Full Code Editor Access",
                    "Unlimited GD Sessions",
                    "Advanced Analytics",
                    "Priority Support",
                    "Mock Interview Certificates",
                    "Resume Review AI",
                    "Company Insights"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <button className="w-full px-6 py-3 bg-primary text-black font-black rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                    Start Pro Trial
                  </button>
                </Link>
              </div>
            </div>

            {/* Premium Plan */}
            <div className="relative p-8 rounded-2xl border border-border bg-card hover:shadow-lg transition-all">
              <div className="space-y-6">
                <div>
                  <h3 className="text-2xl font-black">Premium</h3>
                  <p className="text-muted-foreground text-sm">For career accelerators</p>
                </div>
                <div className="space-y-2">
                  <span className="text-4xl font-black">₹599</span>
                  <p className="text-muted-foreground text-sm">per month</p>
                </div>
                <ul className="space-y-3">
                  {[
                    "Everything in Pro",
                    "1-on-1 Mentor Sessions",
                    "Custom Interview Scenarios",
                    "FAANG Company Prep",
                    "Negotiation Training",
                    "Career Path Planning",
                    "Job Referral Network",
                    "24/7 Priority Support"
                  ].map((feature) => (
                    <li key={feature} className="flex items-center gap-3 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <button className="w-full px-6 py-3 border border-border bg-muted/50 text-foreground font-bold rounded-xl hover:bg-primary/5 transition-all">
                    Contact Sales
                  </button>
                </Link>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="text-center space-y-4 pt-8">
            <p className="text-sm text-muted-foreground">
              All plans include 14-day free trial. No credit card required.
            </p>
            <p className="text-xs text-muted-foreground">
              Special discounts available for students and educational institutions.
            </p>
          </div>
        </div>
      </section>

      {/* ── CTA Section ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/8 rounded-full blur-[150px]" />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto space-y-8">
          <h2 className="text-5xl md:text-6xl font-black tracking-tighter">
            Your dream job is{" "}
            <span className="text-primary italic">one session away.</span>
          </h2>
          <p className="text-muted-foreground text-lg font-medium">
            Join thousands of candidates using InteractAI to prepare smarter, not harder.
          </p>
          <Link href="/sign-up">
            <button className="px-10 py-5 bg-primary text-black font-black rounded-xl hover:scale-105 transition-transform shadow-[0_0_40px_rgba(var(--primary),0.4)] text-lg flex items-center gap-3 mx-auto">
              Create Free Account <ArrowRight className="w-5 h-5" />
            </button>
          </Link>
          <p className="text-xs text-muted-foreground font-medium">
            No credit card required. Start practicing in under 60 seconds.
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-12 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.svg" alt="Logo" width={16} height={14} />
            <span className="italic font-black">INTERACT<span className="text-primary">AI</span></span>
          </Link>
          <p>© 2026 InteractAI · Team Invincibles</p>
          <div className="flex items-center gap-6">
            <Link href="/sign-in" className="hover:text-foreground transition-colors">Sign In</Link>
            <Link href="/sign-up" className="hover:text-foreground transition-colors">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
