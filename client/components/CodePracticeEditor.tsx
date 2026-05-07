"use client";

import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import Editor from "@monaco-editor/react";
import { editor } from "monaco-editor";
import { executeCode, checkServerHealth } from "@/lib/services/judge0";
import { reviewCode } from "@/lib/actions/stats.action";
import { Loader2, Sparkles, AlertCircle, CheckCircle2, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";

interface CodePracticeEditorProps {
  onClose: () => void;
}

const languages = [
  { id: "javascript", label: "JavaScript" },
  { id: "typescript", label: "TypeScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "c", label: "C" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
  { id: "php", label: "PHP" },
  { id: "ruby", label: "Ruby" },
  { id: "swift", label: "Swift" },
];

const defaultCode: Record<string, string> = {
  javascript: `// JavaScript code here\nfunction solution() {\n  // Write your code here\n  \n}\n\nconsole.log(solution());`,
  typescript: `// TypeScript code here\nfunction solution(): void {\n  // Write your code here\n  \n}\n\nconsole.log(solution());`,
  python: `# Python code here\ndef solution():\n    # Write your code here\n    pass\n\nprint(solution())`,
  java: `// Java code here\npublic class Solution {\n    public static void main(String[] args) {\n        // Write your code here\n        \n    }\n}`,
  cpp: `// C++ code here\n#include <iostream>\nusing namespace std;\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
  c: `// C code here\n#include <stdio.h>\n\nint main() {\n    // Write your code here\n    \n    return 0;\n}`,
  csharp: `// C# code here\nusing System;\n\nclass Solution {\n    static void Main() {\n        // Write your code here\n        \n    }\n}`,
  go: `// Go code here\npackage main\n\nimport "fmt"\n\nfunc main() {\n    // Write your code here\n    \n}`,
  rust: `// Rust code here\nfn main() {\n    // Write your code here\n    \n}`,
  php: `<?php\n// PHP code here\nfunction solution() {\n    // Write your code here\n    \n}\n\necho solution();`,
  ruby: `# Ruby code here\ndef solution\n  # Write your code here\n  \nend\n\nputs solution`,
  swift: `// Swift code here\nimport Foundation\n\nfunc solution() {\n    // Write your code here\n    \n}\n\nprint(solution())`,
};

const CodePracticeEditor = ({ onClose }: CodePracticeEditorProps) => {
  const { resolvedTheme } = useTheme();
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(defaultCode["javascript"]);
  const [theme, setTheme] = useState<"vs-dark" | "vs-light">("vs-dark");

  useEffect(() => {
    if (resolvedTheme === "light") {
      setTheme("vs-light");
    } else {
      setTheme("vs-dark");
    }
  }, [resolvedTheme]);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });
  const [isCompiling, setIsCompiling] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [review, setReview] = useState<any>(null);
  const [showReview, setShowReview] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [resultType, setResultType] = useState<"success" | "error" | null>(null);
  const [serverStatus, setServerStatus] = useState<"checking" | "online" | "offline">("checking");

  const handleLanguageChange = (newLang: string) => {
    setLanguage(newLang);
    setCode(defaultCode[newLang] || "// Write your code here\n");
    setReview(null);
  };

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
    }
  };

  const handleEditorDidMount = (editorInstance: editor.IStandaloneCodeEditor) => {
    editorInstance.focus();
    editorInstance.onDidChangeCursorPosition((e) => {
      setCursorPosition({
        line: e.position.lineNumber,
        column: e.position.column,
      });
    });
  };

  const handleCompile = async () => {
    setIsCompiling(true);
    setResult("Compiling...");
    setResultType(null);

    try {
      const executionResult = await executeCode({ code, language });
      if (executionResult.compileOutput || executionResult.error) {
        setResult(executionResult.compileOutput || executionResult.error || "Compilation failed");
        setResultType("error");
      } else {
        setResult("✓ Compilation successful! No errors found.");
        setResultType("success");
      }
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setResultType("error");
    } finally {
      setIsCompiling(false);
    }
  };

  const handleRun = async () => {
    setIsRunning(true);
    setResult("Running...");
    setResultType(null);

    try {
      const executionResult = await executeCode({ code, language });
      let outputText = `[${new Date().toLocaleTimeString()}] Program started\n`;
      if (executionResult.compileOutput) outputText += `Compilation Output:\n${executionResult.compileOutput}\n\n`;
      if (executionResult.error) {
        outputText += `Error:\n${executionResult.error}`;
        setResultType("error");
      } else {
        outputText += `Output:\n${executionResult.output || "(No output)"}`;
        if (executionResult.executionTime) outputText += `\n\nExecution Time: ${executionResult.executionTime}`;
        if (executionResult.memory) outputText += `\nMemory Used: ${(executionResult.memory / 1024).toFixed(2)} MB`;
        outputText += `\nProcess finished with exit code ${executionResult.exitCode ?? 0}`;
        setResultType("success");
      }
      setResult(outputText);
    } catch (error) {
      setResult(`Error: ${error instanceof Error ? error.message : "Unknown error"}`);
      setResultType("error");
    } finally {
      setIsRunning(false);
    }
  };

  const handleReview = async () => {
    if (!code || code.length < 10) {
      toast.error("Please write some code before requesting a review.");
      return;
    }
    setIsReviewing(true);
    setShowReview(true);
    try {
      const reviewData = await reviewCode({ code, language });
      if (reviewData) {
        setReview(reviewData);
      } else {
        toast.error("AI review failed. Please try again.");
      }
    } catch (error) {
      toast.error("An error occurred during AI review.");
    } finally {
      setIsReviewing(false);
    }
  };

  useEffect(() => {
    const checkStatus = async () => {
      const isOnline = await checkServerHealth();
      setServerStatus(isOnline ? "online" : "offline");
    };
    checkStatus();
  }, []);

  return (
    <div className="flex flex-col w-full h-full bg-card rounded-2xl overflow-hidden border border-border shadow-2xl">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">Language:</label>
            <select
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1.5 bg-background border border-border rounded-lg text-xs font-bold text-foreground focus:outline-none focus:border-primary/50 transition-colors"
            >
              {languages.map((lang) => (
                <option key={lang.id} value={lang.id}>{lang.label}</option>
              ))}
            </select>
          </div>

          <button
            onClick={() => setTheme(theme === "vs-dark" ? "vs-light" : "vs-dark")}
            className="p-2 rounded-lg bg-background hover:bg-muted border border-border transition-colors text-muted-foreground"
          >
            {theme === "vs-dark" ? <Sparkles className="w-4 h-4 text-yellow-500" /> : <Sparkles className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button 
            onClick={handleReview}
            disabled={isReviewing}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 cursor-pointer"
          >
            {isReviewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            AI Review
          </button>

          <button 
            onClick={handleCompile}
            disabled={isCompiling}
            className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted text-foreground text-xs font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-50 border border-border cursor-pointer"
          >
            {isCompiling ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            Compile
          </button>

          <button 
            onClick={handleRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-black text-xs font-black uppercase tracking-widest rounded-lg transition-all hover:bg-primary/90 disabled:opacity-50 cursor-pointer"
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
            Run
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-background hover:bg-red-500/15 text-muted-foreground hover:text-red-500 rounded-lg transition-all border border-border cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Result/Review Panel */}
        <div className={`transition-all duration-300 overflow-hidden flex flex-col border-r border-border bg-muted/30 ${showReview ? 'w-[400px]' : 'w-72'}`}>
          <div className="px-4 py-3 bg-muted border-b border-border flex items-center justify-between">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
               {showReview ? <Sparkles className="w-3 h-3 text-purple-400" /> : <AlertCircle className="w-3 h-3 text-primary" />}
               {showReview ? 'AI Code Analysis' : 'Execution Output'}
            </h3>
            {showReview && (
              <button onClick={() => setShowReview(false)} className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          
          <div className="flex-1 overflow-auto p-4 custom-scrollbar">
            {showReview ? (
              isReviewing ? (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center">
                  <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
                  <p className="text-xs font-black uppercase tracking-widest text-white/40 animate-pulse">Analyzing logic & complexity...</p>
                </div>
              ) : review ? (
                <div className="space-y-6">
                  {/* Score & Verdict */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-purple-500/20">
                     <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-black uppercase tracking-widest text-purple-400">Score</span>
                        <span className="text-2xl font-black text-white italic">{review.overallScore}/10</span>
                     </div>
                     <div className={`text-xs font-bold uppercase tracking-widest text-center py-2 rounded-lg ${
                       review.verdict === 'excellent' ? 'bg-green-500/20 text-green-400' :
                       review.verdict === 'good' ? 'bg-blue-500/20 text-blue-400' : 'bg-orange-500/20 text-orange-400'
                     }`}>
                       {review.verdict.replace('_', ' ')}
                     </div>
                  </div>

                  {/* Complexity */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Time</p>
                      <p className="text-xs font-mono text-cyan-400">{review.timeComplexity}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-[8px] font-black text-white/30 uppercase tracking-widest mb-1">Space</p>
                      <p className="text-xs font-mono text-cyan-400">{review.spaceComplexity}</p>
                    </div>
                  </div>

                  {/* Issues */}
                  {review.issues.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40">Critical Issues</h4>
                      {review.issues.map((issue: any, i: number) => (
                        <div key={i} className={`p-3 rounded-xl border ${
                          issue.severity === 'critical' ? 'bg-red-500/5 border-red-500/20' : 'bg-yellow-500/5 border-yellow-500/20'
                        }`}>
                          <p className="text-xs font-bold text-white mb-1">{issue.description}</p>
                          <p className="text-[10px] text-white/50"><span className="text-primary">Fix:</span> {issue.fix}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tips */}
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-2 flex items-center gap-2">
                       <Sparkles className="w-3 h-3" /> Interview Tip
                    </h4>
                    <p className="text-xs text-white/80 leading-relaxed italic">&quot;{review.interviewTip}&quot;</p>
                  </div>
                </div>
              ) : null
            ) : (
              <div className="h-full font-mono text-[11px] leading-relaxed">
                {result ? (
                  <div className={`whitespace-pre-wrap ${resultType === "error" ? "text-red-400" : resultType === "success" ? "text-green-400" : "text-white/60"}`}>
                    {result}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center opacity-20 select-none">
                     <AlertCircle className="w-12 h-12 mb-4" />
                     <p className="font-black uppercase tracking-[0.2em]">Awaiting Input...</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Editor */}
        <div className="flex-1 overflow-hidden relative">
          <Editor
            height="100%"
            language={language}
            value={code}
            theme={theme}
            onChange={handleEditorChange}
            onMount={handleEditorDidMount}
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
              padding: { top: 20 },
              smoothScrolling: true,
              cursorBlinking: "expand",
              automaticLayout: true,
            }}
          />
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-muted border-t border-border text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
        <div className="flex items-center gap-6">
          <span className="text-primary">{language}</span>
          <span>Ln {cursorPosition.line}, Col {cursorPosition.column}</span>
          <span className="flex items-center gap-2">
            <span className={`w-1.5 h-1.5 rounded-full ${serverStatus === "online" ? "bg-green-500" : "bg-red-500 animate-pulse"}`} />
            {serverStatus}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {resultType === "success" && <CheckCircle2 className="w-3 h-3 text-green-500" />}
          {resultType === "error" && <AlertCircle className="w-3 h-3 text-red-500" />}
          {resultType ? resultType : "Ready"}
        </div>
      </div>
    </div>
  );
};

export default CodePracticeEditor;
