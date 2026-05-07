"use client";

import React, { useState } from "react";
import { Mic, Loader2, Sparkles, AlertCircle } from "lucide-react";

interface InterviewSetupProps {
  onStart: (config: {
    role: string;
    techStack: string[];
    difficulty: "easy" | "medium" | "hard";
    totalQuestions: number;
  }) => void;
  isLoading: boolean;
}

const POPULAR_ROLES = [
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Data Scientist",
  "Product Manager",
  "DevOps Engineer",
  "Software Engineer",
];

const POPULAR_TECHS = [
  "React",
  "TypeScript",
  "Node.js",
  "Python",
  "JavaScript",
  "SQL",
  "MongoDB",
  "PostgreSQL",
  "Docker",
  "AWS",
  "Java",
  "C++",
];

export default function InterviewSetup({ onStart, isLoading }: InterviewSetupProps) {
  const [role, setRole] = useState("Software Engineer");
  const [customRole, setCustomRole] = useState("");
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const [customTech, setCustomTech] = useState("");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [totalQuestions, setTotalQuestions] = useState(8);

  const toggleTech = (tech: string) => {
    setSelectedTechs((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
  };

  const addCustomTech = () => {
    const clean = customTech.trim();
    if (clean && !selectedTechs.includes(clean)) {
      setSelectedTechs((prev) => [...prev, clean]);
      setCustomTech("");
    }
  };

  const handleStart = () => {
    const finalRole = role === "Other" && customRole.trim() ? customRole.trim() : role;
    onStart({
      role: finalRole,
      techStack: selectedTechs,
      difficulty,
      totalQuestions,
    });
  };

  return (
    <div className="max-w-2xl mx-auto my-6 px-4">
      <div className="glass-card p-6 md:p-8 space-y-6 border border-border/50 shadow-2xl relative overflow-hidden">
        {/* Background gradient decorative glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-violet-500/10 blur-3xl" />

        {/* Title */}
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-primary mb-3">
            <Mic size={24} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-black tracking-tight uppercase">Setup Your Mock Interview</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Configure your dream role and target tech stack. Our AI interviewer will conduct a live text-based technical round.
          </p>
        </div>

        <div className="space-y-5 pt-2">
          {/* Target Role */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block">
              Target Position / Role
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {POPULAR_ROLES.map((r) => (
                <button
                  key={r}
                  onClick={() => { setRole(r); setCustomRole(""); }}
                  className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                    role === r
                      ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(var(--primary),0.2)]"
                      : "bg-muted/40 border-border/40 hover:bg-muted/80 hover:border-border"
                  }`}
                >
                  {r}
                </button>
              ))}
              <button
                onClick={() => setRole("Other")}
                className={`px-3 py-2 text-xs rounded-xl border font-medium transition-all ${
                  role === "Other"
                    ? "bg-primary text-primary-foreground border-primary shadow-[0_0_12px_rgba(var(--primary),0.2)]"
                    : "bg-muted/40 border-border/40 hover:bg-muted/80 hover:border-border"
                }`}
              >
                Other / Custom
              </button>
            </div>

            {role === "Other" && (
              <input
                value={customRole}
                onChange={(e) => setCustomRole(e.target.value)}
                placeholder="Enter custom role (e.g. React Native Developer)"
                className="w-full mt-2 px-4 py-2.5 text-xs rounded-xl bg-muted/50 border border-border/60 focus:outline-none focus:border-primary/60 text-foreground transition-all"
              />
            )}
          </div>

          {/* Tech Stack */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block">
              Core Tech Stack (Select Multiple)
            </label>
            <div className="flex flex-wrap gap-1.5 max-h-[120px] overflow-y-auto p-1.5 rounded-xl bg-muted/20 border border-border/30 custom-scrollbar">
              {POPULAR_TECHS.map((tech) => (
                <button
                  key={tech}
                  onClick={() => toggleTech(tech)}
                  className={`px-2.5 py-1 text-[11px] rounded-lg border font-medium transition-all ${
                    selectedTechs.includes(tech)
                      ? "bg-violet-500/20 text-violet-400 border-violet-500/40 shadow-sm"
                      : "bg-muted/50 border-border/30 hover:bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {tech}
                </button>
              ))}
            </div>

            <div className="flex gap-2 mt-2">
              <input
                value={customTech}
                onChange={(e) => setCustomTech(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomTech()}
                placeholder="Add other skills (e.g. GraphQL)"
                className="flex-1 px-4 py-2 text-xs rounded-xl bg-muted/50 border border-border/60 focus:outline-none focus:border-primary/60 text-foreground transition-all"
              />
              <button
                onClick={addCustomTech}
                className="px-4 py-2 text-xs font-semibold rounded-xl bg-muted hover:bg-muted/80 border border-border/60 text-foreground transition-all"
              >
                Add
              </button>
            </div>
          </div>

          {/* Difficulty and Question Count */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Difficulty */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block">
                Difficulty Level
              </label>
              <div className="flex rounded-xl bg-muted/40 border border-border/40 p-1">
                {(["easy", "medium", "hard"] as const).map((d) => (
                  <button
                    key={d}
                    onClick={() => setDifficulty(d)}
                    className={`flex-1 py-1.5 text-xs font-semibold capitalize rounded-lg transition-all ${
                      difficulty === d
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions count */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80 block">
                Interview Length (Questions)
              </label>
              <div className="flex rounded-xl bg-muted/40 border border-border/40 p-1">
                {([5, 8, 10] as const).map((num) => (
                  <button
                    key={num}
                    onClick={() => setTotalQuestions(num)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      totalQuestions === num
                        ? "bg-primary text-primary-foreground shadow-sm font-bold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {num} Qs
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Start Button */}
          <div className="pt-4">
            <button
              onClick={handleStart}
              disabled={isLoading || (role === "Other" && !customRole.trim())}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-primary to-violet-600 text-primary-foreground font-bold hover:opacity-95 transition-all shadow-lg hover:shadow-[0_0_24px_rgba(var(--primary),0.2)] hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Preparing AI Interviewer...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>Launch Live AI Interview</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
