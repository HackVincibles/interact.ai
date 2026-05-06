"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { completeOnboarding } from "@/lib/actions/stats.action";
import { toast } from "sonner";

const ROLES = [
  "Software Engineer",
  "Frontend Engineer",
  "Backend Engineer",
  "Full Stack Engineer",
  "Data Scientist",
  "Machine Learning Engineer",
  "Product Manager",
  "DevOps / SRE",
  "Mobile Developer",
  "Data Engineer",
];

const COMPANIES = [
  "Google", "Amazon", "Microsoft", "Apple", "Meta",
  "Netflix", "Uber", "Airbnb", "Stripe", "Flipkart",
  "Razorpay", "Zomato", "CRED", "Infosys", "TCS",
];

const EXPERIENCE_LEVELS = [
  { id: "intern", label: "Intern / Fresher", desc: "0–1 years" },
  { id: "junior", label: "Junior", desc: "1–3 years" },
  { id: "mid", label: "Mid-Level", desc: "3–6 years" },
  { id: "senior", label: "Senior", desc: "6+ years" },
];

const WEEKLY_GOALS = [2, 3, 5, 7, 10];

interface OnboardingWizardProps {
  onComplete?: () => void;
}

export default function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [targetRole, setTargetRole] = useState("");
  const [customRole, setCustomRole] = useState("");
  const [targetCompanies, setTargetCompanies] = useState<string[]>([]);
  const [experienceLevel, setExperienceLevel] = useState("");
  const [weeklyGoal, setWeeklyGoal] = useState(5);

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const toggleCompany = (company: string) => {
    setTargetCompanies(prev =>
      prev.includes(company) ? prev.filter(c => c !== company) : [...prev, company]
    );
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const role = targetRole === "Other" ? customRole : targetRole;
      await completeOnboarding({
        targetRole: role,
        targetCompanies,
        experienceLevel,
        weeklyGoal,
      });
      toast.success("🎉 Onboarding complete! Let's start your journey.");
      onComplete?.();
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-2xl bg-[#0a0a0f] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* Progress bar */}
        <div className="h-1 bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-cyan-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-8 pb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-widest text-white/40">
              Step {step} of {totalSteps}
            </span>
            <button
              onClick={() => { onComplete?.(); router.refresh(); }}
              className="text-xs text-white/30 hover:text-white/60 transition-colors"
            >
              Skip for now →
            </button>
          </div>
        </div>

        {/* Step Content */}
        <div className="px-8 pb-8 min-h-[350px]">

          {/* Step 1: Target Role */}
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  What role are you targeting? 🎯
                </h2>
                <p className="text-white/50 text-sm">
                  We'll tailor your questions and prep plan to this.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {ROLES.map(role => (
                  <button
                    key={role}
                    onClick={() => setTargetRole(role)}
                    className={`p-3 rounded-xl text-sm font-semibold text-left border transition-all ${
                      targetRole === role
                        ? "border-purple-500 bg-purple-500/20 text-white"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {role}
                  </button>
                ))}
                <button
                  onClick={() => setTargetRole("Other")}
                  className={`p-3 rounded-xl text-sm font-semibold text-left border transition-all ${
                    targetRole === "Other"
                      ? "border-purple-500 bg-purple-500/20 text-white"
                      : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                  }`}
                >
                  Other
                </button>
              </div>
              {targetRole === "Other" && (
                <input
                  type="text"
                  value={customRole}
                  onChange={e => setCustomRole(e.target.value)}
                  placeholder="e.g. Embedded Systems Engineer"
                  className="w-full bg-white/5 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/30 text-sm focus:outline-none focus:border-purple-500"
                />
              )}
            </div>
          )}

          {/* Step 2: Dream Companies */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  Dream companies? 🏢
                </h2>
                <p className="text-white/50 text-sm">
                  Pick up to 5 companies. We'll weight your prep toward their interview styles.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {COMPANIES.map(company => (
                  <button
                    key={company}
                    onClick={() => toggleCompany(company)}
                    disabled={!targetCompanies.includes(company) && targetCompanies.length >= 5}
                    className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all disabled:opacity-40 ${
                      targetCompanies.includes(company)
                        ? "border-cyan-500 bg-cyan-500/20 text-cyan-300"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {company}
                  </button>
                ))}
              </div>
              <p className="text-white/30 text-xs">
                {targetCompanies.length}/5 selected
              </p>
            </div>
          )}

          {/* Step 3: Experience Level */}
          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  Your experience level? 🧑‍💻
                </h2>
                <p className="text-white/50 text-sm">
                  This helps calibrate question difficulty.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {EXPERIENCE_LEVELS.map(lvl => (
                  <button
                    key={lvl.id}
                    onClick={() => setExperienceLevel(lvl.id)}
                    className={`p-5 rounded-2xl text-left border transition-all ${
                      experienceLevel === lvl.id
                        ? "border-purple-500 bg-purple-500/20"
                        : "border-white/10 bg-white/5 hover:border-white/30"
                    }`}
                  >
                    <div className="font-bold text-white">{lvl.label}</div>
                    <div className="text-white/40 text-xs mt-1">{lvl.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Weekly Goal */}
          {step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-extrabold text-white mb-1">
                  Set your weekly practice goal 🔥
                </h2>
                <p className="text-white/50 text-sm">
                  How many sessions per week do you want to complete?
                </p>
              </div>
              <div className="flex gap-4 flex-wrap">
                {WEEKLY_GOALS.map(goal => (
                  <button
                    key={goal}
                    onClick={() => setWeeklyGoal(goal)}
                    className={`w-20 h-20 rounded-2xl font-black text-2xl border transition-all ${
                      weeklyGoal === goal
                        ? "border-yellow-400 bg-yellow-400/20 text-yellow-300"
                        : "border-white/10 bg-white/5 text-white/60 hover:border-white/30 hover:text-white"
                    }`}
                  >
                    {goal}
                  </button>
                ))}
              </div>
              <p className="text-white/40 text-sm">
                {weeklyGoal} sessions/week · {weeklyGoal * 4} sessions/month · You've got this! 💪
              </p>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="px-8 pb-8 flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 1}
            className="px-6 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/30 text-sm font-bold transition-all disabled:opacity-0"
          >
            ← Back
          </button>

          {step < totalSteps ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={
                (step === 1 && !targetRole && !customRole) ||
                (step === 3 && !experienceLevel)
              }
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40"
            >
              Continue →
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-bold text-sm transition-all hover:opacity-90 disabled:opacity-40 flex items-center gap-2"
            >
              {loading && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {loading ? "Saving..." : "🚀 Launch My Journey"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
